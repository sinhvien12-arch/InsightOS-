# Phase 03 — Upload page: parse → chunk → AI → persist

**Priority:** Critical · **Status:** pending
**Depends on:** 01, 02 · **Blocks:** 04

## Overview
Viết lại `src/app/upload/page.tsx`: chọn/drop CSV → validate → chia lô → gọi
`/api/analyze` nhiều lần (progress) → `reviewsToMetrics` → upsert Supabase → CTA dashboard.

## Files
- **Rewrite:** `src/app/upload/page.tsx`
- **Use:** `src/lib/aggregate.ts` (01), `/api/analyze` (02), `src/lib/supabase.ts`, papaparse
- **Optional:** tách `src/lib/uploadOrchestrator.ts` nếu page > 200 dòng (giữ rule file size)

## Steps
1. UI: dropzone + file input, accept `.csv`. Hiện tên file, số dòng sau parse.
2. Parse client `Papa.parse(file, {header:true, skipEmptyLines:true})`.
3. Validate cột bắt buộc: `branch_name`, `review_text`. Thiếu → lỗi rõ ràng, dừng.
   - Chuẩn hoá: date default today, platform default 'csv', rating parse số|null.
4. Chunk rows theo `CHUNK=50`. State: `total`, `done`, `phase`('parsing'|'analyzing'|'saving'|'done'|'error').
5. Loop lô (tuần tự hoặc concurrency 2): `POST /api/analyze` → ghép `ProcessedReview[]`. Update progress bar `%`.
6. `reviewsToMetrics(processed)` → `BranchMetrics[]`.
7. Persist (nếu `supabaseConfigured`):
   - `supabase.from('reviews').upsert(processed, {onConflict:'branch_name,date,review_text'})`
   - `supabase.from('branch_metrics').upsert(metrics, {onConflict:'branch_name'})`
   - Không có Supabase → báo "cấu hình Supabase để lưu", vẫn show summary.
8. Summary: tổng review, số branch, % pos/neg, health TB. Nút "Xem Dashboard" → `/dashboard`.
9. Error states mỗi bước; lô fail vẫn tiếp tục (đã fallback ở 02).

## Guardrails
- Giới hạn file (vd ≤ 5MB / ≤ 5000 dòng) → cảnh báo.
- Disable nút khi đang chạy; không double-submit.

## Todo
- [ ] Dropzone + parse + validate cột
- [ ] Chunk + loop analyze + progress bar
- [ ] reviewsToMetrics + upsert reviews/metrics
- [ ] Summary + CTA dashboard
- [ ] Error/empty/limit states
- [ ] File < 200 dòng (tách orchestrator nếu cần)

## Success criteria
- Upload CSV ~100–500 review → progress chạy → summary đúng → DB có data.
- Mất mạng giữa chừng → báo lỗi, không treo.

## Security
- Chỉ gửi field cần cho /api/analyze. Anon key client OK (RLS dev). Note bật RLS prod.
