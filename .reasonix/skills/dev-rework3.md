---
name: dev-rework3
description: 返工第 3 次 — 補最後 4 個測試
runAs: subagent
allowed-tools: read_file, edit_file, write_file, search_content, run_command
---
你是 DEV-FIXER。自動連續模式，不中斷。

## 任務：補 workspace-mode 測試（最後 4 個）

檔案：`backend/test/services/workspace-mode.test.ts`

請補上以下測試案例（追加到現有檔案末尾的 describe block 中）：

### 1. 目標 DB 已有 sessions 時跳過匯入 (P1)
- mock fileExists 回傳 true（目標 DB 存在）
- mock BunDatabase query 回傳 [{c:5}]（有 sessions）
- 呼叫 switchMode('cli')
- 驗證 importOpenCodeStateDirectory 未被呼叫 (expect().not.toHaveBeenCalled())

### 2. 從預設 state 目錄匯入 (P1)  
- mock fileExists 先回傳 false（目標 DB 不存在），再回傳 true（預設 DB 存在）
- mock getOpenCodeImportStatus 回傳 { stateSourcePath: null }（無外部來源）
- mock BunDatabase query 預設 DB 回傳 [{c:5}]
- 呼叫 switchMode('cli')
- 驗證 importOpenCodeStateDirectory 被呼叫

### 3. 無來源時建立空白 DB (P1)
- mock fileExists 回傳 false（目標 DB 不存在）
- mock getOpenCodeImportStatus 回傳 { stateSourcePath: null }
- 呼叫 switchMode('cli')
- 驗證 opencodeServerManager.restart 仍被呼叫（即使無來源）

### 4. import 函數被正確呼叫 (P0)
- 在第 2 個測試中補充 assert，驗證 importOpenCodeStateDirectory 被以正確的路徑呼叫

## 驗證
執行：
- `npx vitest run test/services/workspace-mode.test.ts` — 確認全部通過
- `pnpm --filter backend build`

回報結果。
