---
name: dev-mobile-drawer-layout
description: 手機版 Repos.tsx 左欄改為抽屜式 Drawer
runAs: subagent
allowed-tools: read_file, edit_file, write_file, run_command, search_content
---
你是 DEV-FIXER 子代理。自動連續模式，不中斷不問話。

## 任務：手機版改為左欄抽屜式（Drawer）

### 需求
手機上（寬度 < 768px）：
- 預設全螢幕顯示聊天室（右欄）
- session 列表隱藏在左邊，透過**漢堡按鈕**點擊滑出
- 滑出的 session 列表覆蓋在聊天室上方（overlay），佔約 75% 螢幕寬度
- 點選 session → 關閉抽屜 + 載入該 session 的聊天
- 點擊抽屜外背景 → 關閉抽屜

桌機上：維持現有左右兩欄不變

### 檔案
`frontend/src/pages/Repos.tsx`

### 修改內容

**1. 新增 state**
在 `const [searchQuery, setSearchQuery] = useState("")` 之後新增：
```typescript
const [sessionDrawerOpen, setSessionDrawerOpen] = useState(false)
```

**2. 手機版 Header 增加漢堡按鈕**
找到 Header 區塊，在 `<Header.Title>` 旁邊（手機上）加上漢堡按鈕：
```tsx
<Header>
  {isMobile && (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setSessionDrawerOpen(true)}
      className="h-8 w-8 mr-1"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </Button>
  )}
  <Header.Title logo>OpenCode</Header.Title>
  ...
</Header>
```

**3. 修改 container flex 方向**
改回 flex-row（手機和桌機都用 flex-row，但手機上左欄是 overlay）：
```tsx
<div className="flex-1 min-h-0 flex flex-row">
```

**4. 手機版左欄改為 overlay drawer**
找到 session list 的 div，改為手機上用 overlay：
```tsx
{/* Session list panel — desktop: sidebar, mobile: drawer overlay */}
{isMobile ? (
  /* Mobile drawer overlay */
  <>
    {/* Backdrop */}
    {sessionDrawerOpen && (
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setSessionDrawerOpen(false)}
      />
    )}
    {/* Drawer */}
    <div
      className={cn(
        "fixed top-0 left-0 h-full w-[75vw] max-w-sm z-50 bg-card shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
        sessionDrawerOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSessionDrawerOpen(false)}
          className="h-7 w-7 shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </Button>
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sessionsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">No sessions</div>
        ) : (
          <div className="py-1">
            {filteredSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveSessionId(s.id)
                  setSessionDrawerOpen(false)
                }}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors border-b border-border/30 text-sm",
                  activeSessionId === s.id && "bg-accent"
                )}
              >
                <div className="font-medium truncate">{s.title || "Untitled Session"}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {s.time?.created ? formatDistanceToNow(new Date(s.time.created), { addSuffix: true }) : ""}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  </>
) : (
  /* Desktop sidebar */
  <div className="w-72 border-r border-border flex flex-col flex-shrink-0 bg-card/20">
    <div className="p-2 border-b border-border">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>
    </div>
    <div className="flex-1 overflow-y-auto">
      {sessionsLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm py-8">No sessions</div>
      ) : (
        <div className="py-1">
          {filteredSessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 hover:bg-accent/50 transition-colors border-b border-border/30 text-sm",
                activeSessionId === s.id && "bg-accent"
              )}
            >
              <div className="font-medium truncate">{s.title || "Untitled Session"}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {s.time?.created ? formatDistanceToNow(new Date(s.time.created), { addSuffix: true }) : ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
)}
```

**5. 勾選 session 後自動關閉抽屜**
在 session 的 onClick 中已經加了 `setSessionDrawerOpen(false)`。

### 最終手機版佈局
```
┌──────────────────────────┐
│ ☰  OpenCode       [+ New] │  ← Header 漢堡按鈕
├──────────────────────────┤
│  Desktop | CLI            │  ← WorkspaceModeBar
├──────────────────────────┤
│                          │
│    聊天畫面 (全螢寬)      │  ← 預設顯示
│                          │
│    PromptInput            │
└──────────────────────────┘

點擊 ☰ 後：
┌─────┬────────────────────┐
│ ☰   │  (半透明遮罩)       │  ← 點遮罩關閉抽屜
│ Search...                │
│                         │
│ Session 1   ← 點選關閉   │
│ Session 2               │
│ Session 3               │
│ ... (75% 寬)             │
└─────┴────────────────────┘
```

### 驗證
執行 `pnpm --filter frontend build` 確認通過。
