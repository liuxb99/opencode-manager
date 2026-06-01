---
name: dev-cli-no-import-from-desktop
description: CLI mode 切換時不從 Desktop 匯入 session
runAs: subagent
allowed-tools: read_file, edit_file, write_file, run_command, search_content
---
你是 DEV-FIXER 子代理。自動連續模式，不中斷不問話。

## 任務：CLI mode 切換時不從 Desktop 匯入 session

### 問題
`workspace-mode.ts` 的 `switchMode()` 在切換到 CLI mode 時，會從 `getOpenCodeImportStatus('cli')` 取得外部 source path（在 Windows 上指向 `%LOCALAPPDATA%/opencode`，即 Desktop OpenCode 的 DB），然後匯入到 CLI 的 state 目錄。這導致沒用過 CLI 的使用者，CLI tab 卻顯示 Desktop 的 session。

### 修改方式

在 `switchMode()` 方法中，找到從外部 source 匯入的區塊。當 mode 是 `'cli'` 時，**跳過**這個外部匯入步驟，只保留預設 state 目錄的匯入（`getDefaultStateDir()`）。

**檔案**：`backend/src/services/workspace-mode.ts`

找到以下區塊（約 line 180-200）：
```typescript
      // If nothing was imported from default state, fall through to external source
      if (!importedFromDefault) {
        // Always try to import from source when a source DB is available.
        // This ensures we get a clean database via VACUUM INTO, which properly
        // consolidates WAL files (.db-shm, .db-wal) into the main .db file.
        // A manually copied DB with WAL files may be in an inconsistent state;
        // VACUUM INTO produces a single consistent snapshot.
        const importStatus = await getOpenCodeImportStatus(mode)
        if (importStatus.stateSourcePath) {
          logger.info(`Importing ${mode} state from ${importStatus.stateSourcePath} to ${opencodeDir}...`)
          const { importOpenCodeStateDirectory } = await import('./opencode-import')
          await importOpenCodeStateDirectory(importStatus.stateSourcePath, opencodeDir)
          logger.info(`Imported ${mode} state from ${importStatus.stateSourcePath} to ${opencodeDir}`)
        } else {
          if (!targetDbExists) {
            logger.warn(`No state database or import source for ${mode}, creating empty database`)
            createEmptyDatabase(stateDbPath)
          }
        }
      }
```

改為：
```typescript
      // If nothing was imported from default state, fall through to external source
      // (only for desktop mode — CLI mode should not import from desktop OpenCode)
      if (!importedFromDefault && mode !== 'cli') {
        // Always try to import from source when a source DB is available.
        // This ensures we get a clean database via VACUUM INTO, which properly
        // consolidates WAL files (.db-shm, .db-wal) into the main .db file.
        // A manually copied DB with WAL files may be in an inconsistent state;
        // VACUUM INTO produces a single consistent snapshot.
        const importStatus = await getOpenCodeImportStatus(mode)
        if (importStatus.stateSourcePath) {
          logger.info(`Importing ${mode} state from ${importStatus.stateSourcePath} to ${opencodeDir}...`)
          const { importOpenCodeStateDirectory } = await import('./opencode-import')
          await importOpenCodeStateDirectory(importStatus.stateSourcePath, opencodeDir)
          logger.info(`Imported ${mode} state from ${importStatus.stateSourcePath} to ${opencodeDir}`)
        } else {
          if (!targetDbExists) {
            logger.warn(`No state database or import source for ${mode}, creating empty database`)
            createEmptyDatabase(stateDbPath)
          }
        }
      }
```

同時，在外部匯入被跳過且 target DB 不存在時，也要建立空資料庫。所以加上 else 分支處理 CLI mode 且 target DB 不存在的情況。在外部匯入被跳過時：

```typescript
      // If nothing was imported from default state, fall through to external source
      // (only for desktop mode — CLI mode should not import from desktop OpenCode)
      if (!importedFromDefault) {
        if (mode === 'cli') {
          // CLI mode: don't import from desktop source, just create empty DB
          if (!targetDbExists) {
            logger.warn(`No state database for cli mode, creating empty database`)
            createEmptyDatabase(stateDbPath)
          }
        } else {
          // Desktop mode: try to import from external source
          const importStatus = await getOpenCodeImportStatus(mode)
          if (importStatus.stateSourcePath) {
            logger.info(`Importing ${mode} state from ${importStatus.stateSourcePath} to ${opencodeDir}...`)
            const { importOpenCodeStateDirectory } = await import('./opencode-import')
            await importOpenCodeStateDirectory(importStatus.stateSourcePath, opencodeDir)
            logger.info(`Imported ${mode} state from ${importStatus.stateSourcePath} to ${opencodeDir}`)
          } else {
            if (!targetDbExists) {
              logger.warn(`No state database or import source for ${mode}, creating empty database`)
              createEmptyDatabase(stateDbPath)
            }
          }
        }
      }
```

### 驗證
執行 `pnpm --filter backend build` 確認通過。
完成後回報修改摘要與 build 結果。
