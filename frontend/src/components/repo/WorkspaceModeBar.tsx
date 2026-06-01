import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Loader2, Monitor, Terminal, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsApi } from '@/api/settings'
import { showToast } from '@/lib/toast'

interface WorkspaceModeBarProps {
  value: 'desktop' | 'cli'
  onChange: (value: 'desktop' | 'cli') => void
}

export function WorkspaceModeBar({ value, onChange }: WorkspaceModeBarProps) {
  const queryClient = useQueryClient()

  const { data: modeStatus, isLoading, refetch } = useQuery({
    queryKey: ['workspace-mode'],
    queryFn: () => settingsApi.getWorkspaceMode(),
    staleTime: 30 * 1000,
  })

  const switchModeMutation = useMutation({
    mutationFn: async (mode: 'desktop' | 'cli') => {
      return settingsApi.switchWorkspaceMode(mode)
    },
    onSuccess: async (data) => {
      onChange(data.mode as 'desktop' | 'cli')
      showToast.success(`Switched to ${data.mode === 'desktop' ? 'Desktop' : 'CLI'} mode`, { id: 'switch-mode' })
      await refetch()
      queryClient.invalidateQueries({ queryKey: ['repos'] })
      queryClient.invalidateQueries({ queryKey: ['health'] })
      queryClient.invalidateQueries({ queryKey: ['opencode-import-status'] })
      // Invalidate session list to refresh from new mode's state directory
      queryClient.invalidateQueries({ queryKey: ['opencode'] })
      // Launch local app if not running
      try {
        await settingsApi.launchApp(data.mode as 'desktop' | 'cli')
      } catch {
        // Non-critical — don't block mode switch
      }
    },
    onError: () => {
      showToast.error('Failed to switch workspace mode', { id: 'switch-mode' })
    },
  })

  const activeStatus = value === 'desktop' ? modeStatus?.desktop : modeStatus?.cli
  const activeMode = modeStatus?.currentMode

  const handleTabChange = (newValue: string) => {
    const mode = newValue as 'desktop' | 'cli'
    if (mode !== value && !switchModeMutation.isPending) {
      switchModeMutation.mutate(mode)
    }
  }

  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2">
        <Tabs value={value} onValueChange={handleTabChange}>
          <TabsList className="h-8">
            <TabsTrigger
              value="desktop"
              className="text-xs px-3 py-1 h-7 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              disabled={switchModeMutation.isPending}
            >
              <Monitor className="h-3 w-3 mr-1" />
              Desktop
            </TabsTrigger>
            <TabsTrigger
              value="cli"
              className="text-xs px-3 py-1 h-7 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              disabled={switchModeMutation.isPending}
            >
              <Terminal className="h-3 w-3 mr-1" />
              CLI
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {switchModeMutation.isPending ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Switching...
            </div>
          ) : isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn(
                  'inline-flex items-center gap-1',
                  activeStatus?.stateExists && 'text-green-500'
                )}>
                  <span className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    activeStatus?.stateExists ? 'bg-green-500' : 'bg-muted-foreground/30'
                  )} />
                  {activeStatus?.stateExists ? 'Ready' : 'No data'}
                </span>
                {activeMode && activeMode !== value && (
                  <span className="text-muted-foreground/50 italic">
                    ({activeMode === 'desktop' ? 'Desktop' : 'CLI'} active)
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => refetch()}
                title="Refresh status"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Session summary bar */}
      {activeStatus && !isLoading && (
        <div className="flex gap-4 px-4 pb-2 text-[11px] text-muted-foreground/60 overflow-x-auto">
          {activeStatus.stateExists ? (
            <>
              <span className="flex items-center gap-1 shrink-0">
                🗂️ {activeStatus.sessionSummary?.sessionCount ?? 0} sessions
              </span>
              {activeStatus.sessionSummary?.recentSessions?.length > 0 && (
                <span className="truncate min-w-0 flex items-center gap-1">
                  <span className="shrink-0">Recent:</span>
                  {activeStatus.sessionSummary.recentSessions.map((s: any, i: number) => (
                    <span key={s.id} className="truncate max-w-[120px]" title={s.title}>
                      {i > 0 && <span className="mx-0.5">·</span>}
                      {s.title || 'Untitled'}
                    </span>
                  ))}
                </span>
              )}
            </>
          ) : (
            <span className="italic">
              No {value === 'cli' ? 'CLI' : 'Desktop'} data found. Add a repo or import to get started.
            </span>
          )}
        </div>
      )}
    </div>
  )
}
