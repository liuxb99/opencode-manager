# UI Redesign Plan: Port 5003 → 5551 Pure Chat Interface

## Goal

Replace the split-panel `/repos` page with a pure chat interface identical to 5551's `ChatHome.tsx`. WorkspaceModeBar (Desktop/CLI tabs) stays at the top.

## Component Analysis

### 🔵 Keep (unchanged)
| Component | File | Reason |
|---|---|---|
| WorkspaceModeBar | `frontend/src/components/repo/WorkspaceModeBar.tsx` | Already provides Desktop/CLI switching |
| MessageThread | `frontend/src/components/message/MessageThread.tsx` | Chat core component, reusable |
| PromptInput | `frontend/src/components/message/PromptInput.tsx` | Chat input core component, reusable |
| SessionList | `frontend/src/components/session/SessionList.tsx` | Already used in Dialog pattern (ChatHome) |
| Header | `frontend/src/components/ui/header.tsx` | Top bar, same structure |
| PendingActionsGroup | `frontend/src/components/notifications/PendingActionsGroup.tsx` | Keep in Header |

### 🟡 Modify
| Component | File | Changes |
|---|---|---|
| Repos.tsx | `frontend/src/pages/Repos.tsx` | Full rewrite to match ChatHome.tsx style |

### 🔴 Remove from Repos.tsx
| Component | Reason |
|---|---|
| WorkspaceChat | Only used by old Repos.tsx |
| AddRepoDialog | Keep component, remove from Repos.tsx |
| RepoList | No longer shown |
| FileBrowserSheet | No longer needed on home |
| useDialogParam | No longer needed |
| repo API imports | Page no longer manages repos |

## Behavior Diff (Old Repos → New Repos)

| Aspect | Old Repos.tsx | New Repos.tsx (same as ChatHome) |
|---|---|---|
| Header | Logo + Add Repo / Schedules / Settings | Logo + PendingActions + Sessions btn + Settings |
| Main content | WorkspaceChat (left session list + right chat) | Single chat area (empty state first) |
| Session mgmt | Fixed left panel | Dialog popup |
| Input | Inside WorkspaceChat | Fixed at chat bottom (PromptInput) |
| State | workspaceMode + navigation | workspaceMode + activeSessionId |
| API endpoint | /api/opencode (hardcoded) | OPENCODE_API_ENDPOINT (from config) |

## Implementation Steps

### Step 1 — Rewrite Repos.tsx
**Risk: Low-Medium**

1. Remove imports: RepoList, WorkspaceChat, AddRepoDialog, FileBrowserSheet, useDialogParam, useSidebarAction, Plus/FolderOpen/CalendarClock icons, repo API fns
2. Add imports: useState, useCallback, MessageSquarePlus, PanelRightOpen icons, useMessages/useCreateSession, OPENCODE_API_ENDPOINT, showToast, Dialog/DialogContent
3. Change state: 
   - workspaceMode: OpenCodeImportSource
   - activeSessionId: string | null
   - sessionDialogOpen: boolean
4. Add create session logic + scrollToBottom no-op
5. Replace template with pure chat layout

### Step 2 — Clean up WorkspaceChat.tsx (optional)
**Risk: Low** — Only used by old Repos.tsx

### Step 3 — Verify routes
**Risk: Low** — All routes unchanged

### Step 4 — Testing

| Test | Expected |
|---|---|
| Enter /repos | Shows Welcome + New Session |
| Desktop/CLI switch | Session list rebuilds |
| Click New Session | Creates session, enters chat mode |
| Send message | Message appears |
| Open Session Dialog | Lists sessions, can switch |
| Switch mode | State resets to empty |

## Risk Assessment

| Risk | Level | Mitigation |
|---|---|---|
| Session state change (URL → local) | Medium | Reference proven ChatHome.tsx |
| WorkspaceChat deletion impact | Low | grep confirms only Repos uses it |
| OPENCODE_API_ENDPOINT mismatch | Low | Verify same backend |
| Desktop/CLI switch loses session | Low | Expected, same as ChatHome |
| Missing Add Repo entry point | Medium | RepoQuickSwitchSheet still has it |

## Conclusion

Core of this redesign: **replace Repos.tsx with ChatHome.tsx logic**. Low technical risk since ChatHome already works on `/` route. Business process risk is the main concern — ensure users can still add repos via Sidebar / RepoQuickSwitchSheet.
