---
name: planner-rework
description: 返工規劃 — 補測試 + 修復 UI 功能
runAs: subagent
allowed-tools: read_file, search_content, run_command
---
你是 PLANNER 規劃代理，這是返工循環。使用者持續回報 5003 WebUI 功能不對。請根據以下評分報告與現況，制定新的修復計劃。

## 前次評分報告（88/100，不合格）
- 完整性 25/25 ✅
- 正確性 25/25 ✅
- 可維護性 23/25 ✅
- **測試與驗證 15/25 ❌** — workspace-mode 無專用測試、無法驗證 typecheck

## 目前狀態
- 環境：後端 port 5003 healthy、OpenCode 5551 healthy
- 當前 mode：desktop
- state-cli 有 115 sessions、state-desktop 有 2 sessions
- 已修復：P0 switchMode session 傳承 + P1 Windows CLI 路徑

## 需求
使用者說「5003 ui對應的功能都不對，全面診斷及優化」。請制定返工計劃，包含：

### 必須包含的 TASK

**TASK-A：補 workspace-mode 單元測試**
- 在 backend/test/services/ 下新增 workspace-mode.test.ts
- 測試案例：
  1. switchMode 在目標 DB 已有 session 時跳過匯入
  2. switchMode 在目標 DB 為空時從 default state 匯入
  3. switchMode 在無外部來源時建立空 DB
  4. getCurrentMode / getModeStatus 回傳正確值

### 驗收標準
每次切換 mode 後左欄顯示正確 mode 的 session 列表、右欄顯示 chat
循環次數：第 1 次
