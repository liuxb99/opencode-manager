---
name: planner-rework-modebar
description: PLANNER 返工規劃：測試+重構
runAs: subagent
allowed-tools: read_file, search_content, search_files
---
你是 PLANNER 子代理（resume）。根據以下評分報告，為本次返工制定計劃。

## 評分報告摘要

總分：84/100（不合格）

### 缺失項目
1. **測試不足** — sessionSummary 新功能完全無測試案例；desktop-state.ts 完全無測試
2. **程式碼重複** — `getStateDirForMode()` 在 `workspace-mode.ts` 與 `desktop-state.ts` 各定義一次，邏輯完全相同
3. **型別用 `any`** — `WorkspaceModeBar.tsx:128` 使用 `s: any` 喪失型別安全

### 原始需求回顧
- 修復 A：WorkspaceModeBar 底部改為顯示 session 摘要（count + recent titles）而非檔案路徑
- 修復 B：desktop-state.ts 的 CLI_DB_PATH 從 process.cwd() 改為 getWorkspacePath()

### 返工計劃要求
請制定具體步驟來解決以上三個缺失，包括：
1. 為 `workspace-mode.test.ts` 補上 sessionSummary 測試（DB 存在/不存在、有資料/無資料）
2. 將 `getStateDirForMode()` 抽出至共用模組（backend/src/services/ 或 shared/），兩處引用同一份
3. 定義共用 `SessionSummary` interface，消除 `any` 型別
4. 為 `desktop-state.ts` 新增基礎測試

請輸出計劃文檔格式，含任務 ID、檔案路徑、具體步驟。
