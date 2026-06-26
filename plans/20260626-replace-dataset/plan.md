---
title: Replace / Append Dataset on Upload
status: completed
created: 2026-06-26
completed: 2026-06-26
mode: auto
blockedBy: []
blocks: []
---

# Plan: Replace / Append Dataset on Upload

Thêm toggle **Thay toàn bộ (default) / Thêm vào** trên trang upload + confirm modal trước
khi xóa, và **sửa bug cộng dồn** bằng cách recompute `branch_metrics` từ toàn bộ reviews
trong DB sau mỗi upload.

**Brainstorm:** [brainstorm-summary.md](./brainstorm-summary.md)

## Decisions
- Toggle Replace(default)/Append; Replace cần confirm modal.
- Recompute metrics từ full DB sau mọi upload (cả 2 mode) → nhất quán.
- Mọi thao tác qua `/api/persist` (đã auth-gated). KISS/DRY (reuse `reviewsToMetrics`).
- Ngoài phạm vi: multi-tenant scoping, transaction.

## Key context (đã verify)
- `uploadOrchestrator.processFile` hiện: analyze → upsert reviews (lô) → persist metrics client-tính.
- `/api/persist` hiện nhận `{reviews?, metrics?}` upsert; auth-gated; dùng `createServerClient`.
- `aggregate.reviewsToMetrics(ProcessedReview[])` pure → import được ở route.
- Bug: metrics chỉ tính từ file vừa upload → append lệch.

## Phases
| # | Phase | Status |
|---|-------|--------|
| 01 | [persist clear+recompute + orchestrator mode](./phase-01-persist-and-orchestrator.md) | ✅ done |
| 02 | [Upload UI: toggle + confirm + verify](./phase-02-upload-ui.md) | ✅ done |

## Review fixes applied
- Recompute now **paginates over ALL reviews** (not capped at 5000) + always wipes stale `branch_metrics` first → append metrics correct at scale.
- Dedupe key → `JSON.stringify([...])` (unambiguous; replaced invisible \x01 separators).
- `clear` checks reviews-delete error before deleting metrics.
- Upload double-submit guarded by a synchronous `inFlight` ref.

## Dependencies
01 → 02.

## Success criteria
- Replace: upload file mới → data cũ mất, dashboard chỉ còn file mới, metrics khớp.
- Append: cộng dồn nhưng metrics tính lại từ toàn bộ → nhất quán.
- Confirm hiện trước khi xóa. Build/lint pass.
