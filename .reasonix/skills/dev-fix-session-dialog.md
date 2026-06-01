---
name: dev-fix-session-dialog
description: 修復首頁 session dialog
runAs: subagent
allowed-tools: read_file, edit_file, write_file, search_content, run_command
---
你是 DEV-FIXER。自動連續模式。

## 問題
5003 首頁改為純聊天後，SessionList dialog 無法顯示 session，因為 SessionList 需要 directories 參數。

## 修復

修改 `frontend/src/pages/Repos.tsx`：

1. 移除 `SessionList` 的 import，改為 import `OpenCodeClient` from `@/api/opencode`
2. 新增 session 列表 state：`const [sessions, setSessions] = useState<LegacySession[]>([])`
3. 新增 `useEffect` 在 dialog 開啟或 mode 切換時，用 `new OpenCodeClient(OPENCODE_API).listSessions({ limit: 50 })` 取得 session
4. 在 Dialog 中渲染 sessions 列表（每個 session 顯示 title 和時間，點擊後設定 activeSessionId）
5. 新增 `formatDistanceToNow` 用於時間顯示

具體修改：

```tsx
// 新增 import
import { useQuery } from "@tanstack/react-query"
import { OpenCodeClient } from "@/api/opencode"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"

// 新增 query
const { data: sessions, isLoading: sessionsLoading } = useQuery({
  queryKey: ['opencode', 'all-sessions', workspaceMode],
  queryFn: () => new OpenCodeClient(OPENCODE_API).listSessions({ limit: 50 }),
  staleTime: 10000,
})

// 替換 Dialog 內容
<Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
  <DialogContent className="sm:max-w-lg">
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Sessions</h3>
      <Input placeholder="Search sessions..." className="h-9" />
      <div className="max-h-96 overflow-y-auto space-y-1">
        {sessionsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : !sessions?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">No sessions yet</p>
        ) : (
          sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveSessionId(s.id); setSessionDialogOpen(false) }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-sm",
                activeSessionId === s.id && "bg-accent"
              )}
            >
              <div className="font-medium truncate">{s.title || "Untitled"}</div>
              <div className="text-xs text-muted-foreground">
                {s.time?.created ? formatDistanceToNow(new Date(s.time.created), { addSuffix: true }) : ""}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  </DialogContent>
</Dialog>
```

6. 移除 `SessionList` import

完成後執行 `pnpm --filter frontend build` 驗證。
