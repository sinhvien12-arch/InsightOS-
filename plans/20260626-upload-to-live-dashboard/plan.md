---
title: Upload → AI → Live Dashboard
status: completed
created: 2026-06-26
completed: 2026-06-26
mode: auto
blockedBy: []
blocks: []
---

# Plan: Upload Reviews CSV → AI Analyze → Live Core Dashboard

Chuyển app từ dashboard demo tĩnh sang luồng thực: upload raw reviews CSV →
OpenAI gpt-4o-mini phân tích (chunk client-orchestration) → Supabase persist →
Core pages render live, fallback demo.

**Brainstorm:** [brainstorm-summary.md](./brainstorm-summary.md)

## Decisions
- AI: OpenAI **gpt-4o-mini**, key server-only trong `/api/analyze`.
- Persist: Supabase, upsert qua **client anon** (RLS dev tắt).
- Phạm vi live: Dashboard, Branches, Alerts, Issues, Analytics.
- Input: raw reviews CSV (date, branch_name, review_text, rating?, platform?).
- Non-core pages: badge "Demo".

## Key context (đã verify)
- `branches/alerts/issues` pages **đã** có `useLiveData` + mode toggle.
- `dashboard/page.tsx` = trang hardcoded inline-style, **tự vẽ sidebar riêng**, không dùng AppShell/useLiveData → **rewrite toàn bộ**.
- `analytics` dùng demo `getTrendData/getPainPointCounts/reviews` → cần trend từ review live.
- `useLiveData.ts` + `api/upload/route.ts` có logic aggregate **trùng** → gom về `lib/aggregate.ts` (DRY).
- supabase.ts đã có anon client + `supabaseConfigured`.

## Phases
| # | Phase | Status |
|---|-------|--------|
| 01 | [Foundation: env, deps, aggregate lib](./phase-01-foundation.md) | ✅ done |
| 02 | [AI analyze API route](./phase-02-analyze-api.md) | ✅ done |
| 03 | [Upload page: parse → chunk → persist](./phase-03-upload-flow.md) | ✅ done |
| 04 | [Wire Core pages to live data](./phase-04-wire-core-pages.md) | ✅ done |
| 05 | [Polish: demo badges, empty states, cleanup](./phase-05-polish-cleanup.md) | ✅ done |

## Post-review follow-ups (not yet done — need own scope)
- **C1** `/api/analyze` has no auth → unauthenticated OpenAI proxy. Needs Firebase ID-token verification server-side (firebase-admin) before production.
- **C2** Persist uses client anon key → relies on Supabase RLS (currently disabled for dev). Enable RLS + move writes to a server route for production.
- **W6** `useLiveData` treats Supabase errors as "demo" silently. Add an `error` mode + retry banner.

## Dependencies
- 01 → 02 → 03 (tuần tự). 04 cần 01 (aggregate) + 03 (có data live). 05 cuối.

## Success criteria
- Upload CSV review thật → 5 Core pages hiển thị metric đúng, không crash.
- mode demo→live sau upload; refresh giữ live (Supabase).
- Không lộ secret; `next build` + `next lint` pass.
