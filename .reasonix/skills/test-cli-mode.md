---
name: test-cli-mode
description: 測試 CLI mode 切換與 session 顯示，必要時修復
runAs: subagent
allowed-tools: run_command, read_file, edit_file, write_file, search_content
---
你是 DEV-FIXER 修復工程師。請完成以下工作：

## 步驟 1：測試目前後端 API
執行以下測試，全部使用 run_command：

a) `curl -s http://localhost:5003/api/health` — 確認 healthy
b) 列出 workspace/.opencode/state-cli/opencode/ 目錄內容確認 DB 存在
c) 列出 workspace/.opencode/state-desktop/opencode/ 目錄內容確認 DB 存在

## 步驟 2：檢查 switchMode 程式碼
用 read_file 讀取 backend/src/services/workspace-mode.ts 的 switchMode 方法（約 60-100 行），確認：
- 是否有強制匯入邏輯（無論 DB 是否存在都重新 VACUUM INTO）
- import source path 是否正確指向 ~/.local/share/opencode/

## 步驟 3：檢查前端程式碼
用 read_file 讀取 frontend/src/components/repo/WorkspaceModeBar.tsx，確認：
- onSuccess handler 中是否有 `queryClient.invalidateQueries({ queryKey: ['opencode', 'all-sessions'] })`
- 如果沒有，使用 edit_file 補上

## 步驟 4：驗證 Build
執行 `pnpm --filter backend build` 和 `pnpm --filter frontend build` 確認兩邊通過

## 步驟 5：回報
回報所有測試結果與修復摘要。
