---
name: verify-state
description: 驗證後端與資料庫狀態
runAs: subagent
allowed-tools: run_command, read_file
---
你是測試子代理。請驗證 opencode-manager 的當前狀態。

## 驗證項目
1. 用 run_command 執行 `curl -s http://localhost:5003/api/health` — 確認 healthy
2. 用 run_command 執行 `curl -s http://127.0.0.1:5551/session?limit=3` — 確認 OpenCode server session 數量
3. 用 run_command 執行 `bun -e "var d=new(require('bun:sqlite').Database)('data/opencode.db');var r=d.query('SELECT value FROM app_settings WHERE key=\\'workspace_mode\\'').get();console.log(JSON.stringify(r));d.close()"` — 確認當前 mode
4. 用 run_command 執行 `bun -e "try{var d=new(require('bun:sqlite').Database)('workspace/.opencode/state-cli/opencode/opencode.db',{readonly:true});var r=d.query('SELECT COUNT(*) as c FROM session').get();console.log('CLI sessions:',JSON.stringify(r));d.close()}catch(e){console.log('err:'+e.message)}"` — 確認 CLI 狀態
5. 用 run_command 執行 `bun -e "try{var d=new(require('bun:sqlite').Database)('workspace/.opencode/state-desktop/opencode/opencode.db',{readonly:true});var r=d.query('SELECT COUNT(*) as c FROM session').get();console.log('Desktop sessions:',JSON.stringify(r));d.close()}catch(e){console.log('err:'+e.message)}"` — 確認 Desktop 狀態

回報所有結果。
