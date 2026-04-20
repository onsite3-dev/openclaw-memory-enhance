#!/usr/bin/env node
/**
 * OpenClaw Memory Enhance - 智能安裝器
 * 自動適應各種環境和狀況
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const HOME = os.homedir();

// 環境檢測
function detectEnvironment() {
  const env = {
    os: os.platform(),
    home: HOME,
    user: os.userInfo().username,
    pythonPath: null,
    hasCron: false,
    permissions: 'unknown'
  };
  
  // 檢測 Python
  const pythonCandidates = ['/usr/bin/python3', '/usr/local/bin/python3', 'python3'];
  for (const py of pythonCandidates) {
    try {
      execSync(`${py} --version`, { stdio: 'ignore' });
      env.pythonPath = py;
      break;
    } catch {}
  }
  
  // 檢測 Cron
  try {
    execSync('which crontab', { stdio: 'ignore' });
    env.hasCron = true;
  } catch {}
  
  // 檢測權限
  try {
    const testFile = path.join(HOME, '.openclaw', '.write_test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    env.permissions = 'ok';
  } catch {
    env.permissions = 'limited';
  }
  
  return env;
}

// 智能偵測 agents
function detectAgents() {
  const agents = [];
  const openclawDir = path.join(HOME, '.openclaw');
  
  if (!fs.existsSync(openclawDir)) {
    return agents;
  }
  
  // 方法 1: 從 agents/ 目錄
  const agentsPath = path.join(openclawDir, 'agents');
  if (fs.existsSync(agentsPath)) {
    const dirs = fs.readdirSync(agentsPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    
    for (const name of dirs) {
      const workspace = findWorkspace(name);
      if (workspace) {
        agents.push({ name, workspace, source: 'agents/' });
      }
    }
  }
  
  // 方法 2: 從 workspace-* 目錄
  const workspaceDirs = fs.readdirSync(openclawDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith('workspace-'))
    .map(d => d.name);
  
  for (const dir of workspaceDirs) {
    const name = dir.replace('workspace-', '');
    const workspace = path.join(openclawDir, dir);
    
    if (!agents.find(a => a.name === name)) {
      agents.push({ name, workspace, source: 'workspace-*' });
    }
  }
  
  // 方法 3: 從 openclaw.json 配置
  const configPath = path.join(openclawDir, 'openclaw.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.agents && config.agents.list) {
        for (const agent of config.agents.list) {
          if (agent.workspace && !agents.find(a => a.name === agent.id)) {
            agents.push({
              name: agent.id,
              workspace: agent.workspace.replace('~', HOME),
              source: 'config'
            });
          }
        }
      }
    } catch {}
  }
  
  return agents;
}

// 智能尋找 workspace
function findWorkspace(agentName) {
  const candidates = [
    path.join(HOME, `.openclaw/workspace-${agentName}`),
    path.join(HOME, `.openclaw/workspace`),
    path.join(HOME, `.openclaw/agents/${agentName}/workspace`),
    path.join(HOME, `.openclaw/agents/${agentName}`)
  ];
  
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      // 驗證是否真的是 workspace（有 MEMORY.md 或 SOUL.md）
      if (fs.existsSync(path.join(p, 'MEMORY.md')) || 
          fs.existsSync(path.join(p, 'SOUL.md')) ||
          fs.existsSync(path.join(p, 'AGENTS.md'))) {
        return p;
      }
    }
  }
  
  return null;
}

// 檢查已安裝狀態
function checkInstalled(workspace) {
  const status = {
    bootstrap: fs.existsSync(path.join(workspace, 'BOOTSTRAP.md')),
    monitor: fs.existsSync(path.join(workspace, 'scripts', 'session_monitor.py')),
    enhanced: false
  };
  
  // 檢查是否已經是增強版
  if (status.bootstrap) {
    const content = fs.readFileSync(path.join(workspace, 'BOOTSTRAP.md'), 'utf-8');
    status.enhanced = content.includes('openclaw-mem') || content.includes('Session Context Monitor');
  }
  
  return status;
}

// 安裝到 workspace（智能版）
function installToWorkspace(workspace, agentName, env, options = {}) {
  const dryRun = options.dryRun || false;
  const force = options.force || false;
  
  console.log(`\n📦 ${agentName} (${workspace})`);
  
  const status = checkInstalled(workspace);
  
  if (status.enhanced && !force) {
    console.log('  ⚠ 已安裝增強版，跳過（使用 --force 重新安裝）');
    return { success: true, skipped: true };
  }
  
  if (dryRun) {
    console.log('  [DRY RUN] 模擬安裝...');
  }
  
  try {
    // 1. BOOTSTRAP.md
    const bootstrapSrc = path.join(__dirname, 'templates', 'BOOTSTRAP.md');
    const bootstrapDst = path.join(workspace, 'BOOTSTRAP.md');
    
    if (fs.existsSync(bootstrapDst) && !dryRun) {
      const backup = `${bootstrapDst}.backup.${Date.now()}`;
      fs.copyFileSync(bootstrapDst, backup);
      console.log(`  ✓ 備份: ${path.basename(backup)}`);
    }
    
    if (!dryRun) {
      fs.copyFileSync(bootstrapSrc, bootstrapDst);
    }
    console.log('  ✓ BOOTSTRAP.md');
    
    // 2. session_monitor.py
    const scriptsDir = path.join(workspace, 'scripts');
    if (!fs.existsSync(scriptsDir) && !dryRun) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }
    
    const monitorSrc = path.join(__dirname, 'templates', 'session_monitor.py');
    const monitorDst = path.join(scriptsDir, 'session_monitor.py');
    
    if (!dryRun) {
      fs.copyFileSync(monitorSrc, monitorDst);
      try {
        fs.chmodSync(monitorDst, 0o755);
      } catch {
        console.log('  ⚠ 無法設定執行權限（可能需要手動 chmod +x）');
      }
    }
    console.log('  ✓ session_monitor.py');
    
    // 3. Cron job（智能處理）
    if (env.hasCron && env.pythonPath) {
      const cronLine = `*/10 * * * * ${env.pythonPath} ${monitorDst}`;
      
      try {
        const currentCron = execSync('crontab -l 2>/dev/null || true', { encoding: 'utf-8' });
        
        if (!currentCron.includes('session_monitor.py') && !dryRun) {
          const newCron = currentCron.trim() + `\n${cronLine}\n`;
          execSync(`printf "${newCron.replace(/"/g, '\\"')}" | crontab -`);
          console.log('  ✓ Cron job (每 10 分鐘)');
        } else if (currentCron.includes('session_monitor.py')) {
          console.log('  ⚠ Cron job 已存在');
        } else {
          console.log('  ✓ Cron job (模擬)');
        }
      } catch (err) {
        console.log('  ⚠ Cron 設定失敗（請手動執行 crontab -e）');
        console.log(`     新增: ${cronLine}`);
      }
    } else {
      console.log('  ⚠ 無 Cron 或 Python，跳過自動任務');
      console.log('     手動執行: python3 scripts/session_monitor.py');
    }
    
    // 4. MEMORY.md（可選）
    const memoryPath = path.join(workspace, 'MEMORY.md');
    
    if (fs.existsSync(memoryPath) && !dryRun) {
      let memory = fs.readFileSync(memoryPath, 'utf-8');
      
      if (!memory.includes('Memory System Enhancement')) {
        memory += `\n\n---\n\n## Memory System Enhancement\n\n**已安裝：v1.0.0** ($(new Date().toISOString().split('T')[0]})\n- Session Context Monitor\n- Bootstrap 強制清單\n- 自動失憶檢測\n\n**系統 > 記憶**\n`;
        
        fs.writeFileSync(memoryPath, memory);
        console.log('  ✓ MEMORY.md 已更新');
      }
    } else if (!fs.existsSync(memoryPath)) {
      console.log('  ⚠ 無 MEMORY.md（建議手動建立）');
    }
    
    return { success: true, skipped: false };
    
  } catch (err) {
    console.log(`  ❌ 安裝失敗: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// 主程式
function main() {
  const args = process.argv.slice(2);
  const flags = {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    verbose: args.includes('--verbose')
  };
  
  console.log('🌼 OpenClaw Memory Enhance - 智能安裝器\n');
  
  if (flags.dryRun) {
    console.log('⚠️  DRY RUN 模式（不會實際修改檔案）\n');
  }
  
  // 環境檢測
  console.log('🔍 檢測環境...');
  const env = detectEnvironment();
  console.log(`  OS: ${env.os}`);
  console.log(`  User: ${env.user}`);
  console.log(`  Python: ${env.pythonPath || '未找到'}`);
  console.log(`  Cron: ${env.hasCron ? '可用' : '不可用'}`);
  console.log(`  權限: ${env.permissions}`);
  
  if (env.permissions === 'limited') {
    console.log('\n⚠️  警告：權限受限，某些操作可能失敗');
  }
  
  // 偵測 agents
  console.log('\n🔍 偵測 agents...');
  const agents = detectAgents();
  
  if (agents.length === 0) {
    console.log('❌ 找不到任何 OpenClaw agents');
    console.log('請確認：');
    console.log('  - ~/.openclaw/ 目錄存在');
    console.log('  - 至少有一個 agent workspace');
    return;
  }
  
  console.log(`  找到 ${agents.length} 個 agent(s):\n`);
  
  // 安裝
  const results = [];
  
  for (const agent of agents) {
    const result = installToWorkspace(agent.workspace, agent.name, env, flags);
    results.push({ agent, result });
  }
  
  // 總結
  console.log('\n' + '='.repeat(50));
  const successful = results.filter(r => r.result.success && !r.result.skipped).length;
  const skipped = results.filter(r => r.result.skipped).length;
  const failed = results.filter(r => !r.result.success).length;
  
  console.log(`\n✅ 成功: ${successful}`);
  if (skipped > 0) console.log(`⚠️  跳過: ${skipped}`);
  if (failed > 0) console.log(`❌ 失敗: ${failed}`);
  
  if (!flags.dryRun) {
    console.log('\n📋 驗證安裝：');
    console.log('  tail -f ~/.openclaw/workspace-*/logs/session_monitor.log');
    console.log('  cat ~/.openclaw/workspace-*/.need_bootstrap');
  }
  
  console.log('\n🎉 完成！');
}

if (require.main === module) {
  main();
}

module.exports = { detectEnvironment, detectAgents, findWorkspace, installToWorkspace };
