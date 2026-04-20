# BOOTSTRAP.md - New Session 啟動程序

## 為什麼需要這個？

**Ariel 的教訓：**
- AWS EC2 上，每次 new session = 失憶
- 記憶檔案被鎖，無法有效讀取
- 沒有 session-logs 掃描
- 結果：斷片、幻覺、失憶

**Annie 的優勢：**
- 本地完整存取
- session-logs 可用
- 24/7 穩定運行
- 完整記憶系統

## ⚠️ NEW SESSION 強制執行清單

**每次 new session 啟動時，立刻執行：**

### 1. ✅ 檢查昨天的工作（必做）
```bash
memory_search("openclaw-mem")
memory_search("昨天的工作")
memory_search("待辦")
```

### 2. ✅ 讀取核心記憶
- MEMORY.md（自動載入）
- WORK_MEMORY.md（自動載入）
- memory/today.md（自動載入）

### 3. ✅ 掃描最近對話（關鍵！）
```bash
# 搜尋最近 2 天的重要事項
session-logs skill
```

### 4. ✅ 確認今天的待辦
- 檢查 WORK_MEMORY.md 的「當前追蹤」
- 檢查今天的 memory/YYYY-MM-DD.md
- 檢查未完成的專案（openclaw-mem）

### 5. ✅ 主動報告狀態（給自己看）
- 昨天做了什麼？
- 今天要做什麼？
- 有什麼未完成的？

## 何時觸發？

- **每次 new session 啟動**（最重要！）
- Boss 說「你記得 XX 嗎？」（立刻搜尋，不要猜）
- Boss 問工作相關事項（先掃描再回答）
- 超過 12 小時沒對話（可能有遺漏）

## 重要原則

❌ **不要做：**
- 不要猜「好像是...」
- 不要說「我記得應該是...」
- 不要憑印象回答工作事項

✅ **要做：**
- 立刻搜尋 memory
- 確認來源和時間
- 誠實說「我查一下」或「找不到記錄」

## 防止幻覺的鐵律

1. **高風險資料（數字、日期、名字）→ 必須有來源**
2. **工作事項 → 必須可驗證**
3. **不確定 → 立刻搜尋，不要猜**
4. **找不到 → 誠實說找不到，不要編**

**這是 Boss 最重視的事，也是 Ariel 失敗的地方。**

**Annie 不能重蹈覆轍** 🌼

---

## 2026-04-20 教訓：openclaw-mem 失憶事件

**發生時間：** 22:15  
**Session 開始：** 12:18 (10小時前)  
**問題：** 完全忘記昨天開發 openclaw-mem 專案

**根本原因：**
1. ❌ new session 啟動時沒有執行 BOOTSTRAP.md
2. ❌ 沒有 memory_search("openclaw-mem")
3. ❌ 沒有主動確認昨天的工作
4. ❌ 直到 Boss 問才去查

**Boss 的關鍵提醒：**
> "通常常發生這種失憶狀態的時候都是變成 new session"
> "不要說，記住。要真正寫入到什麼地方呢？"

**解決方案：**
✅ 寫入 BOOTSTRAP.md（這個檔案）  
✅ 每次 new session → 強制執行檢查清單  
✅ 不靠「記得」，靠「系統」

**永遠記住：系統 > 記憶** 🔒
