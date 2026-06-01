# Plan

## Root Causes

1. activeSessionId not reset on mode switch
2. Session list query lacks workspaceMode key
3. Backend import logic overwrites existing data
4. ensureHomeStateImported uses wrong target dir

## Tasks

### TASK-001: Reset activeSessionId on mode switch
File: frontend/src/pages/Repos.tsx
Add useEffect to clear activeSessionId when workspaceMode changes.

### TASK-002: Add workspaceMode to session list query key
File: frontend/src/pages/Repos.tsx
Add retry logic for server restart during mode switch.

### TASK-003: Protect target DB from overwrite
File: backend/src/services/workspace-mode.ts
Skip import if target DB already has sessions.

### TASK-004: Fix ensureHomeStateImported target dir
File: backend/src/index.ts
Import to mode-specific state dir instead of hardcoded state/.

### TASK-005: Fix restart() health check
File: backend/src/services/opencode-single-server.ts
Add port release wait and post-start health verification.

### TASK-006: End-to-end verification

## Execution Order
TASK-001 + TASK-003 (parallel) → TASK-004 → TASK-002 → TASK-005 → TASK-006
