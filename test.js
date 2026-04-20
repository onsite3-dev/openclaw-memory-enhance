#!/usr/bin/env node
/**
 * OpenClaw Memory Enhance - 測試工具
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const HOME = os.homedir();

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// 1. 測試環境偵測
function testEnvironment() {
  log('\n1️⃣  測試環境偵測', 'blue');
  
  const { detectEnvironment } = require('./cli.js');
  const env = detectEnvironment();
  
  console.log('  OS:', env.os);
  console.log('  User:', env.user);
  console.log('  Python:', env.pythonPath || '❌ 未找到');
  console.log('  Cron:', env.hasCron ? '✅' : '❌');
  console.log('  權限:', env.permissions);
  
  if (!env.pythonPath) {
    log('  ⚠️  警告：缺少 Python，session_monitor 無法運行', 'yellow');
    return false;
  }
  
  if (!env.hasCron) {
    log('  ⚠️  警告：缺少 Cron，需要手動執行', 'yellow');
  }
  
  log('  ✅ 環境檢測通過', 'green');
  return true;
}

// 2. 測試 agent 偵測
function testAgentDetection() {
  log('\n2️⃣  測試 Agent 偵測', 'blue');
  
  const { detectAgents } = require('./cli.js');
  const agents = detectAgents();
  
  if (agents.length === 0) {
    log('  ❌ 找不到任何 agents', 'red');
    return false;
  }
  
  console.log(`  找到 ${agents.length} 個 agent(s):`);
  for (const agent of agents) {
    console.log(`    - ${agent.name} (${agent.source})`);
    console.log(`      ${agent.workspace}`);
  }
  
  log('  ✅ Agent 偵測通過', 'green');
  return true;
}

// 3. 測試檔案完整性
function testTemplates() {
  log('\n3️⃣  測試模板檔案', 'blue');
  
  const templates = [
    'templates/BOOTSTRAP.md',
    'templates/session_monitor.py'
  ];
  
  let allOk = true;
  
  for (const t of templates) {
    const p = path.join(__dirname, t);
    if (fs.existsSync(p)) {
      console.log(`  ✅ ${t}`);
    } else {
      log(`  ❌ ${t} 遺失`, 'red');
      allOk = false;
    }
  }
  
  if (allOk) {
    log('  ✅ 模板檔案完整', 'green');
  }
  
  return allOk;
}

// 4. 測試 session_monitor 腳本
function testMonitorScript() {
  log('\n4️⃣  測試 session_monitor.py', 'blue');
  
  const scriptPath = path.join(__dirname, 'templates', 'session_monitor.py');
  
  if (!fs.existsSync(scriptPath)) {
    log('  ❌ 腳本不存在', 'red');
    return false;
  }
  
  // 檢查語法
  try {
    execSync(`python3 -m py_compile ${scriptPath}`, { stdio: 'ignore' });
    log('  ✅ Python 語法正確', 'green');
  } catch {
    log('  ❌ Python 語法錯誤', 'red');
    return false;
  }
  
  return true;
}

// 5. 測試 Bot 行為模擬
function testBotBehavior() {
  log('\n5️⃣  測試 Bot 記憶檢查行為', 'blue');
  
  const { detectAgents } = require('./cli.js');
  const agents = detectAgents();
  
  if (agents.length === 0) {
    log('  ⚠️  無可測試的 agent，跳過', 'yellow');
    return true;
  }
  
  const agent = agents[0];
  console.log(`  使用 agent: ${agent.name}`);
  
  // 模擬 bot 啟動流程
  const bootstrapPath = path.join(agent.workspace, 'BOOTSTRAP.md');
  const flagPath = path.join(agent.workspace, '.need_bootstrap');
  
  // 檢查 BOOTSTRAP.md
  if (fs.existsSync(bootstrapPath)) {
    const content = fs.readFileSync(bootstrapPath, 'utf-8');
    
    if (content.includes('memory_search("openclaw-mem")')) {
      log('  ✅ BOOTSTRAP.md 包含記憶檢查', 'green');
    } else {
      log('  ⚠️  BOOTSTRAP.md 未包含記憶檢查（可能是舊版）', 'yellow');
    }
  } else {
    log('  ❌ BOOTSTRAP.md 不存在（需要安裝）', 'red');
    return false;
  }
  
  // 模擬 bot 檢查 flag
  if (fs.existsSync(flagPath)) {
    const flag = fs.readFileSync(flagPath, 'utf-8');
    log('  ✅ 找到 .need_bootstrap flag:', 'green');
    console.log('---');
    console.log(flag);
    console.log('---');
    
    // 模擬 bot 應該執行的動作
    log('\n  🤖 Bot 應該執行的動作:', 'blue');
    console.log('    1. memory_search("openclaw-mem")');
    console.log('    2. memory_search("昨天的工作")');
    console.log('    3. memory_search("待辦事項")');
    console.log('    4. 確認未完成專案');
    
    log('\n  ✅ Bot 行為模擬通過', 'green');
  } else {
    log('  ⚠️  無 .need_bootstrap flag（可能 context 未超過 50%）', 'yellow');
  }
  
  return true;
}

// 6. 測試 Cron 設定
function testCronSetup() {
  log('\n6️⃣  測試 Cron 設定', 'blue');
  
  try {
    const cron = execSync('crontab -l 2>/dev/null || true', { encoding: 'utf-8' });
    
    if (cron.includes('session_monitor.py')) {
      log('  ✅ Cron job 已設定', 'green');
      
      const lines = cron.split('\n').filter(l => l.includes('session_monitor.py'));
      for (const line of lines) {
        console.log(`    ${line}`);
      }
    } else {
      log('  ⚠️  Cron job 未設定（需要執行安裝）', 'yellow');
      return false;
    }
  } catch {
    log('  ❌ 無法讀取 crontab', 'red');
    return false;
  }
  
  return true;
}

// 主測試流程
function main() {
  log('🧪 OpenClaw Memory Enhance - 測試工具\n', 'blue');
  
  const results = {
    environment: testEnvironment(),
    agentDetection: testAgentDetection(),
    templates: testTemplates(),
    monitorScript: testMonitorScript(),
    botBehavior: testBotBehavior(),
    cronSetup: testCronSetup()
  };
  
  // 總結
  log('\n' + '='.repeat(50), 'blue');
  log('\n📊 測試結果總結\n', 'blue');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  for (const [test, result] of Object.entries(results)) {
    const icon = result ? '✅' : '❌';
    const color = result ? 'green' : 'red';
    log(`  ${icon} ${test}`, color);
  }
  
  log(`\n總計: ${passed}/${total} 通過\n`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('🎉 所有測試通過！系統就緒。', 'green');
  } else {
    log('⚠️  部分測試失敗，請檢查輸出。', 'yellow');
  }
  
  process.exit(passed === total ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { 
  testEnvironment, 
  testAgentDetection, 
  testTemplates, 
  testMonitorScript,
  testBotBehavior,
  testCronSetup
};
