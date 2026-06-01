---
name: dev-rework
description: 返工執行 — 補測試 + UI 修復
runAs: subagent
allowed-tools: read_file, edit_file, write_file, search_content, run_command
---
你是 DEV-FIXER 修復工程師。請在自動連續模式下執行以下所有任務，不中斷、不問話。

## TASK-A：補 workspace-mode 單元測試

**檔案**：`backend/test/services/workspace-mode.test.ts`

建立測試檔案，使用 vitest。測試案例：

1. **switchMode 相同 mode 不重啟** — 建立 WorkspaceModeService，switchMode('desktop') 當 currentMode='desktop'，回傳 restarted:false
2. **getCurrentMode 回傳預設值** — 新建 service，getCurrentMode 回傳 'desktop'
3. **getModeStatus 回傳正確結構** — getModeStatus('desktop') 回傳包含 mode/stateDir/stateExists 的物件

注意：
- 使用 `import { describe, it, expect, vi, beforeEach } from 'vitest'`
- mock `bun:sqlite` 的 Database 類別，使用 vi.mock
- mock `../services/opencode-import` 中的 getOpenCodeImportStatus
- mock `../services/file-operations` 中的 fileExists / ensureDirectoryExists
- mock `../services/opencode-single-server` 中的 opencodeServerManager

## TASK-B：修復 WorkspaceModeBar queryKey 不一致

**檔案**：`frontend/src/components/repo/WorkspaceModeBar.tsx`

檢查 `onSuccess` handler 中的 `invalidateQueries` 呼叫。WorkspaceChat 使用的 queryKey 是 `['opencode', 'all-sessions']`，但 useSessionsAcrossDirectories 使用 `['opencode', 'sessions', ...]`。確認 invalidate 是否正確。

如果 queryKey 不匹配，修改 invalidateQueries 使用更廣泛的 key：`['opencode']` 來觸發所有 opencode 相關 query 刷新。

## TASK-C：驗證 Build

執行：
- `pnpm --filter backend build`
- `pnpm --filter frontend build`

兩邊都通過後回報完整摘要。
