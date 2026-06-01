import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import { useMobile } from "@/hooks/useMobile"
import { OpenCodeClient } from "@/api/opencode"
import { useMessages, useCreateSession } from "@/hooks/useOpenCode"
import { MessageThread } from "@/components/message/MessageThread"
import { PromptInput, type PromptInputHandle } from "@/components/message/PromptInput"
import { WorkspaceModeBar } from "@/components/repo/WorkspaceModeBar"
import { Header } from "@/components/ui/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PendingActionsGroup } from "@/components/notifications/PendingActionsGroup"
import { CalendarClock, Settings, LogOut, MessageSquarePlus, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { showToast } from "@/lib/toast"
import type { OpenCodeImportSource } from "@/api/types/settings"

const OPENCODE_API = "/api/opencode"

export function Repos() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const isMobile = useMobile()
  const promptInputRef = useRef<PromptInputHandle>(null)
  const [workspaceMode, setWorkspaceMode] = useState<OpenCodeImportSource>("desktop")
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sessionDrawerOpen, setSessionDrawerOpen] = useState(false)

  useEffect(() => {
    setActiveSessionId(null)
  }, [workspaceMode])

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["opencode", "all-sessions", workspaceMode],
    queryFn: async () => {
      const res = await fetch(`/api/settings/all-sessions?mode=${workspaceMode}`)
      const data = await res.json()
      return (data.sessions ?? []) as any[]
      return new OpenCodeClient(OPENCODE_API).listSessions({ limit: 50 })
    },
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
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSessionDrawerOpen(true)}
            className="h-8 w-8 mr-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </Button>
        )}
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

      <div className="flex-1 min-h-0 flex flex-row">
        {/* Toolbar column */}
        {!isMobile && (
          <div className="w-12 md:w-14 border-r border-border flex flex-col items-center py-2 gap-3 flex-shrink-0 bg-card/30">
            <button onClick={() => navigate('/chat')} className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground" title="Chat">
              <MessageSquarePlus className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/schedules')} className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground" title="Schedules">
              <CalendarClock className="w-5 h-5" />
            </button>
            <div className="flex-1" />
            <button onClick={() => { const params = new URLSearchParams(window.location.search); params.set('settings','open'); window.history.replaceState({},'',`?${params}`); window.dispatchEvent(new CustomEvent('oc:sidebar:action',{detail:{action:'settings'}})) }} className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={() => logout()} className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
        {/* Session list panel — desktop: sidebar, mobile: drawer overlay */}
        {isMobile ? (
          <>
            {/* Backdrop */}
            {sessionDrawerOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setSessionDrawerOpen(false)}
              />
            )}
            {/* Drawer */}
            <div
              className={cn(
                "fixed top-0 left-0 h-full w-[75vw] max-w-sm z-50 bg-card shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
                sessionDrawerOpen ? "translate-x-0" : "-translate-x-full"
              )}
            >
              <div className="p-3 border-b border-border flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSessionDrawerOpen(false)}
                  className="h-7 w-7 shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </Button>
                <div className="relative flex-1">
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
                        onClick={() => {
                          setActiveSessionId(s.id)
                          setSessionDrawerOpen(false)
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors border-b border-border/30 text-sm",
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
          </>
        ) : (
          <div className="w-72 border-r border-border flex flex-col flex-shrink-0 bg-card/20">
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
        )}

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
