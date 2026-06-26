# Phase 04 — Wire Core pages to live data

**Priority:** High · **Status:** pending
**Depends on:** 01, 03 · **Blocks:** 05

## Overview
5 Core pages render từ `useLiveData` khi `mode==='live'`, fallback demo. Trọng tâm:
**rewrite `dashboard/page.tsx`** (đang hardcoded, tự vẽ sidebar, không dùng AppShell).

## Files
- **Rewrite:** `src/app/(app)/dashboard/page.tsx`
- **Modify:** `src/app/(app)/analytics/page.tsx`
- **Verify/tinh chỉnh:** `branches`, `alerts`, `issues` pages (đã có useLiveData)
- **Maybe extend:** `src/lib/useLiveData.ts` (expose `reviews` cho analytics trend)

## Steps
### Dashboard (rewrite, lớn nhất)
1. **Bỏ sidebar hardcoded + inline style** — page chỉ là nội dung, layout do `AppShell` lo (đã wrap ở `(app)/layout.tsx`).
2. Dùng `useLiveData()`: `chainStats`, `branches`, `alerts`, `issues`.
3. Tái dùng component có sẵn: `StatCard`, `BranchHealthGauge`, `charts/SentimentDonut`, `charts/PainPointBar`, `AlertCard`.
4. Fallback demo khi `mode!=='live'`; empty state khi `mode==='empty'` → CTA `/upload`.
5. Dùng `useLang` cho song ngữ như các page khác.

### Analytics
1. Thêm `reviews` vào `useLiveData` (đã load từ Supabase hoặc map từ metrics nếu chỉ có metrics).
2. Trend theo ngày: nhóm `reviews` theo `date` → sentiment count (thay `getTrendData` demo).
3. Pain-point: từ `branch_metrics.critical_issues` / categories thay `getPainPointCounts` demo.
4. Fallback demo khi không live.

### Branches / Alerts / Issues
- Đã có toggle; chỉ verify dùng `aggregate` chung (sau refactor 01) và badge mode đúng.

## Todo
- [ ] Dashboard rewrite: AppShell + useLiveData + components, bỏ inline/sidebar
- [ ] Dashboard fallback + empty state CTA
- [ ] Analytics: trend + pain-point từ live
- [ ] Verify branches/alerts/issues live OK
- [ ] tsc + build pass

## Success criteria
- 5 pages cùng look-and-feel (qua AppShell), không trang nào tự vẽ sidebar.
- mode=live → số liệu khớp data upload; mode=demo → như cũ; mode=empty → CTA upload.

## Risks
- `dashboard` cũ có thể bị link/test khác tham chiếu — grep trước khi xoá block.
- `toLocaleString` trên undefined (đã từng crash) → guard mọi số trước format.
