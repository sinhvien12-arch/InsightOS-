# Phase 05 — Polish: demo badges, empty states, cleanup

**Priority:** Medium · **Status:** pending
**Depends on:** 04

## Overview
Hoàn thiện UX phân biệt live/demo, gắn badge cho non-core, dọn code chết, verify build.

## Files
- **Modify:** non-core pages (`ai-center`, `ask-ai`, `recommendations`, `actions`, `simulator`, `reports`, `research`)
- **Remove:** `src/app/api/upload/route.ts` (naive, đã thay bằng /api/analyze + client persist)
- **Maybe:** small `DemoBadge` component (`src/components/ui/DemoBadge.tsx`)
- **Modify:** `src/components/Header.tsx` hoặc page headers (hiện badge mode live/demo)

## Steps
1. `DemoBadge` nhỏ (text "Demo" / "Dữ liệu mẫu") — gắn đầu các non-core page.
2. Live/Demo indicator cho Core pages (tái dùng `mode` từ useLiveData; nhiều page đã có — chuẩn hoá).
3. Empty states nhất quán: `mode==='empty'` → CTA "Upload dữ liệu" link `/upload`.
4. **Grep `api/upload`** toàn repo; gỡ reference rồi xoá route. Đảm bảo upload page (03) không gọi nó.
5. Cập nhật `supabase/schema.sql` comment nếu cần (RLS prod note).
6. Verify cuối:
   - `npx tsc --noEmit`
   - `npm run lint`
   - `npm run build`
7. (docs) Tạo/cập nhật `docs/` nếu user muốn — hiện chưa có thư mục docs.

## Todo
- [ ] DemoBadge + gắn non-core
- [ ] Live/Demo indicator chuẩn hoá Core
- [ ] Empty states + CTA upload
- [ ] Xoá `api/upload/route.ts` + reference
- [ ] tsc + lint + build pass
- [ ] Smoke test luồng đầy đủ: upload → dashboard live

## Success criteria
- Không còn route/logic naive cũ.
- Người xem phân biệt rõ trang live vs demo.
- Build sạch, không lỗi type/lint chặn.

## Risk
- Xoá route khi còn ai gọi → grep kỹ trước. Giữ commit nhỏ, riêng cleanup.
