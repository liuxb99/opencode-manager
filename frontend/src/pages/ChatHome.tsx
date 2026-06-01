import { useState, useCallback } from 'react'
import { Header } from '@/components/ui/header'
import { Button } from '@/components/ui/button'
import { MessageSquarePlus, PanelRightOpen } from 'lucide-react'
import { WorkspaceModeBar } from '@/components/repo/WorkspaceModeBar'
import { MessageThread } from '@/components/message/MessageThread'
import { PromptInput } from '@/components/message/PromptInput'
import { SessionList } from '@/components/session/SessionList'
import { PendingActionsGroup } from '@/components/notifications/PendingActionsGroup'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useMessages, useCreateSession } from '@/hooks/useOpenCode'
import { OPENCODE_API_ENDPOINT } from '@/config'
import { showToast } from '@/lib/toast'
import type { OpenCodeImportSource } from '@/api/types/settings'

export function ChatHome() {
  const [workspaceMode, setWorkspaceMode] = useState<OpenCodeImportSource>('desktop')
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false)

  const { data: messages } = useMessages(OPENCODE_API_ENDPOINT, activeSessionId ?? undefined)
  const createSession = useCreateSession(OPENCODE_API_ENDPOINT, undefined, (session) => {
    setActiveSessionId(session.id)
  })

  const handleNewSession = useCallback(async () => {
    try {
      await createSession.mutateAsync({})
    } catch {
      showToast.error('Failed to create session')
    }
  }, [createSession])

  // Simple no-op scroll handler for the chat prompt input
  const scrollToBottom = useCallback(() => {}, [])

  return (
    <div className="h-dvh max-h-dvh overflow-hidden bg-gradient-to-br from-background via-background to-background flex flex-col">
      <Header>
        <Header.Title logo>OpenCode</Header.Title>
        <Header.Actions>
          <PendingActionsGroup />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSessionDialogOpen(true)}
            title="Sessions"
            className="text-muted-foreground hover:text-foreground h-8 w-8"
          >
            <PanelRightOpen className="w-4 h-4" />
          </Button>
          <Header.Settings />
        </Header.Actions>
      </Header>

      <WorkspaceModeBar value={workspaceMode} onChange={setWorkspaceMode} />

      <div className="flex-1 min-h-0 flex flex-col">
        {activeSessionId ? (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <MessageThread
                opcodeUrl={OPENCODE_API_ENDPOINT}
                sessionID={activeSessionId}
                messages={messages}
                onChildSessionClick={(id) => setActiveSessionId(id)}
              />
            </div>
            <div className="border-t border-border p-4">
              <PromptInput
                opcodeUrl={OPENCODE_API_ENDPOINT}
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
                Start a new conversation or select an existing session
              </p>
              <Button onClick={handleNewSession} disabled={createSession.isPending} size="lg">
                <MessageSquarePlus className="w-5 h-5 mr-2" />
                New Session
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <SessionList
            opcodeUrl={OPENCODE_API_ENDPOINT}
            onSelectSession={(id) => {
              setActiveSessionId(id)
              setSessionDialogOpen(false)
            }}
            activeSessionID={activeSessionId ?? undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
