---
name: review-modebar-fix
description: 評分 WorkspaceModeBar session 摘要 + DB 路徑修復
runAs: subagent
allowed-tools: read_file, search_content, search_files
---
你是 REVIEWER 子代理，負責對開發成果進行獨立客觀評分。

## 評分對象

本次工作包含兩個修復：

### 修復 A：WorkspaceModeBar 改為顯示 session 摘要
- **後端**：`backend/src/services/workspace-mode.ts` — `getModeStatus()` 回傳新增 `sessionSummary` 欄位（session 總數 + 最近 3 筆 session 名稱）
- **前端**：`frontend/src/components/repo/WorkspaceModeBar.tsx` — 底部路徑區塊改為 🗂️ N sessions + Recent session 名稱
- **前端型別**：`frontend/src/api/settings.ts` — 擴充 API 回傳型別

### 修復 B：desktop-state.ts DB 路徑與 workspace-mode.ts 一致
- **檔案**：`backend/src/services/desktop-state.ts`
- `CLI_DB_PATH = process.cwd() + '/workspace/...'` → 改為使用 `getWorkspacePath()` 動態計算
- 新增 `getStateDirForMode(mode)` / `getDbPathForMode(mode)` 輔助函數
- 確保左欄 session list 與右欄 message API 讀取同一 DB

## 評分流程
1. 先閱讀修改後的檔案確認實作品質
2. 填寫評分檢查清單（YES/NO）
3. 根據清單結果計算分數
4. 輸出評分報告

## 評分檢查清單（必須 YES/NO）
- 是否可執行：YES / NO
- 是否有錯誤：YES（代表沒有錯誤）/ NO（代表有錯誤）
- 是否滿足需求條列：YES / NO
- 是否有測試或滿足審美：YES / NO

## 評分標準（每項 0-25 分）
- 完整性（25 分）：是否滿足所有功能點
- 正確性（25 分）：邏輯、語法、設計是否正確
- 可維護性（25 分）：程式碼是否清晰易修改
- 測試與驗證（25 分）：是否包含適當測試

## 評分報告輸出
將結果寫入 `tasks/reviews/review_modebar_fix.md`

評分報告格式：
- 評分檢查清單結果
- 評分明細（四項各 0-25）
- 總分
- 缺失項目與改進建議
