---
name: dev-fix-desktop-state-db-path
description: 修復 desktop-state.ts DB 路徑與 workspace-mode.ts 不一致
runAs: subagent
---
你是 DEV-FIXER 子代理。自動連續模式，不中斷不問話。

## 任務：修復 desktop-state.ts 的 DB 路徑計算

### 問題
`backend/src/services/desktop-state.ts` 使用硬編碼的 process.cwd() 計算 CLI DB 路徑，而 `workspace-mode.ts` 使用 getWorkspacePath()。兩者不一致導致左欄 session list 和右欄 message API 讀取不同的資料庫。

### 背景（來自 OpenCode 源碼比對）
OpenCode 原生使用 `$XDG_DATA_HOME/opencode/opencode.db` 存放 session DB。
- Desktop mode → `~/.local/share/opencode/opencode.db`
- CLI mode → `{workspace}/.opencode/state-cli/opencode/opencode.db`（由 opencode-manager 管理）

### 修改步驟

#### Step 1: 修改 `backend/src/services/desktop-state.ts`

**修改前：**
```typescript
import path from 'path'
import os from 'os'
import { promises as fs } from 'fs'
import { Database } from 'bun:sqlite'
import { logger } from '../utils/logger'

const DESKTOP_DIR = process.env.APPDATA
  ? path.join(process.env.APPDATA, 'ai.opencode.desktop')
  : path.join(os.homedir(), 'AppData', 'Roaming', 'ai.opencode.desktop')

const SHARED_DB_PATH = path.join(os.homedir(), '.local', 'share', 'opencode', 'opencode.db')

export async function readDesktopSessions(): Promise<DesktopSessionInfo[]> {
  return readAllSessionsFromDb(SHARED_DB_PATH)
}

const CLI_DB_PATH = process.cwd() + '/workspace/.opencode/state-cli/opencode/opencode.db'

export async function readAllSessions(mode: 'desktop' | 'cli'): Promise<DesktopSessionInfo[]> {
  const dbPath = mode === 'desktop' ? SHARED_DB_PATH : CLI_DB_PATH
  return readAllSessionsFromDb(dbPath)
}
```

**修改後：**
```typescript
import path from 'path'
import os from 'os'
import { promises as fs } from 'fs'
import { Database } from 'bun:sqlite'
import { logger } from '../utils/logger'
import { getWorkspacePath } from '@opencode-manager/shared/config/env'

const DESKTOP_DIR = process.env.APPDATA
  ? path.join(process.env.APPDATA, 'ai.opencode.desktop')
  : path.join(os.homedir(), 'AppData', 'Roaming', 'ai.opencode.desktop')

/**
 * 取得指定 mode 的 state 目錄，與 workspace-mode.ts 的 getStateDirForMode() 邏輯一致
 */
function getStateDirForMode(mode: 'desktop' | 'cli'): string {
  if (mode === 'desktop') {
    // Desktop shares the same XDG database as CLI at ~/.local/share
    const home = process.env.USERPROFILE || process.env.HOME || ''
    return path.join(home, '.local', 'share')
  }
  return path.join(getWorkspacePath(), '.opencode', `state-${mode}`)
}

/**
 * 取得指定 mode 的 DB 路徑
 */
function getDbPathForMode(mode: 'desktop' | 'cli'): string {
  return path.join(getStateDirForMode(mode), 'opencode', 'opencode.db')
}

export async function readDesktopSessions(): Promise<DesktopSessionInfo[]> {
  return readAllSessionsFromDb(getDbPathForMode('desktop'))
}

export async function readAllSessions(mode: 'desktop' | 'cli'): Promise<DesktopSessionInfo[]> {
  return readAllSessionsFromDb(getDbPathForMode(mode))
}
```

**注意：** 保留原有的 `DESKTOP_DIR` 和 `readDesktopSessions()` 不動（相容性）。

#### Step 2: 驗證

執行 `pnpm --filter backend build` 確認通過。

完成後回報修改摘要與 build 結果。
