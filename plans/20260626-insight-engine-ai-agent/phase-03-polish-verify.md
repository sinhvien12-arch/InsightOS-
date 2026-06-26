# Phase 03 — Polish: markdown, errors, verify

**Priority:** Medium · **Status:** pending · **Depends on:** 02

## Overview
Hoàn thiện hiển thị, xử lý lỗi/guest, và verify build.

## Files
- **Modify:** `src/components/ChatBubble.tsx` (markdown nhẹ: thêm bullet `- ` / `•`, heading dạng đậm)
- **Modify:** chat pages (empty/error/guest states)
- (tùy chọn) nếu cần bảng → cân nhắc `react-markdown`, mặc định KHÔNG để giữ KISS

## Steps
1. ChatBubble: mở rộng renderer nhẹ — hỗ trợ dòng bắt đầu `- `/`* ` thành bullet; giữ bold + newline hiện có. Không cần thư viện.
2. Prompt (đã ở phase 01) yêu cầu model dùng markdown nhẹ, tránh bảng → khớp renderer.
3. Guest: AI Center/Ask AI khi không có Firebase user → hiện thông báo "Đăng nhập @hsb.edu.vn để dùng AI" thay vì gọi API lỗi.
4. Lỗi stream (mạng/500): hiện message lỗi trong khung chat, cho phép gửi lại; không treo trạng thái typing.
5. Nút Stop (tùy chọn): AbortController hủy stream đang chạy.
6. Verify:
   - `npx tsc --noEmit`
   - `npm run lint`
   - `npm run build`
   - Curl `/api/ask` không token → 401.
   - Chạy thử local: hỏi 1-2 câu, xác nhận stream + nội dung bám data.

## Todo
- [ ] ChatBubble bullet + bold + newline
- [ ] Guest state (no token) thân thiện
- [ ] Error/abort handling khi stream
- [ ] tsc + lint + build pass
- [ ] Smoke test stream thật trên local

## Success criteria
- Câu trả lời hiển thị gọn (đậm/bullet), không lòi ký tự markdown thô.
- Guest không crash; lỗi mạng không treo.
- Build sạch.

## Risks
- Streaming + markdown reflow: render lại mỗi token có thể nhấp nháy — giữ renderer rẻ (string split), tránh thư viện nặng.
