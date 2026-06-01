---
name: dev-fix-switch-chat
description: 修復 mode 切換時 session/chat 顯示
runAs: subagent
allowed-tools: read_file, edit_file, write_file, search_content, run_command
---
你是 DEV-FIXER。自動連續模式，不中斷。

## TASK-001：Mode 切換時重置 activeSessionId

檔案：frontend/src/pages/Repos.tsx

加入 useEffect：
```tsx
import { useEffect } from "react"

// 在 handleNewSession 之前加入：
useEffect(() => {
  setActiveSessionId(null)
}, [workspaceMode])
```

## TASK-002：Session list query key 加入 workspaceMode

在同一檔案中，找到 useQuery 的 queryKey，改成：
```tsx
queryKey: ['opencode', 'all-sessions', workspaceMode],
```

## 驗證
執行 pnpm --filter frontend build
