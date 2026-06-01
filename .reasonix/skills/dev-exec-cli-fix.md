---
name: dev-exec-cli-fix
description: 依 PLANNER 計劃執行 Desktop/CLI 修復 TASK-001~005
runAs: subagent
allowed-tools: read_file, edit_file, write_file, search_content, run_command
---
你是 DEV-FIXER 修復工程師。請依序執行以下 TASK，每個完成後確認 build 通過。

## TASK-001：修正 switchMode 匯入邏輯（防覆蓋）
**檔案**：`backend/src/services/workspace-mode.ts`
**修改**：在 switchMode 方法中，先檢查目標 DB（state-cli/opencode/opencode.db 或 state-desktop/opencode/opencode.db）是否存在且包含 session（COUNT(*) > 0）。若有 session 則跳過匯入，保留現有資料。若不存在或為空則從原始來源匯入（或建立空 DB）。
**驗收**：反覆切換 Desktop ↔ CLI 不因 VACUUM INTO 覆蓋而遺失 session

## TASK-002：修正 startup 匯入目標路徑
**檔案**：`backend/src/index.ts`
**修改**：確認 startup 時 ensureDatabaseExists 的目標是 mode-specific 路徑（state-desktop/state-cli 含 opencode/ 子目錄）
**驗收**：啟動時正確建立 state-desktop/opencode/ 或 state-cli/opencode/

## TASK-003：前端 WorkspaceChat 加 key 強制 remount
**檔案**：`frontend/src/pages/Repos.tsx`
**修改**：在 `<WorkspaceChat />` 加上 `key={workspaceMode}` 屬性，讓 mode 切換時 React 強制 remount 元件，重新取得 session 列表
**驗收**：切換 mode 後 WorkspaceChat 重新 mount，顯示正確 mode 的 session

## TASK-004：執行後端驗證
**執行**：`pnpm --filter backend build`
**執行**：`pnpm --filter frontend build`
**驗收**：兩邊 build 通過

每個 TASK 完成後請用 run_command 執行 build 驗證。完成後回報所有修改摘要。
