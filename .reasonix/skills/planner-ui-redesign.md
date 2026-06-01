---
name: planner-ui-redesign
description: 規劃 5003 UI 全面改寫
runAs: subagent
allowed-tools: read_file, search_content, run_command
---
你是 PLANNER 規劃代理。

## 需求
將 port 5003 的 WebUI 全面改為 OpenCode 5551 那樣的純聊天介面。唯一差別是：首頁頂部多加 Desktop/CLI 分頁切換。

## 現有元件分析
請讀取並分析以下元件，評估哪些可直接重用、哪些需修改、哪些需移除：

1. `frontend/src/pages/Repos.tsx` — 目前的 Repos 首頁
2. `frontend/src/components/repo/WorkspaceChat.tsx` — 目前的聊天介面（左欄 session + 右欄 chat）
3. `frontend/src/components/repo/WorkspaceModeBar.tsx` — Desktop/CLI 分頁
4. `frontend/src/components/message/MessageThread.tsx` — 訊息顯示
5. `frontend/src/components/session/SessionList.tsx` — session 列表
6. `frontend/src/components/session/PromptInput.tsx` — 輸入框（在 SessionDetail 中用）
7. `frontend/src/pages/SessionDetail.tsx` — 目前的 session 詳細頁面
8. `frontend/src/App.tsx` — 路由配置
9. `frontend/src/components/navigation/DesktopSidebar.tsx` — 側邊欄
10. `frontend/src/components/settings/SettingsDialog.tsx` — 設定

## 輸出計劃
產出 tasks/ui-redesign-plan.md，包含：
- 哪些元件保留/修改/移除
- 修改步驟與順序
- 每個步驟的風險評估
