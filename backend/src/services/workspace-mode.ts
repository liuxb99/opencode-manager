import path from 'path'
import os from 'os'
import { logger } from '../utils/logger'
import { getWorkspacePath } from '@opencode-manager/shared/config/env'
import { opencodeServerManager } from './opencode-single-server'
import { ensureDirectoryExists, fileExists } from './file-operations'
import { getOpenCodeImportStatus, type OpenCodeImportSource } from './opencode-import'
import type { Database } from 'bun:sqlite'
import { Database as BunDatabase } from 'bun:sqlite'

export type WorkspaceMode = 'desktop' | 'cli'

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

/** Returns fallback state dir, not mode-specific. Use getStateDirForMode() for mode-specific paths. */
export function getDefaultStateDir(): string {
  return path.join(getWorkspacePath(), '.opencode', 'state')
}

function readMode(db: Database): WorkspaceMode {
  const row = db.query('SELECT value FROM app_settings WHERE key = ?').get('workspace_mode') as { value: string } | undefined
  return (row?.value as WorkspaceMode) || 'desktop'
}

function writeMode(db: Database, mode: WorkspaceMode): void {
  db.query(
    'INSERT OR REPLACE INTO app_settings(key, value, updated_at) VALUES(?, ?, ?)'
  ).run('workspace_mode', mode, Date.now())
}

function createEmptyDatabase(dbPath: string): void {
  const empty = new BunDatabase(dbPath)
  empty.close()
  logger.info(`Created empty state database at ${dbPath}`)
}

export class WorkspaceModeService {
  constructor(private db: Database) {
    db.exec(`CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`)
  }

  getCurrentMode(): WorkspaceMode {
    return readMode(this.db)
  }

  async getModeStateDir(mode: WorkspaceMode): Promise<string> {
    const dir = getStateDirForMode(mode)
    await ensureDirectoryExists(dir)
    return dir
  }

  async getModeStatus(mode: WorkspaceMode): Promise<{
    mode: WorkspaceMode
    stateDir: string
    stateExists: boolean
    configSourcePath: string | null
    stateSourcePath: string | null
    sessionSummary: {
      sessionCount: number
      recentSessions: Array<{ id: string; title: string; updatedAt: number }>
    }
  }> {
    const dir = getStateDirForMode(mode)
    const stateDbPath = path.join(dir, 'opencode', 'opencode.db')
    const stateExists = await fileExists(stateDbPath)
    const importStatus = await getOpenCodeImportStatus(mode)

    let sessionCount = 0
    let recentSessions: Array<{ id: string; title: string; updatedAt: number }> = []

    if (stateExists) {
      try {
        const stateDb = new BunDatabase(stateDbPath, { readonly: true })
        const tableExists = stateDb.query(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='session'"
        ).get() as { name: string } | undefined

        if (tableExists) {
          const countRow = stateDb.query('SELECT COUNT(*) as total FROM session').get() as { total: number } | undefined
          sessionCount = countRow?.total ?? 0

          const rows = stateDb.query(
            'SELECT id, COALESCE(title,"") as title, time_updated FROM session ORDER BY time_updated DESC LIMIT 3'
          ).all() as Array<{ id: string; title: string; time_updated: number }>

          recentSessions = rows.map(r => ({
            id: r.id,
            title: r.title,
            updatedAt: r.time_updated,
          }))
        }

        stateDb.close()
      } catch (err) {
        logger.warn(`Failed to read session data from ${stateDbPath}: ${err}`)
      }
    }

    return {
      mode,
      stateDir: dir,
      stateExists,
      configSourcePath: importStatus.configSourcePath,
      stateSourcePath: importStatus.stateSourcePath,
      sessionSummary: {
        sessionCount,
        recentSessions,
      },
    }
  }

  async switchMode(mode: WorkspaceMode): Promise<{ mode: WorkspaceMode; restarted: boolean }> {
    const currentMode = readMode(this.db)
    if (currentMode === mode) {
      return { mode, restarted: false }
    }

    const stateDir = getStateDirForMode(mode)
    const opencodeDir = path.join(stateDir, 'opencode')
    await ensureDirectoryExists(opencodeDir)

    const stateDbPath = path.join(opencodeDir, 'opencode.db')

    // Check if target DB already exists with sessions — if so, skip import
    // to avoid VACUUM INTO overwriting existing data.
    const targetDbExists = await fileExists(stateDbPath)
    let skipImport = false
    if (targetDbExists) {
      try {
        const targetDb = new BunDatabase(stateDbPath)
        // Verify the session table exists before querying
        const tableExists = targetDb.query(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='session'"
        ).get() as { name: string } | undefined
        if (tableExists) {
          const row = targetDb.query('SELECT COUNT(*) as cnt FROM session').get() as { cnt: number } | undefined
          skipImport = row !== undefined && row.cnt > 0
        }
        targetDb.close()
      } catch (err) {
        logger.warn(`Failed to check sessions in target DB ${stateDbPath}, will re-import: ${err}`)
      }
    }

    if (skipImport) {
      logger.info(
        `Target DB ${stateDbPath} already has sessions, skipping import to preserve existing data`
      )
    } else {
      // First, try to import from the default (non-mode-specific) state directory
      // so that sessions already in the workspace are carried over.
      const defaultStateDir = getDefaultStateDir()
      const defaultDbPath = path.join(defaultStateDir, 'opencode', 'opencode.db')
      let importedFromDefault = false

      if (await fileExists(defaultDbPath)) {
        try {
          const defaultDb = new BunDatabase(defaultDbPath)
          const tableExists = defaultDb.query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='session'"
          ).get() as { name: string } | undefined
          if (tableExists) {
            const row = defaultDb.query('SELECT COUNT(*) as cnt FROM session').get() as { cnt: number } | undefined
            if (row !== undefined && row.cnt > 0) {
              logger.info(
                `Importing ${mode} state from default state directory ${defaultStateDir}...`
              )
              const { importOpenCodeStateDirectory } = await import('./opencode-import')
              await importOpenCodeStateDirectory(path.join(defaultStateDir, 'opencode'), opencodeDir)
              importedFromDefault = true
              logger.info(
                `Imported ${mode} state from default state directory to ${opencodeDir}`
              )
            }
          }
          defaultDb.close()
        } catch (err) {
          logger.warn(`Failed to import from default state, falling back: ${err}`)
        }
      }

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
    }

    opencodeServerManager.setStateDir(stateDir)
    writeMode(this.db, mode)
    logger.info(`Switched to ${mode} mode, state directory: ${stateDir}`)

    await opencodeServerManager.restart()

    return { mode, restarted: true }
  }

  async ensureStateDir(mode: WorkspaceMode): Promise<void> {
    const stateDir = getStateDirForMode(mode)
    await ensureDirectoryExists(stateDir)
  }

  async ensureDatabaseExists(stateDir: string): Promise<void> {
    const opencodeDir = path.join(stateDir, 'opencode')
    await ensureDirectoryExists(opencodeDir)
    const dbPath = path.join(opencodeDir, 'opencode.db')
    const exists = await fileExists(dbPath)
    if (!exists) {
      createEmptyDatabase(dbPath)
    }
  }
}
