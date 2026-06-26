# Brainstorm Summary: Upload → AI → Live Dashboard

**Date:** 2026-06-26
**Status:** Approved → plan
**Repo:** InsightOS (Phê La) — Next.js 14 App Router

## Problem
Hiện dashboard render từ demo data tĩnh (`src/data/*`). Cần luồng thực: upload raw reviews CSV → AI phân tích → sinh báo cáo dashboard theo đúng format hiện có (Core pages).

## Decisions (chốt)
| Quyết định | Lựa chọn |
|---|---|
| Xử lý data | **OpenAI gpt-4o-mini** (sentiment, category, keywords) |
| Persistence | **Supabase** (reviews + branch_metrics) |
| Phạm vi | **Core**: Dashboard, Branches, Alerts, Issues, Analytics |
| Input | **Raw reviews CSV** (date, branch_name, review_text, rating?, platform?) |
| Luồng AI | **Chunk + client orchestration** (~40–50 review/lô, progress bar) |

## Kiến trúc
```
Upload page (client)
 1. papaparse CSV → validate cột
 2. chunk ~40–50 review
 3. loop POST /api/analyze → gpt-4o-mini (response_format=json) → classification
 4. gộp → lib/aggregate.ts → BranchMetrics[]
 5. supabase.upsert(reviews) + upsert(branch_metrics)  [anon client]
 6. redirect /dashboard → useLiveData 'live' → Core pages render
```
- OpenAI key: server-only trong `/api/analyze`.
- Persist: client anon supabase (RLS dev tắt). Bỏ route naive `/api/upload`.

## Thay đổi chính
- `src/app/api/analyze/route.ts` (mới) — gọi OpenAI cho 1 lô.
- `src/lib/aggregate.ts` (mới) — reviews→BranchMetrics, gom logic trùng (DRY với useLiveData + upload).
- `src/app/upload/page.tsx` — viết lại: dnd, validate, progress, summary, CTA.
- `src/lib/useLiveData.ts` — dùng chung aggregate; nạp reviews cho Analytics trend.
- Core pages — đấu useLiveData, fallback demo khi mode≠live.
- `src/app/api/upload/route.ts` — gỡ bỏ.
- `.env.local` (OPENAI_API_KEY) + rà `supabase/schema.sql`.

## Công thức (tinh chỉnh khi làm)
- health_score = clamp(0..100), vd `50 + positive% − negative%×1.2`.
- critical_issues = top N category negative/branch.
- avg_rating = mean(rating, bỏ null).

## Rủi ro
- Timeout → chunk + concurrency 2–3; ~10 call/500 review, chi phí vài cent.
- JSON lỗi → response_format=json + retry 1 lần/lô; lô fail không chặn luồng.
- Issues live đơn giản hơn demo (đúng phạm vi Core).
- Non-core pages → badge "Demo" (không ẩn) để bản trình diễn đầy đủ.
- Security: giới hạn file size, key server-only, note bật RLS khi production.

## Open items
- Analytics trend: tính client-side từ reviews theo ngày (đề xuất).
- Non-core: badge "Demo".
- Empty state mode='empty' → CTA Upload.

## Success criteria
- Upload CSV review thật → Core dashboard hiển thị metric đúng, không crash.
- mode chuyển demo→live sau upload.
- Không lộ secret; build/lint pass.
