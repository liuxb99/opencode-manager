---
name: dev-rework2
description: 返工第 2 次執行 — 補核心測試
runAs: subagent
allowed-tools: read_file, edit_file, write_file, search_content, run_command
---
你是 DEV-FIXER 修復工程師。自動連續模式，不中斷不問話。

## 任務：補 workspace-mode 測試

**檔案**：`backend/test/services/workspace-mode.test.ts`

目前只有 3 個測試。請補上以下 **所有 REVIEWER 要求的 P0/P1 測試**：

### P0 — 核心功能測試
1. **desktop→cli 切換成功並重啟**
   - mock fileExists 回傳 true（目標 DB 存在）
   - mock getOpenCodeImportStatus 回傳 stateSourcePath
   - mock importOpenCodeStateDirectory 
   - 呼叫 switchMode('cli')
   - 驗證 opencodeServerManager.setStateDir 被調用（路徑含 'state-cli'）
   - 驗證 opencodeServerManager.restart 被調用
   - 回傳 { mode: 'cli', restarted: true }

2. **cli→desktop 反向驗證**
   - 同上，方向相反

### P1 — 邊界測試
3. **切換時正確寫入 DB**
   - 驗證寫入 app_settings 的 key='workspace_mode'

4. **getCurrentMode DB 存 cli 時回傳 cli**
   - mock db query 回傳 { value: 'cli' }

5. **getModeStatus cli mode 路徑為 state-cli**
   - stateDir 包含 'state-cli'

6. **getModeStatus 檔案不存在時 stateExists=false**
   - mock fileExists 回傳 false

### 技術注意
- 使用 `import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'`
- mock bun:sqlite 的 Database：`vi.mock('bun:sqlite', () => ({ Database: vi.fn() }))`
- 對 WorkspaceModeService 的 `readMode` 方法：可透過預先寫入 DB 來控制
- 對 `getOpenCodeImportStatus`：`vi.mock('../../src/services/opencode-import')`
- 對 `fileExists`：`vi.mock('../../src/services/file-operations')`
- 對 `opencodeServerManager`：`vi.mock('../../src/services/opencode-single-server')`

完成後執行：
- `pnpm --filter backend test` — 確認所有測試通過
- `pnpm --filter backend build` — 確認 build 通過
- `pnpm --filter frontend build` — 確認 build 通過

回報測試結果與 build 結果。
