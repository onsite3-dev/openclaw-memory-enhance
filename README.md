# OpenClaw Memory Enhance

**智能安裝，自動適應，完整測試**

## 快速開始

```bash
# 安裝
npm install -g openclaw-memory-enhance
openclaw-memory-enhance

# 測試
openclaw-memory-enhance-test
```

## 測試工具

### 完整測試
```bash
node test.js
```

**測試項目：**
1. ✅ 環境偵測（OS/Python/Cron/權限）
2. ✅ Agent 偵測（多路徑搜尋）
3. ✅ 模板檔案完整性
4. ✅ session_monitor.py 語法
5. ✅ Bot 記憶檢查行為
6. ✅ Cron 設定狀態

**輸出範例：**
```
🧪 OpenClaw Memory Enhance - 測試工具

1️⃣  測試環境偵測
  OS: darwin
  User: annie
  Python: /usr/bin/python3
  Cron: ✅
  權限: ok
  ✅ 環境檢測通過

2️⃣  測試 Agent 偵測
  找到 2 個 agent(s):
    - annie (workspace-*)
      /Users/annie/.openclaw/workspace-annie
    - iris (agents/)
      /Users/iris/.openclaw/workspace
  ✅ Agent 偵測通過

...

📊 測試結果總結
  ✅ environment
  ✅ agentDetection
  ✅ templates
  ✅ monitorScript
  ✅ botBehavior
  ✅ cronSetup

總計: 6/6 通過

🎉 所有測試通過！系統就緒。
```

### Bot 行為測試

測試 Bot 是否會：
1. 讀取 BOOTSTRAP.md 檢查清單
2. 檢測 .need_bootstrap flag
3. 執行 memory_search

**模擬結果：**
```
5️⃣  測試 Bot 記憶檢查行為
  使用 agent: annie
  ✅ BOOTSTRAP.md 包含記憶檢查
  ✅ 找到 .need_bootstrap flag:
---
# Bootstrap 需求 - 2026-04-20 22:27
原因: Context 超過 50% (當前: 72%)

✅ 下次對話時請立刻執行：
1. memory_search("openclaw-mem")
2. memory_search("昨天的工作")  
3. memory_search("待辦事項")
4. 確認未完成專案
---

  🤖 Bot 應該執行的動作:
    1. memory_search("openclaw-mem")
    2. memory_search("昨天的工作")
    3. memory_search("待辦事項")
    4. 確認未完成專案

  ✅ Bot 行為模擬通過
```

## 安裝選項

```bash
# 正常安裝
openclaw-memory-enhance

# 預覽模式（不修改檔案）
openclaw-memory-enhance --dry-run

# 強制重新安裝
openclaw-memory-enhance --force

# 測試系統
openclaw-memory-enhance-test
```

## CI/CD 整合

```yaml
# GitHub Actions 範例
- name: Test Memory Enhancement
  run: |
    npm install -g openclaw-memory-enhance
    openclaw-memory-enhance-test
```

## 授權

MIT License

---

**開發者：** Annie  
**需求：** Boss 要求「加測試」
