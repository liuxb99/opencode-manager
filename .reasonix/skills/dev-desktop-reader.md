---
name: dev-desktop-reader
description: 建立 Desktop 讀取服務 + API + 前端整合
runAs: subagent
allowed-tools: read_file, edit_file, write_file, search_content, run_command
---
你是 DEV-FIXER。自動連續模式，不中斷。

## 任務：建立 Desktop 資料讀取服務 + 更新對話框

### Step 1：建立 Desktop 讀取服務

新增 `backend/src/services/desktop-state.ts`：

```typescript
import path from 'path'
import os from 'os'
import { promises as fs } from 'fs'
import { logger } from '../utils/logger'

export interface DesktopSessionInfo {
  id: string
  title: string
  directory: string
  lastPrompt: string
  timeCreated: number
}

const DESKTOP_DIR = process.env.APPDATA
  ? path.join(process.env.APPDATA, 'ai.opencode.desktop')
  : path.join(os.homedir(), 'AppData', 'Roaming', 'ai.opencode.desktop')

export async function readDesktopSessions(): Promise<DesktopSessionInfo[]> {
  try {
    const globalPath = path.join(DESKTOP_DIR, 'opencode.global.dat')
    const content = await fs.readFile(globalPath, 'utf8')
    const globalData = JSON.parse(content)
    const layout = JSON.parse(globalData['layout.page'] || '{}')
    const lastSessions: Record<string, { id: string; directory: string; at: number }> =
      layout.lastProjectSession || {}

    const files = await fs.readdir(DESKTOP_DIR)
    const workspaceFiles = files.filter(f => f.startsWith('opencode.workspace.') && f.endsWith('.dat'))

    const sessionTitles: Record<string, string> = {}
    const sessionPrompts: Record<string, string> = {}
    const sessionDirs: Record<string, string> = {}

    for (const file of workspaceFiles) {
      const fileContent = await fs.readFile(path.join(DESKTOP_DIR, file), 'utf8')
      const data = JSON.parse(fileContent)
      for (const key of Object.keys(data)) {
        const m = key.match(/^session:([^:]+):prompt$/)
        if (m) {
          const sid = m[1]
          try {
            const promptData = JSON.parse(data[key])
            const text = promptData.prompt?.map((p: { content: string }) => p.content).filter(Boolean).join(' ') || ''
            sessionPrompts[sid] = text
          } catch {}
        }
      }
    }

    for (const [dir, info] of Object.entries(lastSessions)) {
      const sid = (info as { id: string }).id
      sessionDirs[sid] = dir
      const dirName = dir.split('\\').pop() || dir.split('/').pop() || dir
      sessionTitles[sid] = dirName
    }

    const seen = new Set<string>()
    const sessions: DesktopSessionInfo[] = []
    for (const [dir, info] of Object.entries(lastSessions)) {
      const sid = (info as { id: string }).id
      const at = (info as { at: number }).at
      if (seen.has(sid)) continue
      seen.add(sid)
      sessions.push({
        id: sid,
        title: sessionTitles[sid] || dir.split('\\').pop() || dir,
        directory: dir,
        lastPrompt: sessionPrompts[sid] || '',
        timeCreated: at,
      })
    }
    sessions.sort((a, b) => b.timeCreated - a.timeCreated)
    return sessions
  } catch (error) {
    logger.warn('Failed to read desktop sessions:', error)
    return []
  }
}
```

### Step 2：新增 API 路由

在 `backend/src/routes/settings.ts` 中新增 GET endpoint：

在 return app 之前、manager-token/rotate 之後加入：

```typescript
app.get('/desktop-sessions', async (c) => {
  try {
    const { readDesktopSessions } = await import('../services/desktop-state')
    const sessions = await readDesktopSessions()
    return c.json({ sessions })
  } catch (error) {
    logger.error('Failed to get desktop sessions:', error)
    return c.json({ error: 'Failed to get desktop sessions' }, 500)
  }
})
```

### Step 3：更新前端 Repos.tsx

修改 `frontend/src/pages/Repos.tsx`：

在 session list query 中，根據 workspaceMode 決定 API 來源：
- workspaceMode === 'cli' → 使用 OpenCodeClient.listSessions()（現有邏輯）
- workspaceMode === 'desktop' → 使用 fetch /api/settings/desktop-sessions

```tsx
const { data: sessions, isLoading: sessionsLoading } = useQuery({
  queryKey: ["opencode", "all-sessions", workspaceMode],
  queryFn: async () => {
    if (workspaceMode === "desktop") {
      const res = await fetch("/api/settings/desktop-sessions")
      const data = await res.json()
      return data.sessions || []
    }
    return new OpenCodeClient(OPENCODE_API).listSessions({ limit: 50 })
  },
  staleTime: 10000,
})
```

### Step 4：驗證
執行：
- pnpm --filter backend build
- pnpm --filter frontend build

回報結果。
