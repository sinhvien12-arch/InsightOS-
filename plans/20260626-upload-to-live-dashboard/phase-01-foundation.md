# Phase 01 — Foundation: env, deps, aggregate lib

**Priority:** Critical · **Status:** pending
**Depends on:** none · **Blocks:** 02, 03, 04

## Overview
Dựng nền: biến môi trường OpenAI, dependency, và gom logic aggregate trùng lặp
(`useLiveData.ts` + `api/upload/route.ts`) về 1 module `src/lib/aggregate.ts` (DRY).

## Files
- **Create:** `src/lib/aggregate.ts`
- **Modify:** `src/lib/useLiveData.ts` (import từ aggregate, bỏ dup)
- **Create:** `.env.local.example` (doc các key, KHÔNG commit `.env.local`)
- **Modify:** `package.json` (thêm `openai`)
- **Verify:** `supabase/schema.sql` (đủ cột: sentiment_score, categories[], avg_rating)

## Steps
1. `npm i openai` (server SDK). Xác nhận build không vỡ.
2. Thêm env (chỉ doc trong `.env.local.example`):
   - `OPENAI_API_KEY=` (server-only, KHÔNG prefix NEXT_PUBLIC)
   - `NEXT_PUBLIC_SUPABASE_URL=` / `NEXT_PUBLIC_SUPABASE_ANON_KEY=` (đã dùng)
3. Tạo `src/lib/aggregate.ts`, export:
   ```ts
   export function reviewsToMetrics(reviews: ProcessedReview[]): BranchMetrics[]
   export function healthScore(positivePct: number, negativePct: number): number
   ```
   - `healthScore` = `clamp(0,100, round(50 + positivePct - negativePct*1.2))`.
   - Gom theo `branch_name`: total, positive/negative/neutral count + %, avg_rating (bỏ null), critical_issues = top 3 category theo tần suất ở review negative, updated_at = now ISO.
4. Refactor `useLiveData.ts`: `metricsToBranch/Alerts/Issues/ChainStats` giữ nguyên public API nhưng dùng helper chung nếu trùng; **không đổi chữ ký** để pages không vỡ.
5. Chạy `npx tsc --noEmit` kiểm type.

## Todo
- [ ] Cài `openai`, build OK
- [ ] `.env.local.example` đầy đủ
- [ ] `aggregate.ts` + `healthScore` + `reviewsToMetrics`
- [ ] useLiveData dùng chung, không đổi API
- [ ] schema.sql verify đủ cột
- [ ] `tsc --noEmit` pass

## Success criteria
- `aggregate.ts` đơn vị thuần (pure), test tay với 3-4 review cho ra metric hợp lý.
- Không còn 2 bản công thức health-score trong repo.

## Security
- `OPENAI_API_KEY` không bao giờ prefix `NEXT_PUBLIC`. `.env.local` trong `.gitignore`.
