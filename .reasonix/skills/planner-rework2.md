---
name: planner-rework2
description: 返工第 2 次規劃 — 補核心測試
runAs: subagent
allowed-tools: read_file, search_content, run_command
---
你是 PLANNER 規劃代理（resume）。

## 返工第 2 次

前次評分 55/100，主因是 switchMode 核心切換功能完全無測試覆蓋。

### 需要補的測試（REVIEWER P0 要求）

1. `switchMode> desktop→cli 切換成功並重啟` — mock readMode='desktop' → switchMode('cli') → 驗證 restart 被調用、setStateDir 被以正確路徑調用
2. `switchMode> cli→desktop 反向驗證`
3. `switchMode> 切換時正確寫入 DB` — 驗證 workspace_mode 寫入 DB
4. `getCurrentMode> DB 存 cli 時回傳 cli`
5. `getModeStatus> cli mode 路徑為 state-cli`
6. `getModeStatus> 檔案不存在時 stateExists=false`

### 限制
- 返工次數：第 2 次（上限 5 次）
- 所有測試必須可通過 `npx vitest run`
- 不可中斷、不問話

輸出更新計劃到 tasks/plan.md。
