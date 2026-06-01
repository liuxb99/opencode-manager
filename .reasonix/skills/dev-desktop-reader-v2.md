---
name: dev-desktop-reader-v2
description: Desktop 資料直接讀取 API
runAs: subagent
allowed-tools: read_file, edit_file, write_file, run_command
---
你是 DEV-FIXER。自動連續模式。

## 任務：建立 Desktop 資料讀取 API

### Step 1：建立服務檔案

新增 `backend/src/services/desktop-state.ts`：

直接從 `%APPDATA%/ai.opencode.desktop/` 讀取：
1. `opencode.global.dat` → 解析 `layout.page.lastProjectSession` 取得 session ID + 目錄 + 時間
2. `opencode.workspace.*.dat` → 解析每個檔案的 `session:{id}:prompt` 取得最後提示文字

回傳 DesktopSessionInfo[]（id, title=目錄名, directory, lastPrompt, timeCreated）

### Step 2：新增 API 路由

在 `backend/src/routes/settings.ts` 的 return app 之前加入：

```typescript
app.get('/desktop-sessions', async (c) => {
  const { readDesktopSessions } = await import('../services/desktop-state')
  const sessions = await readDesktopSessions()
  return c.json({ sessions })
})
```

### Step 3：更新前端

在 `frontend/src/pages/Repos.tsx` 中，找到 useQuery 的 queryFn，改為：

```typescript
queryFn: async () => {
  if (workspaceMode === "desktop") {
    const res = await fetch("/api/settings/desktop-sessions")
    const data = await res.json()
    return data.sessions || []
  }
  return new OpenCodeClient(OPENCODE_API).listSessions({ limit: 50 })
},
```

### Step 4：Build 驗證
執行 pnpm --filter backend build 和 pnpm --filter frontend build
