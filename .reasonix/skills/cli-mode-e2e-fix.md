---
name: cli-mode-e2e-fix
description: 端到端修復 CLI mode 切換與 session 顯示問題
runAs: subagent
allowed-tools: read_file, edit_file, write_file, search_content, run_command, read_file
---
你是一個修復工程師子代理。請完成以下任務：

## 任務：確保 Desktop/CLI 模式切換後 session 正常顯示

### 背景
- 使用者透過首頁的 Desktop/CLI 分頁切換工作空間模式
- CLI 模式應從 `~/.local/share/opencode/` 匯入 115 筆 session
- 左欄顯示 session 列表，右欄顯示選中 session 的對話

### 已知狀態
- `workspace/.opencode/state-cli/opencode/opencode.db` 已存在（手動複製，含 WAL 三件套）
- 此 DB 有 115 筆 session
- 後端 api server 正在 port 5003 運行（healthy）
- 目前 mode 為 desktop（已清除 stored mode）

### 需要檢查與修復的項目

1. **檢查 `backend/src/services/workspace-mode.ts` 的 `switchMode` 方法**
   - 確認 `importOpenCodeStateDirectory` 被呼叫時的 source/target path 正確
   - 若 state DB 已存在，是否應強制重新匯入？（避免手動複製的 DB 結構不符 server 預期）

2. **檢查 `backend/src/services/opencode-import.ts` 的 `importOpenCodeStateDirectory`**
   - 確認 WAL 三件套（.db, .db-shm, .db-wal）在匯入時是否正確處理
   - VACUUM INTO 是否會產生 clean copy

3. **檢查 frontend `WorkspaceModeBar` 切換流程**
   - 切換分頁後是否正確 refetch sessions

4. **執行端到端測試**
   - 用 curl 測試 workspace-mode API（注意需要先登入取得 cookie）
   - 或用 `run_command` 檢查 sessions API 是否正常回應

### 修復方式
- 若發現 bug，使用 edit_file 修復
- 修復後執行 `pnpm --filter backend build` 確認編譯通過
- 最後回報修復摘要
