# Phase 01 — persist clear+recompute + orchestrator mode

**Priority:** Critical · **Status:** pending · **Blocks:** 02

## Files
- **Modify:** `src/app/api/persist/route.ts`
- **Modify:** `src/lib/uploadOrchestrator.ts`

## persist route
Mở rộng body: `{ reviews?, metrics?, clear?: boolean, recompute?: boolean }`. Vẫn auth-gated + `createServerClient`.
1. `clear === true` →
   - `client.from('reviews').delete().gte('id', 0)`
   - `client.from('branch_metrics').delete().gte('id', 0)`
   - return `{ ok: true }` (bỏ qua reviews/metrics nếu có).
2. `recompute === true` →
   - fetch toàn bộ reviews: `client.from('reviews').select('*').limit(5000)`.
   - map row → `ProcessedReview` (đúng field: date, platform, branch_name, review_text, rating, sentiment, sentiment_score, categories, keywords_found, processed_at).
   - `const metrics = reviewsToMetrics(rows)` (import từ `@/lib/aggregate`).
   - nếu metrics rỗng (0 review) → cũng `delete branch_metrics` cho sạch; else upsert `branch_metrics` onConflict branch_name.
   - return `{ ok: true, branches: metrics.length }`.
3. reviews-only / metrics-only upsert: giữ như hiện tại.
- Thứ tự xử lý trong 1 request: nếu cùng lúc nhiều cờ, ưu tiên clear → upsert → recompute (thực tế client gọi tách lệnh, mỗi request 1 việc).

## orchestrator
- `processFile(file, onProgress, mode: 'replace' | 'append' = 'replace')`.
- Sau bước AI analyze + dedupe, trước khi upsert reviews:
  - `if (mode === 'replace' && supabaseConfigured) await persist(token, { clear: true })`.
- Upsert reviews theo lô **bỏ gửi metrics** (không cần nữa).
- Sau khi upsert xong reviews: `if (supabaseConfigured) await persist(token, { recompute: true })`.
- Summary giữ tính client-side cho hiển thị (số review file này). `saved` = true nếu đã persist.

## Todo
- [ ] persist: clear + recompute (reuse reviewsToMetrics)
- [ ] map review row → ProcessedReview an toàn
- [ ] orchestrator: param mode, clear (replace), recompute cuối, bỏ gửi metrics
- [ ] tsc pass

## Success criteria
- Gọi persist({clear}) → 2 bảng rỗng. persist({recompute}) → metrics khớp reviews thực tế trong DB.

## Risks
- Window mất data: clear chạy sau analyze, trước insert. Chấp nhận (confirm chặn). 
- delete cần filter (supabase-js) → dùng `.gte('id', 0)`.
