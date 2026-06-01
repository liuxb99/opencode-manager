---
name: dev-fix-windows-desktop-db-path
description: 修復 Windows Desktop mode DB 路徑
runAs: subagent
allowed-tools: read_file, edit_file, write_file, run_command, search_content
---
你是 DEV-FIXER 子代理。自動連續模式，不中斷不問話。

## 任務：修復 Windows 上 Desktop mode 的 DB 路徑

### 問題
OpenCode 在 Windows 上使用 `xdg-basedir` 套件，將 `XDG_DATA_HOME` 對應到 `%LOCALAPPDATA%`（`C:\Users\<user>\AppData\Local`）。因此 OpenCode 的資料庫實際位於：

```
%LOCALAPPDATA%/opencode/opencode.db
```

但 opencode-manager 的 `getStateDirForMode('desktop')` 在兩個檔案中都被寫死為 `~/.local/share`，導致 Desktop 模式下去讀取不存在的路徑，session list 永遠為空。

### 需要修改的三個檔案

#### 檔案 1: `backend/src/services/desktop-state.ts`

修改 `getStateDirForMode` 函數。當前內容（約 line 37-42）：
```typescript
function getStateDirForMode(mode: 'desktop' | 'cli'): string {
  if (mode === 'desktop') {
    const home = process.env.USERPROFILE || process.env.HOME || ''
    return path.join(home, '.local', 'share')
  }
  return path.join(getWorkspacePath(), '.opencode', `state-${mode}`)
}
```

改為：
```typescript
function getStateDirForMode(mode: 'desktop' | 'cli'): string {
  if (mode === 'desktop') {
    // Windows: OpenCode xdg-basedir maps XDG_DATA_HOME → %LOCALAPPDATA%
    if (process.platform === 'win32') {
      return process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')
    }
    const home = process.env.USERPROFILE || process.env.HOME || ''
    return path.join(home, '.local', 'share')
  }
  return path.join(getWorkspacePath(), '.opencode', `state-${mode}`)
}
```

#### 檔案 2: `backend/src/services/workspace-mode.ts`

找到 `getStateDirForMode` 函數（約 line 12-19）。當前內容：
```typescript
function getStateDirForMode(mode: WorkspaceMode): string {
  if (mode === 'desktop') {
    const home = process.env.USERPROFILE || process.env.HOME || ''
    return path.join(home, '.local', 'share')
  }
  const base = path.join(getWorkspacePath(), '.opencode')
  return path.join(base, `state-${mode}`)
}
```

改為與 desktop-state.ts 相同的邏輯：
```typescript
function getStateDirForMode(mode: WorkspaceMode): string {
  if (mode === 'desktop') {
    // Windows: OpenCode xdg-basedir maps XDG_DATA_HOME → %LOCALAPPDATA%
    if (process.platform === 'win32') {
      return process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')
    }
    const home = process.env.USERPROFILE || process.env.HOME || ''
    return path.join(home, '.local', 'share')
  }
  const base = path.join(getWorkspacePath(), '.opencode')
  return path.join(base, `state-${mode}`)
}
```

#### 檔案 3: `backend/src/services/opencode-import.ts`

找到 `getImportSourcePaths` 函數中的 Desktop mode 分支（約 line 62-76）。當前 Desktop mode 的 stateCandidates 只包含 `<desktopPath>/opencode` 等路徑，其中 `desktopPath` = `%APPDATA%/ai.opencode.desktop`。

但 OpenCode Desktop 在 Windows 上也可能在 `%LOCALAPPDATA%/opencode` 存放資料（原生 OpenCode，非舊 Tauri 版本）。

所以需要在 Desktop mode 的 stateCandidates 中增加 `%LOCALAPPDATA%/opencode` 作為優先候選：

```typescript
if (source === 'desktop') {
    const desktopPath = getDesktopDataPath()
    const stateCandidates = [
      // Windows: also check native OpenCode state directory
      ...(process.platform === 'win32' ? [
        process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'opencode') : null,
        process.env.APPDATA ? path.join(process.env.APPDATA, 'opencode') : null,
      ].filter((v): v is string => Boolean(v)) : []),
      path.join(desktopPath, 'opencode'),
      path.join(desktopPath, 'opencode', 'state'),
      path.join(desktopPath, '.opencode', 'state', 'opencode'),
    ]
    return {
      source,
      sourceLabel: 'OpenCode Desktop',
      configCandidates: [
        path.join(desktopPath, 'opencode', 'opencode.json'),
        path.join(desktopPath, 'opencode.json'),
      ],
      stateCandidates,
    }
  }
```

### 驗證
執行 `pnpm --filter backend build` 確認通過。

完成後回報修改摘要與 build 結果。
