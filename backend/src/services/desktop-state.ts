import path from 'path'
import os from 'os'
import { promises as fs } from 'fs'
import { Database } from 'bun:sqlite'
import { logger } from '../utils/logger'
import { getWorkspacePath } from '@opencode-manager/shared/config/env'

export interface DesktopSessionInfo {
  id: string
  title: string
  directory: string
  lastPrompt: string
  timeCreated: number
}

const DESKTOP_DIR = process.env.APPDATA
  ? path.join(process.env.APPDATA, 'ai.opencode.desktop')
  : path.join(os.homedir(), 'AppData', 'Roaming', 'ai.opencode.desktop')

const SHARED_DB_PATH = path.join(os.homedir(), '.local', 'share', 'opencode', 'opencode.db')

export async function readDesktopSessions(): Promise<DesktopSessionInfo[]> {
  return readAllSessionsFromDb(SHARED_DB_PATH)
}

/**
 * 取得指定 mode 的 state 目錄，與 workspace-mode.ts 的 getStateDirForMode() 邏輯一致
 */
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

/**
 * 取得指定 mode 的 DB 路徑
 */
function getDbPathForMode(mode: 'desktop' | 'cli'): string {
  return path.join(getStateDirForMode(mode), 'opencode', 'opencode.db')
}

export async function readAllSessions(mode: 'desktop' | 'cli'): Promise<DesktopSessionInfo[]> {
  return readAllSessionsFromDb(getDbPathForMode(mode))
}

async function readAllSessionsFromDb(dbPath: string): Promise<DesktopSessionInfo[]> {
  try {
    const db = new Database(dbPath, { readonly: true })
    const rows = db.query(
      'SELECT id, COALESCE(title,"") as title, COALESCE(directory,"") as directory, time_created FROM session ORDER BY time_created DESC'
    ).all() as { id: string; title: string; directory: string; time_created: number }[]
    db.close()
    return rows.map(r => ({
      id: r.id,
      title: r.title || 'Untitled',
      directory: r.directory,
      lastPrompt: '',
      timeCreated: r.time_created,
    }))
  } catch (error) {
    logger.warn(`Failed to read sessions from ${dbPath}:`, error)
    return []
  }
}
