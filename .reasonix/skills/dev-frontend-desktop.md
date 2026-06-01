---
name: dev-frontend-desktop
description: 前端 Desktop session API 整合
runAs: subagent
allowed-tools: read_file, edit_file, run_command
---
你是 DEV-FIXER。自動連續模式。

## 任務：更新前端 Desktop session 資料來源

檔案：`frontend/src/pages/Repos.tsx`

找到 useQuery 區塊（約 30-40 行），修改 queryFn：

修改前：
```tsx
queryFn: () => new OpenCodeClient(OPENCODE_API).listSessions({ limit: 50 }),
```

修改後：
```tsx
queryFn: async () => {
  if (workspaceMode === "desktop") {
    const res = await fetch("/api/settings/desktop-sessions")
    const data = await res.json()
    return data.sessions ?? []
  }
  return new OpenCodeClient(OPENCODE_API).listSessions({ limit: 50 })
},
```

執行 pnpm --filter frontend build 驗證。
