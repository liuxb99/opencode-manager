---
name: planner-cli-fix
description: 制定 Desktop/CLI mode 切換修復計劃
runAs: subagent
allowed-tools: read_file, search_content, run_command
---
你是 PLANNER 規劃代理。請分析以下需求並制定詳細執行計劃。

## 原始需求
在 Repos 首頁頂部加入 Desktop/CLI 分頁切換條，切換時顯示各自獨立的 session 列表（左欄）與對話內容（右欄）。Desktop 指向 OpenCode Desktop state，CLI 指向 OpenCode CLI state（~/.local/share/opencode/）。

## 當前狀態
- 專案：opencode-manager（Bun + Hono + React + Vite）
- 後端已修改：workspace-mode.ts、opencode-single-server.ts、routes/settings.ts、index.ts
- 前端已修改：Repos.tsx、WorkspaceModeBar.tsx、WorkspaceChat.tsx、settings.ts
- CLI state 位於 workspace/.opencode/state-cli/opencode/ 含 115 筆 session
- Desktop state 位於 workspace/.opencode/state-desktop/opencode/ 含 1 筆 session
- 目前已修復 bugs：setStateDir null 賦值、_stateDirChanged 未清除、state 目錄結構缺少 opencode/ 子目錄、restart 未強制殺舊程序、model state 路徑寫死、switchMode 強制 VACUUM INTO 匯入、前端切換 mode 後 invalidate cache

## 尚未解決的問題
- 使用者回報切換 CLI 分頁後，左欄 session 列表為空或內容不對，右欄不顯示 chat

## 請執行
1. 讀取以下關鍵檔案了解現況：
   - backend/src/services/workspace-mode.ts
   - backend/src/services/opencode-single-server.ts（setStateDir / getStateDir / start / restart 方法）
   - backend/src/routes/settings.ts（workspace-mode API endpoints）
   - frontend/src/components/repo/WorkspaceModeBar.tsx
   - frontend/src/components/repo/WorkspaceChat.tsx
   - frontend/src/pages/Repos.tsx

2. 分析問題根因：為何切換 CLI 後 session 列表和 chat 沒有正確顯示？

3. 將解決方案拆解為具體 TASK，每個 TASK 包含：
   - 任務 ID（TASK-001, TASK-002, …）
   - 目標描述
   - 負責代理角色（dev-fixer）
   - 受影響的檔案路徑
   - 具體修改內容
   - 驗收標準

4. 輸出計劃到 tasks/plan.md
