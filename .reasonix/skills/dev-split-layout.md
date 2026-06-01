---
name: dev-split-layout
description: 改為左右分欄佈局（左 session + 右 chat）
runAs: subagent
allowed-tools: read_file, edit_file, write_file, run_command
---
你是 DEV-FIXER。自動連續模式，不中斷。

## 任務：將 Repos.tsx 改為左右分欄佈局

檔案：frontend/src/pages/Repos.tsx

### 需求
- 左欄：session 列表（可搜尋）
- 右欄：選中 session 的 chat（MessageThread）或歡迎畫面
- 頂部：WorkspaceModeBar（Desktop/CLI 分頁）
- 切換 Desktop/CLI 時，左欄 session 列表更新，右欄清空回到歡迎畫面

### 實作

將 Repos.tsx 內容改為：

```tsx
import { useState, useEffect, useCallback, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { OpenCodeClient } from "@/api/opencode"
import { useMessages, useCreateSession } from "@/hooks/useOpenCode"
import { MessageThread } from "@/components/message/MessageThread"
import { PromptInput, type PromptInputHandle } from "@/components/message/PromptInput"
import { WorkspaceModeBar } from "@/components/repo/WorkspaceModeBar"
import { Header } from "@/components/ui/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PendingActionsGroup } from "@/components/notifications/PendingActionsGroup"
import { MessageSquarePlus, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { showToast } from "@/lib/toast"
import type { OpenCodeImportSource } from "@/api/types/settings"

const OPENCODE_API = "/api/opencode"

export function Repos() {
  const promptInputRef = useRef<PromptInputHandle>(null)
  const [workspaceMode, setWorkspaceMode] = useState<OpenCodeImportSource>("desktop")
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setActiveSessionId(null)
  }, [workspaceMode])

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["opencode", "all-sessions", workspaceMode],
    queryFn: () => new OpenCodeClient(OPENCODE_API).listSessions({ limit: 50 }),
    staleTime: 10000,
  })

  const { data: messages } = useMessages(OPENCODE_API, activeSessionId ?? undefined)
  const createSession = useCreateSession(OPENCODE_API, undefined, (session) => {
    setActiveSessionId(session.id)
  })

  const filteredSessions = !sessions ? [] : !searchQuery.trim() ? sessions : sessions.filter(s =>
    (s.title ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNewSession = useCallback(async () => {
    try {
      await createSession.mutateAsync({})
    } catch {
      showToast.error("Failed to create session")
    }
  }, [createSession])

  const scrollToBottom = useCallback(() => {}, [])

  return (
    <div className="h-dvh max-h-dvh overflow-hidden bg-gradient-to-br from-background via-background to-background flex flex-col">
      <Header>
        <Header.Title logo>OpenCode</Header.Title>
        <Header.Actions>
          <PendingActionsGroup />
          <Button onClick={handleNewSession} disabled={createSession.isPending} size="sm">
            <MessageSquarePlus className="w-4 h-4 mr-1" />
            New
          </Button>
          <Header.Settings />
        </Header.Actions>
      </Header>

      <WorkspaceModeBar value={workspaceMode} onChange={setWorkspaceMode} />

      <div className="flex-1 min-h-0 flex">
        {/* Left panel: session list */}
        <div className="w-64 md:w-72 lg:w-80 border-r border-border flex flex-col flex-shrink-0 bg-card/20">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessionsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">No sessions</div>
            ) : (
              <div className="py-1">
                {filteredSessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSessionId(s.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 hover:bg-accent/50 transition-colors border-b border-border/30 text-sm",
                      activeSessionId === s.id && "bg-accent"
                    )}
                  >
                    <div className="font-medium truncate">{s.title || "Untitled Session"}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {s.time?.created ? formatDistanceToNow(new Date(s.time.created), { addSuffix: true }) : ""}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: chat or welcome */}
        <div className="flex-1 min-w-0 flex flex-col">
          {activeSessionId ? (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <MessageThread
                  opcodeUrl={OPENCODE_API}
                  sessionID={activeSessionId}
                  messages={messages}
                  onChildSessionClick={(id) => setActiveSessionId(id)}
                />
              </div>
              <div className="border-t border-border p-4">
                <PromptInput
                  ref={promptInputRef}
                  opcodeUrl={OPENCODE_API}
                  sessionID={activeSessionId}
                  onScrollToBottom={scrollToBottom}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquarePlus className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <h2 className="text-xl font-medium mb-2">Welcome to OpenCode</h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  Select a session from the left panel or create a new one
                </p>
                <Button onClick={handleNewSession} disabled={createSession.isPending} size="lg">
                  <MessageSquarePlus className="w-5 h-5 mr-2" />
                  New Session
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 注意
- 移除 Dialog, DialogContent import（不再需要）
- 保留所有必要 import
- 執行 pnpm --filter frontend build 驗證
