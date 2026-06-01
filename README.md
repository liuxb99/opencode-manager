# OpenCode Manager

OpenCode Manager 是一個給 [OpenCode](https://opencode.ai) 使用的 Web UI，可以在瀏覽器中管理 repo、啟動 agent session、查看檔案、處理 Git 工作流程，並透過單一後端管理 OpenCode server。

本 fork 的預設使用方式是 **Windows 本機啟動，不使用 Docker**。

## 快速啟動

需求：

- Windows
- Node.js
- Bun
- OpenCode CLI

在專案根目錄執行：

```bat
start-local.bat
```

啟動後開啟：

```text
http://localhost:5003
```

第一次進入會要求建立 Admin 帳號。

## start-local.bat 做了什麼

`start-local.bat` 會自動處理：

- 檢查 Node.js、Bun、OpenCode CLI
- 透過 Corepack 使用 pnpm
- 建立或修正 `.env`
- 產生 `AUTH_SECRET`
- 建立 Windows 用的 `opencode.cmd` shim
- 啟動前清理舊的 `5003` / `5551` 實例
- 安裝依賴
- build backend 與 frontend
- 啟動 OpenCode Manager backend

視窗會保留，不會執行完就直接關閉。

## 服務網址與 Port

- OpenCode Manager Web UI / API: `http://localhost:5003`
- OpenCode server: `http://127.0.0.1:5551`

## 常用指令

檢查本機環境：

```bat
start-local.bat --check
```

手動啟動開發模式：

```bash
corepack pnpm install
corepack pnpm dev
```

檢查程式碼：

```bash
corepack pnpm lint
corepack pnpm --filter backend lint
corepack pnpm --filter frontend lint
```

Build：

```bash
corepack pnpm build
```

## 專案結構

- `backend/`：Bun + Hono API server，負責 auth、SQLite、OpenCode process、SSE、排程與 Git 操作
- `frontend/`：React + Vite Web UI
- `shared/`：前後端共用型別、Zod schema、設定工具
- `scripts/`：本機啟動與輔助腳本
- `workspace/`：本機執行時產生的工作目錄，不建議提交
- `data/`：SQLite 資料庫，不建議提交

## Windows 本機修正

這個版本針對 Windows 本機啟動做了幾個調整：

- Windows IPC 改用 localhost TCP，避免 Bun named pipe `ENOENT`
- OpenCode 啟動命令在 Windows 使用 `opencode.cmd`
- health check 啟動等待期間不再輸出 `/doc` connection refused stack trace
- port 查找在 Windows 使用 PowerShell，而不是 `lsof`
- `start-local.bat` 啟動前會清理舊實例，避免 `port 5003 in use`
- 設定頁可切換 OpenCode 匯入來源：OpenCode CLI / OpenCode Desktop，切換後會立即重新顯示可匯入路徑

## 疑難排解

如果顯示 `port 5003 in use`：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stop-local-instances.ps1 -Root .
```

如果 `.env` 被錯誤寫入像這樣的內容：

```text
AUTH_SECRET=$(openssl rand -base64 32)
```

重新執行：

```bat
start-local.bat --check
```

如果 `pnpm` 找不到，這個專案會優先使用 Corepack：

```bat
corepack pnpm --version
```

如果 OpenCode server 一開始還沒 ready，請等幾秒；正常成功訊息會包含：

```text
OpenCode server is healthy
SSE global stream connected
```

## Git 使用建議

建議不要提交以下本機產物：

- `.env`
- `data/`
- `workspace/`
- `logs/`
- `node_modules/`
- `scripts/.bin/`

## 授權

MIT
