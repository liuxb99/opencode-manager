# 5003 WebUI 全面診斷報告

## 一、環境檢查結果

### 1.1 Port 狀態

| 檢查項目 | 結果 | 說明 |
|----------|------|------|
| Port 5003 (後端) | ✅ LISTENING (PID 9284) | 正常運作 |
| Port 5551 (OpenCode) | ✅ LISTENING (PID 21708) | 正常運作 |

### 1.2 Health API

```json
{"status":"healthy","database":"connected","opencode":"healthy","opencodePort":5551,"opencodeVersion":"1.2.25"}
```

✅ 全部通過

### 1.3 State 目錄結構

| 目錄 | 內容 | Sessions |
|------|------|----------|
| state/opencode/ | opencode.db + WAL | **76** |
| state-cli/opencode/ | opencode.db | **115** |
| state-desktop/opencode/ | opencode.db + WAL | **2** |

### 1.4 DB 完整性

- Manager DB (data/opencode.db) ✅ 19 個 tables，含 app_settings
- 當前 workspace_mode: desktop
- CLI 與 Desktop DB 的 session table 均正常

### 1.5 環境摘要

✅ 全部通過 — 環境運作正常

## 二、API 端點測試

| API | 狀態 | 回應 |
|-----|------|------|
| GET /api/health | ✅ 200 | {"status":"healthy"} |
| GET / (前端 HTML) | ✅ 200 | 完整 HTML 頁面 |
| GET /api/settings/workspace-mode | ⚠️ 401 | {"error":"Unauthorized"} |
| GET /api/settings/opencode-configs | ⚠️ 401 | {"error":"Unauthorized"} |

**分析：** 401 是預期行為。Settings routes 掛在 protectedApi 下（backend/src/index.ts:342-346），全部需要 requireAuth 中介層。前端 fetchWrapper 使用 credentials: include，瀏覽器中登入後會帶 cookie 正常運作。

✅ 預期行為，非 Bug

## 三、源碼審查發現

### P0 🔴 State 目錄初始化與模式切換資料遺失

**根因：** WorkspaceModeService.switchMode()（workspace-mode.ts:64-137）在目標模式的 DB 沒有 sessions 時，只嘗試從使用者家目錄匯入（source），不從 state/opencode/（預設目錄）複製。

**資料流：**
1. 首次啟動 -> ensureHomeStateImported() 從 CLI 家目錄匯入到 state/opencode/（76 sessions）
2. 啟動後續 -> ensureDatabaseExists(state-desktop) 建立空的 state-desktop DB
3. OpenCode server 啟動，掛載 state-desktop（0 sessions -> 使用者建立 2 個）
4. 切換到 CLI -> switchMode 從 ~/.local/share/opencode 匯入（115 sessions）
5. 回到 Desktop -> Desktop DB 依然只有 2 個 sessions，state/opencode 的 76 個被遺漏

**受影響操作：** 模式切換時 WebUI 中建立的 sessions 會消失

**修復建議：** 在 switchMode 中，當目標模式 DB 為空時，應先從 state/opencode/（getDefaultStateDir()）嘗試匯入，再從使用者家目錄匯入

**檔案：** backend/src/services/workspace-mode.ts (lines 64-137)

### P1 🔶 CLI Import Path 在 Windows 上不正確

**根因：** getImportSourcePaths()（opencode-import.ts:63-79）
- CLI 模式：path.join(os.homedir(), .local, share, opencode)
- 但 Windows 上 CLI OpenCode 資料儲存在 %APPDATA%\opencode 或 %LOCALAPPDATA%\opencode
- 非 Unix 的 ~/.local/share/opencode

**影響：** 如果使用者僅在 Windows 上用過 CLI OpenCode，切換到 CLI 模式會建立空的 DB

**修復建議：** 加入 Windows 路徑候選（%APPDATA%\opencode）

**檔案：** backend/src/services/opencode-import.ts (lines 63-79)

### P2 🟡 WorkspaceChat 無 directory 參數

**根因：** WorkspaceChat.tsx (line 14) 建立 OpenCodeClient 時只傳入 base URL，不帶 directory。

**影響：** 由於 OpenCode server 已透過 XDG_DATA_HOME 指向正確的 state 目錄，目前無實際影響

**檔案：** frontend/src/components/repo/WorkspaceChat.tsx (line 14)

### P2 🟡 WorkspaceModeBar 無初始化載入狀態處理

**根因：** WorkspaceModeBar.tsx 初始渲染時 value prop 為 desktop，但在 query 尚未載入前，無法確認實際模式。

**影響：** 極小，僅初始渲染 flicker

**檔案：** frontend/src/components/repo/WorkspaceModeBar.tsx (lines 17-30)

## 四、資料流追蹤

### CLI Tab 點擊完整資料流

```
使用者點擊 CLI Tab
  -> WorkspaceModeBar.handleTabChange('cli')
  -> switchModeMutation.mutate('cli')
  -> settingsApi.switchWorkspaceMode('cli')
  -> fetchWrapper: POST /api/settings/workspace-mode { mode: 'cli' }
  -> [requireAuth 檢查]  瀏覽器中帶 cookie -> pass
  -> createSettingsRoutes().post('/workspace-mode')
  -> WorkspaceModeService.switchMode('cli')
    |- 讀取 currentMode (desktop)
    |- 建立 state-cli/opencode/ 目錄
    |- 檢查目標 DB 是否有 sessions
    |   '- state-cli/opencode.db 有 115 sessions -> skipImport = true
    |- opencodeServerManager.setStateDir(state-cli)
    |- writeMode(db, 'cli')
    '- opencodeServerManager.restart()
        |- stop() / kill process
        '- start() -> spawn opencode serve --port 5551
           '- env: XDG_DATA_HOME=.../state-cli
  -> 回傳 { mode: 'cli', restarted: true }
  -> onSuccess -> onChange('cli')
  -> refetch() + invalidate queries
  -> WorkspaceChat re-renders with key='cli' -> refetch sessions
  -> GET /api/opencode/session?limit=50 -> proxy -> OpenCode:5551/session
  -> OpenCode server 從 state-cli/opencode.db 讀取 115 sessions
  -> 前端顯示 session 列表
```

### 失敗點分析

| 環節 | 風險 | 狀態 |
|------|------|------|
| requireAuth | 未登入會 401 | ✅ 正常 |
| workspace-mode POST 400 | 參數錯誤 | ✅ 有驗證 |
| switchMode import | Windows CLI 路徑錯誤 | 🟡 P1 |
| opencodeServerManager.restart | 耗時 (~30s) | ✅ 有 timeout |
| OpenCode server health check | 插件安裝逾時 (120s) | ✅ 正常 |
| Session refetch | server restart 後連線 | ✅ 正常 |

## 五、修復優先級

| 優先級 | 問題 | 檔案 | 難度 |
|--------|------|------|------|
| 🔴 P0 | 模式切換時 state/opencode 的 sessions 不傳承 | workspace-mode.ts | 中 |
| 🔶 P1 | CLI import 路徑在 Windows 不正確 | opencode-import.ts | 低 |
| 🟡 P2 | WorkspaceChat 無 directory 參數 | WorkspaceChat.tsx | 低 |
| 🟡 P2 | WorkspaceModeBar 初始載入 flicker | WorkspaceModeBar.tsx | 低 |

## 六、結論

除 auth 機制（401 是預期）外，實際功能異常為 P0 等級的 mode switch 資料遺失，以及 Windows CLI 匯入路徑不正確。核心系統（後端、資料庫、OpenCode server）運作正常。
