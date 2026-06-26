# Brainstorm Summary: Replace / Append dataset on upload

**Date:** 2026-06-26
**Status:** Approved → plan
**Repo:** InsightOS (Phê La) — Next.js 14

## Problem
Upload hiện **upsert cộng dồn**: reviews tích lũy qua mỗi lần; `branch_metrics` tính **chỉ từ file vừa upload** → append làm metrics lệch/không nhất quán. Cần khả năng **thay file** (xóa cũ, nạp mới) + sửa luôn bug cộng dồn.

## Decisions
| | |
|---|---|
| Cơ chế | **Toggle Replace (default) / Append** trên trang upload |
| Xác nhận | **Confirm modal** trước khi xóa (Replace) |
| Sửa bug | **Recompute** metrics từ TOÀN BỘ reviews trong DB sau mỗi upload (cả 2 mode) |

## Luồng
```
toggle [Thay toàn bộ | Thêm vào]
 bấm Upload:
  - Append → chạy luôn
  - Replace → confirm "Xóa toàn bộ dữ liệu cũ?" → đồng ý mới chạy
 processFile(file, onProgress, mode):
  1. AI phân tích (chưa đụng DB)
  2. nếu Replace → persist({clear:true})  // xóa reviews + branch_metrics
  3. upsert reviews theo lô
  4. persist({recompute:true})            // server: đọc toàn bộ reviews → reviewsToMetrics → upsert metrics
```

## Files
- `src/app/upload/page.tsx` — toggle + modal confirm.
- `src/lib/uploadOrchestrator.ts` — `processFile(file, onProgress, mode)`; replace→clear trước; cuối luôn recompute.
- `src/app/api/persist/route.ts` — handle `{clear:true}` (delete all) + `{recompute:true}` (đọc reviews → `reviewsToMetrics` (import từ aggregate.ts, pure) → upsert metrics).

## Risks
- Replace xóa toàn bộ DB chung (app 1 chuỗi, không phân user) → OK demo; multi-tenant cần scope (ngoài phạm vi).
- Clear chạy sau khi AI xong, ngay trước insert → insert lỗi giữa chừng = mất data cũ. Confirm chặn lỡ tay; chấp nhận cho demo (REST khó transaction gọn).
- Recompute đọc ≤5000 review — nhẹ.
- clear/recompute qua /api/persist đã auth-gated.

## Success criteria
- Replace: upload file mới → data cũ biến mất, dashboard chỉ còn file mới, metrics khớp.
- Append: data cộng dồn nhưng metrics tính lại từ toàn bộ → nhất quán.
- Confirm hiện trước khi xóa. Build/lint pass.
