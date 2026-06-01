---
name: dev-mobile-responsive-layout
description: Repos.tsx 手機版改為上下排列上3下7
runAs: subagent
allowed-tools: read_file, edit_file, write_file, run_command, search_content
---
你是 DEV-FIXER 子代理。自動連續模式，不中斷不問話。

## 任務：Repos.tsx 手機版改為上下排列（上3下7）

### 需求
- 手機上（寬度 < 768px）：上下排列，上 30% session 列表、下 70% chat
- 桌機上：保持現有左右排列（左 session + 右 chat）

### 檔案
`frontend/src/pages/Repos.tsx`

### 修改內容

**1. 加入 mobile hook import**
```typescript
import { useMobile } from '@/hooks/useMobile'
```

**2. 元件內加入 isMobile 判斷**
在 `export function Repos() {` 之後，加一行：
```typescript
const isMobile = useMobile()
```

**3. 修改兩欄 container 的 flex 方向**
找到：
```
<div className="flex-1 min-h-0 flex flex-row">
```
改為：
```
<div className={`flex-1 min-h-0 flex ${isMobile ? 'flex-col' : 'flex-row'}`}>
```

**4. 左欄（session list）改為高度百分比 + 可折疊**
找到左欄的 div（目前是 `className="w-72 border-r border-border flex flex-col flex-shrink-0 bg-card/20"`）

改為：
```tsx
<div className={isMobile ? 'h-[30%] border-b border-border flex flex-col flex-shrink-0 bg-card/20' : 'w-72 border-r border-border flex flex-col flex-shrink-0 bg-card/20'}>
```

**5. 右欄（chat）填滿剩餘空間**
右欄 container 目前是：
```
<div className="flex-1 min-w-0 flex flex-col">
```
手機版同樣維持 `flex-1` 即可自動填滿下方剩餘空間（因為左欄固定 30%）。

完整修改後手機版結構：
```
flex-col
  ├── WorkspaceModeBar (固定高度)
  ├── 左欄 session list (h-[30%], 可搜尋)
  └── 右欄 chat (flex-1, 70%)
```

桌機版維持不變：
```
flex-row
  ├── 左欄 session list (w-72)
  └── 右欄 chat (flex-1)
```

**6. 手機版隱藏左側工具列**
在手機上，最左側的工具列（FolderGit2/CalendarClock/Settings/Logout按鈕）佔空間。找到該 toolbar 的 div：

```tsx
<div className="w-12 md:w-14 border-r border-border flex flex-col items-center py-2 gap-3 flex-shrink-0 bg-card/30">
```

改為：
```tsx
{!isMobile && (
  <div className="w-12 md:w-14 border-r border-border flex flex-col items-center py-2 gap-3 flex-shrink-0 bg-card/30">
    ...
  </div>
)}
```

注意要把關閉的 `</div>` 也包在條件內。

### 驗證
執行 `pnpm --filter frontend build` 確認通過。
完成後回報修改摘要與 build 結果。
