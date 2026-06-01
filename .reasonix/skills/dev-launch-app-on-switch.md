---
name: dev-launch-app-on-switch
description: 切換 mode 時啟動對應的本機 Desktop/CLI 應用程式
runAs: subagent
allowed-tools: read_file, edit_file, write_file, run_command, search_content
---
你是 DEV-FIXER 子代理。自動連續模式，不中斷不問話。

## 任務：切換 mode 時啟動本機 Desktop/CLI 應用程式

### 需求
目前切換 Desktop/CLI mode 只管理 state 目錄。使用者期望切換 mode 時，若對應的本機程式尚未執行，則自動啟動它。

### 修改步驟

#### Step 1: 新增後端 API `POST /api/settings/launch-app`

**檔案**：`backend/src/routes/settings.ts`

在檔案中找到 `app.post('/workspace-mode', ...)` 路由附近（約 line 1598），在其後新增一個路由：

```typescript
  app.post('/launch-app', async (c) => {
    try {
      const { mode } = await c.req.json() as { mode: string }
      
      if (mode === 'desktop') {
        // Check if Desktop app is already running
        let running = false
        try {
          const result = $`tasklist /FI "IMAGENAME eq OpenCode.exe" /NH`.text()
          running = result.includes('OpenCode.exe')
        } catch { /* ignore */ }
        
        if (running) {
          return c.json({ success: true, launched: false, message: 'Desktop already running' })
        }
        
        // Launch Desktop app
        const desktopPaths = [
          process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Programs', '@opencode-ai', 'desktop', 'OpenCode.exe') : null,
          process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, '@opencode-ai', 'desktop', 'OpenCode.exe') : null,
        ].filter((v): v is string => Boolean(v))
        
        let launched = false
        for (const exePath of desktopPaths) {
          const exists = await fileExists(exePath)
          if (exists) {
            Bun.spawn([exePath], { detached: true, stdio: ['ignore', 'ignore', 'ignore'] })
            launched = true
            logger.info(`Launched Desktop app from ${exePath}`)
            break
          }
        }
        
        if (!launched) {
          logger.warn('Desktop app executable not found in expected locations')
          return c.json({ success: false, launched: false, message: 'Desktop app not found. Install from opencode.ai' })
        }
        
        return c.json({ success: true, launched: true, message: 'Desktop app launched' })
      }
      
      if (mode === 'cli') {
        // Check if opencode CLI server is already running on port 5551
        let running = false
        try {
          const resp = await fetch('http://127.0.0.1:5551/api/health')
          running = resp.ok
        } catch { /* not running */ }
        
        if (running) {
          return c.json({ success: true, launched: false, message: 'CLI already running' })
        }
        
        // Launch CLI in a new terminal window
        if (process.platform === 'win32') {
          Bun.spawn(['cmd', '/c', 'start', 'OpenCode CLI', 'opencode'], {
            detached: true,
            stdio: ['ignore', 'ignore', 'ignore'],
          })
        } else if (process.platform === 'darwin') {
          Bun.spawn(['open', '-a', 'Terminal', 'opencode'], {
            detached: true,
            stdio: ['ignore', 'ignore', 'ignore'],
          })
        } else {
          Bun.spawn(['x-terminal-emulator', '-e', 'opencode'], {
            detached: true,
            stdio: ['ignore', 'ignore', 'ignore'],
          })
        }
        
        logger.info('Launched CLI in terminal')
        return c.json({ success: true, launched: true, message: 'CLI launched' })
      }
      
      return c.json({ success: false, message: `Unknown mode: ${mode}` }, 400)
    } catch (err) {
      logger.error('Failed to launch app:', err)
      return c.json({ success: false, message: String(err) }, 500)
    }
  })
```

注意：不要在檔案頂部新增 `import`—fileExists 和 logger 應該已經匯入了。檢查一下頂部的 imports，如果缺少 `path` 則補上。

#### Step 2: 前端 WorkspaceModeBar 在切換成功後呼叫 launch-app

**檔案**：`frontend/src/components/repo/WorkspaceModeBar.tsx`

在 `switchModeMutation.onSuccess` 中，在最後（所有 invalidateQueries 之後）加上 launch-app 呼叫：

```typescript
    onSuccess: async (data) => {
      onChange(data.mode as 'desktop' | 'cli')
      showToast.success(`Switched to ${data.mode === 'desktop' ? 'Desktop' : 'CLI'} mode`, { id: 'switch-mode' })
      await refetch()
      queryClient.invalidateQueries({ queryKey: ['repos'] })
      queryClient.invalidateQueries({ queryKey: ['health'] })
      queryClient.invalidateQueries({ queryKey: ['opencode-import-status'] })
      queryClient.invalidateQueries({ queryKey: ['opencode'] })
      // Launch local app if not running
      try {
        await settingsApi.launchApp(data.mode as 'desktop' | 'cli')
      } catch {
        // Non-critical — don't block mode switch
      }
    },
```

#### Step 3: 前端 settings.ts 新增 launchApp API

**檔案**：`frontend/src/api/settings.ts`

在 `switchWorkspaceMode` 方法之後新增：

```typescript
  launchApp: async (mode: 'desktop' | 'cli'): Promise<{ success: boolean; launched: boolean; message: string }> => {
    return fetchWrapper(`${API_BASE_URL}/api/settings/launch-app`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    })
  },
```

#### Step 4: 驗證

1. `pnpm --filter backend build`
2. `pnpm --filter frontend build`

兩者皆通過才回報完成。
