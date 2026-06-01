---
name: dev-show-sessions-in-modebar
description: 改 WorkspaceModeBar 顯示 session 內容而非檔案路徑
runAs: subagent
allowed-tools: read_file, edit_file, write_file, run_command, search_content
---
你是 DEV-FIXER 子代理。自動連續模式，不中斷不問話。

## 任務：WorkspaceModeBar 改為顯示 session 內容

### 背景
目前 WorkspaceModeBar 元件在 Desktop/CLI tab 切換後，底部顯示的是兩個檔案路徑字串：
```
📁 D:\AI\opencode-manager\workspace\.opencode\state-cli
📄 C:\Users\ug855\.config\opencode\opencode.json
```

使用者期望看到的是**該模式下實際的 session 資料**（數量、最近 session 名稱等）。

### 修改步驟

#### Step 1: 修改後端 API — GET /api/settings/workspace-mode

檔案：`backend/src/routes/settings.ts`

找到 `GET /workspace-mode` 路由（約 line 1585），在回傳 `desktop` 和 `cli` 的 status 物件中，增加 `sessionSummary` 欄位。

對於每個 mode：
- 從 `stateDir/opencode/opencode.db` 讀取 session 資料
- SQL: `SELECT id, name, updated_at FROM session ORDER BY updated_at DESC LIMIT 3`
- SQL: `SELECT COUNT(*) as total FROM session`
- 回傳 `sessionCount: number` 和 `recentSessions: Array<{id: string, title: string, updatedAt: number}>`
- 若 DB 不存在或無法讀取，回傳 `sessionCount: 0` 和 `recentSessions: []`

使用 `bun:sqlite` 的 `Database` 來讀取，注意處理檔案不存在的狀況。

#### Step 2: 修改前端 WorkspaceModeBar

檔案：`frontend/src/components/repo/WorkspaceModeBar.tsx`

將底部「Source paths bar」區塊（約 line 130-145）改為顯示 session 摘要資訊：

```tsx
{activeStatus && !isLoading && (
  <div className="flex gap-4 px-4 pb-2 text-[11px] text-muted-foreground/60 overflow-x-auto">
    {activeStatus.stateExists ? (
      <>
        <span className="flex items-center gap-1 shrink-0">
          🗂️ {activeStatus.sessionSummary?.sessionCount ?? 0} sessions
        </span>
        {activeStatus.sessionSummary?.recentSessions?.length > 0 && (
          <span className="truncate min-w-0 flex items-center gap-1">
            <span className="shrink-0">Recent:</span>
            {activeStatus.sessionSummary.recentSessions.map((s: any, i: number) => (
              <span key={s.id} className="truncate max-w-[120px]" title={s.title}>
                {i > 0 && <span className="mx-0.5">·</span>}
                {s.title || "Untitled"}
              </span>
            ))}
          </span>
        )}
      </>
    ) : (
      <span className="italic">
        No {value === 'cli' ? 'CLI' : 'Desktop'} data found. Add a repo or import to get started.
      </span>
    )}
  </div>
)}
```

#### Step 3: 驗證

執行：
1. `pnpm --filter backend build`
2. `pnpm --filter frontend build`

兩者皆通過才回報完成。

### 重要提醒
- 處理 DB 不存在的邊界情況
- 確保 frontend TypeScript 型別正確（type assertion 或擴充型別定義）
- 完成後只回報修改摘要與 build 結果
