---
name: workspace-mode-fix
description: Fix all Desktop/CLI workspace mode switching bugs in opencode-manager
runAs: subagent
allowed-tools: read_file, edit_file, write_file, search_content, run_command
---
你是修復工程師子代理。請依序修復以下在 opencode-manager 專案中發現的 bug：

## Bug 1 — setStateDir(null) assigns null instead of fallback
檔案: backend/src/services/opencode-single-server.ts
行: ~103-110
問題: `setStateDir(dir)` 當 dir 為 null 時，newDir 算出正確的 fallback 路徑，但 `this._stateDir = dir` 把 null 賦值回去。
修復: 改成 `this._stateDir = newDir`

## Bug 2 — _stateDirChanged 在 restart 後永遠不會被清除
檔案: backend/src/services/opencode-single-server.ts
行: start() 方法中 ~280 附近
問題: `this._stateDirChanged = false` 只有在找到既有程序的分支中被執行。若 restart 把程序殺光了，start() 找不到程序，就不會清除此標記。
修復: 在 start() 方法中，進到實際 spawn 流程的地方（約 line 310 附近、在既有程序檢查之後、實際 spawn 之前）加上 `this._stateDirChanged = false`

## Bug 3 — 前端初始 mode 未與伺服器同步
檔案: frontend/src/pages/Repos.tsx
行: ~21
問題: useState<OpenCodeImportSource>('desktop') 寫死為 desktop，但伺服器可能是 cli mode。
修復: 加上 useQuery 從 /api/settings/workspace-mode 取得 currentMode，作為初始值。

## Bug 4 — getDefaultStateDir() 回傳的路徑不正確
檔案: backend/src/services/workspace-mode.ts
行: ~20
問題: 回傳 `.opencode/state`，但 mode 專用目錄是 `state-desktop` / `state-cli`。
修復: 無需修改 — 此函數作為對外 API 保留（可能被其他模組使用），但加上註解說明「returns fallback state dir, not mode-specific」

## Bug 5 — Model state 路徑寫死
檔案: backend/src/routes/providers.ts
行: ~38-40
問題: getModelStatePath() 回傳 `.opencode/state/opencode/model.json`，但實際 state 可能在 `state-desktop` 或 `state-cli`。
修復: 修改 getModelStatePath() 接受可選 stateDir 參數，預設使用 getWorkspacePath() + '.opencode/state'。

修復完成後執行 `pnpm --filter backend build` 和 `pnpm --filter frontend build` 確認兩邊都通過。
