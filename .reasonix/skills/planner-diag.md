---
name: planner-diag
description: 全面診斷 5003 WebUI 功能異常根因
runAs: subagent
allowed-tools: read_file, search_content, run_command, list_directory
---
你是 PLANNER 規劃代理。請對 opencode-manager 的 5003 WebUI 進行全面診斷，找出所有功能異常的根因。

## 診斷範圍

### 第一層：環境檢查（全部用 run_command）
1. 執行 `netstat -ano | findstr :5003` + `findstr :5551` 確認後端與 OpenCode server 運作狀態
2. 執行 `curl -s http://localhost:5003/api/health` 確認 health API 回應
3. 執行 `dir workspace\.opencode\ /b /s` 看所有 state 目錄結構
4. 用 bun:sqlite 檢查 state-cli 和 state-desktop 的 opencode.db 是否正常（SELECT COUNT(*) FROM session）

### 第二層：後端 API 測試（全部用 run_command）
5. `curl -s http://localhost:5003/api/settings/workspace-mode` — 確認 GET workspace-mode 是否要 auth
6. `curl -s http://localhost:5003/api/settings/opencode-configs` — 確認設定 API 是否正常
7. `curl -s http://localhost:5003/` — 確認前端 HTML 是否正常回應

### 第三層：程式碼審查（用 read_file）
8. 讀取 `backend/src/services/workspace-mode.ts` 完整內容，逐行審查 switchMode 方法的每個分支
9. 讀取 `backend/src/services/opencode-single-server.ts` 的 start() 方法（約 170-400 行），檢查 XDG_DATA_HOME 設定、health check 邏輯、spawn 參數
10. 讀取 `backend/src/index.ts` 的 startup 流程（約 240-290 行），檢查 state dir 初始化順序
11. 讀取 `frontend/src/components/repo/WorkspaceModeBar.tsx` 的 onSuccess / onError handler
12. 讀取 `frontend/src/components/repo/WorkspaceChat.tsx` 的 session 列表獲取與 SessionView

### 第四層：資料流追蹤
13. 追蹤 CLI 分頁點擊後的完整資料流：
    - 前端 onClick → API call → 後端 switchMode → import/檢查 DB → restart → 前端 refetch sessions → 顯示
14. 找出每個環節可能的失敗點

## 輸出
將所有發現產出到 `tasks/diagnosis-report.md`，包含：
- 每個檢查項目的結果（pass/fail）
- 異常項目的根因分析
- 修復建議與優先級（P0/P1/P2）
- 預估修改範圍（檔案路徑）
