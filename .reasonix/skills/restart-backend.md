---
name: restart-backend
description: 重啟後端服務
runAs: subagent
allowed-tools: run_command
---
重啟 opencode-manager 後端服務。

1. 執行 `netstat -ano | findstr ":5003" | findstr "LISTENING"` 找出 PID
2. 執行 `taskkill /F /PID {PID}`
3. 等待 3 秒
4. 執行 `bun run backend/dist/index.js` 啟動後端
5. 等待 10 秒後執行 `curl -s http://localhost:5003/api/health` 確認 healthy

回報所有輸出。
