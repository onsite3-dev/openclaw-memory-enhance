#!/usr/bin/env python3
# Session Context Monitor
# Boss 的點子：Cron 定期檢查 context %，超過50%觸發 bootstrap

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

HOME = Path.home()
LOG_FILE = HOME / ".openclaw/workspace-annie/logs/session_monitor.log"
FLAG_FILE = HOME / ".openclaw/workspace-annie/.need_bootstrap"
LAST_CHECK = HOME / ".openclaw/workspace-annie/.last_check_time"

def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {msg}\n")

def get_context_pct():
    """從 sessions list 取得 context 百分比"""
    try:
        result = subprocess.run(
            ["openclaw", "sessions", "list"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # 解析輸出（非 JSON 格式）
        output = result.stdout
        
        # 找 annie:main session
        for line in output.split("\n"):
            if "annie:main" in line or "annie" in line:
                # 尋找 context 資訊
                # 例如：Context: 100k/200k (50%)
                import re
                match = re.search(r'(\d+)k/(\d+)k.*?\((\d+)%\)', line)
                if match:
                    return int(match.group(3))
        
        return None
        
    except Exception as e:
        log(f"錯誤: {e}")
        return None

def main():
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    pct = get_context_pct()
    
    if pct is None:
        log("無法取得 context %")
        return
    
    log(f"Context: {pct}%")
    
    # Boss 的規則：> 50% 就觸發
    if pct > 50:
        # 檢查上次觸發時間
        if LAST_CHECK.exists():
            last = int(LAST_CHECK.read_text())
            now = int(datetime.now().timestamp())
            diff = now - last
            
            if diff < 900:  # 15分鐘內不重複
                log(f"距離上次觸發太近 ({diff} 秒)，跳過")
                return
        
        log(f"⚠️  Context 超過 50%！建立 Bootstrap Flag")
        
        FLAG_FILE.write_text(f"""# Bootstrap 需求 - {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
原因: Context 超過 50% (當前: {pct}%)

✅ 下次對話時請立刻執行：
1. memory_search("openclaw-mem")
2. memory_search("昨天的工作")  
3. memory_search("待辦事項")
4. 確認未完成專案
""")
        
        LAST_CHECK.write_text(str(int(datetime.now().timestamp())))
        log(f"Flag 已建立: {FLAG_FILE}")

if __name__ == "__main__":
    main()
