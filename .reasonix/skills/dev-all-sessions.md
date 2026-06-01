---
name: dev-all-sessions
description: 新增直接讀取 SQLite session API
runAs: subagent
allowed-tools: read_file, edit_file, run_command
---
你是 DEV-FIXER。自動連續模式。

## 任務：後端新增 API 直接讀取 SQLite 所有 session

### Step 1：修改 `backend/src/services/desktop-state.ts`

改為通用的 `readAllSessions`，接受一個 dbPath 參數，從 SQLite 讀取所有 session：

```typescript
import path from 'path'
import { Database } from 'bun:sqlite'
import { logger } from '../utils/logger'

export interface SessionItem {
  id: string
  title: string
  directory: string
  projectID: string
  timeCreated: number
}

const HOME_DB = path.join(require('os').homedir(), '.local', 'share', 'opencode', 'opencode.db')
const CLI_DB = path.join(process.cwd(), 'workspace', '.opencode', 'state-cli', 'opencode', 'opencode.db')

export async function readAllSessions(mode: 'desktop' | 'cli'): Promise<SessionItem[]> {
  const dbPath = mode === 'desktop' ? HOME_DB : CLI_DB
  try {
    const db = new Database(dbPath, { readonly: true })
    const rows = db.query(
      'SELECT id, COALESCE(title, "") as title, COALESCE(directory, "") as directory, project_id, time_created FROM session ORDER BY time_created DESC'
    ).all() as SessionItem[]
    db.close()
    return rows
  } catch (error) {
    logger.warn(`Failed to read sessions from ${dbPath}:`, error)
    return []
  }
}
```

### Step 2：新增 API 路由

在 `backend/src/routes/settings.ts` 的 return app 前加入：

```typescript
app.get('/all-sessions', async (c) => {
  const mode = (c.req.query('mode') || 'desktop') as 'desktop' | 'cli'
  const { readAllSessions } = await import('../services/desktop-state')
  const sessions = await readAllSessions(mode)
  return c.json({ sessions })
})
```

### Step 3：更新前端

修改 `frontend/src/pages/Repos.tsx` 的 useQuery queryFn：

```typescript
queryFn: async () => {
  const res = await fetch(`/api/settings/all-sessions?mode=${workspaceMode}`)
  const data = await res.json()
  return (data.sessions ?? []) as any[]
},
```

### Step 4：驗證
執行 pnpm --filter backend build 和 pnpm --filter frontend build
