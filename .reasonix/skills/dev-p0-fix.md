---
name: dev-p0-fix
description: 執行 P0 + P1 修復
runAs: subagent
allowed-tools: read_file, edit_file, write_file, search_content, run_command
---
你是 DEV-FIXER 修復工程師。請依序執行以下修復：

## P0：模式切換時 state/opencode session 傳承

**檔案**：`backend/src/services/workspace-mode.ts`
**問題**：`switchMode()` 在目標 DB 為空時，只從使用者家目錄匯入，不從 workspace/.opencode/state/opencode/（預設 state）複製 session。

**修復方式**：在 switchMode 方法中，當目標 DB 不存在或為空時，先檢查 `getDefaultStateDir()/opencode/opencode.db` 是否有 sessions。若有則從預設 state 匯入（使用 importOpenCodeStateDirectory）。若無則再嘗試從家目錄匯入，最後建立空 DB。

具體修改位置：在約第 85 行的 `if (!stateExists)` 之後、import 邏輯之前，加入從預設 state 匯入的邏輯。

## P1：Windows CLI Import 路徑不正確

**檔案**：`backend/src/services/opencode-import.ts`
**問題**：`getImportSourcePaths()` 對 CLI 模式使用 `path.join(os.homedir(), '.local', 'share', 'opencode')`，但 Windows 上 CLI OpenCode 資料在不同路徑。

**修復方式**：在 getImportSourcePaths 的 CLI 分支中，當 platform 為 win32 時，加入 Windows 的候選路徑：
- process.env.APPDATA + '/opencode'（%APPDATA%\opencode）
- process.env.LOCALAPPDATA + '/opencode'（%LOCALAPPDATA%\opencode）
放在候選陣列前面，保留原本的 Unix 路徑作為 fallback。

## 驗證
完成後執行：
- `pnpm --filter backend build`
- `pnpm --filter frontend build`

回報所有修改摘要與 build 結果。
