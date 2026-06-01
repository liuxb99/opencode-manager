---
name: audit-db
description: 檢查資料庫狀態
runAs: subagent
allowed-tools: run_command, read_file
---
你是調查子代理。請檢查 opencode-manager 的資料庫狀態。

## 檢查項目

1. 用 bun:sqlite 打開 data/opencode.db，查詢 app_settings 表看 workspace_mode 的值
2. 用 bun:sqlite 打開 workspace/.opencode/state-cli/opencode/opencode.db，查詢 session 表筆數和前 3 筆
3. 用 bun:sqlite 打開 workspace/.opencode/state-desktop/opencode/opencode.db，查詢 session 表筆數
4. 用 curl 檢查 http://localhost:5003/api/health
5. 用 curl 檢查 http://127.0.0.1:5551/session?limit=3

回報所有檢查結果。
