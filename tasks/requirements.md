# Requirements

## User Request
切換、session和chat 功能都不正常

## Context
5003 WebUI 已改寫為 5551 風格純聊天介面，頂部保留 Desktop/CLI 分頁切換。

### Known Issues
1. WorkspaceModeBar 切換 Desktop/CLI mode 後，session 列表和 chat 內容沒有正確更新
2. Session dialog 改用 OpenCodeClient.listSessions() 無 directory 參數後仍有問題
3. MessageThread / PromptInput 無法正確顯示或發送訊息

### Tech Stack
- Backend: Bun + Hono + SQLite
- Frontend: React + Vite + TanStack Query
- OpenCode server: v1.2.25 on port 5551
- API proxy: /api/opencode/* → OpenCode server
