# Phase 02 — Upload UI: toggle + confirm + verify

**Priority:** High · **Status:** pending · **Depends on:** 01

## Files
- **Modify:** `src/app/upload/page.tsx`

## Steps
1. State: `mode: 'replace' | 'append'` (default `'replace'`), `confirmOpen: boolean`.
2. UI toggle (2 pill) trên khung idle, trên nút Upload:
   - "Thay toàn bộ" / "Replace all" (default) — desc: xóa dữ liệu cũ.
   - "Thêm vào" / "Append" — desc: giữ dữ liệu cũ.
3. `handleUpload`:
   - nếu `mode==='replace'` → `setConfirmOpen(true)` (không chạy ngay).
   - nếu `append` → `runUpload('append')`.
4. Confirm modal (overlay, không dùng window.confirm):
   - Tiêu đề: "Thay toàn bộ dữ liệu?" + cảnh báo không hoàn tác.
   - Nút "Hủy" / "Xóa & thay" → `runUpload('replace')` + đóng modal.
5. `runUpload(mode)` = logic cũ nhưng `processFile(file, onProgress, mode)`.
6. Khi `!supabaseConfigured`: ẩn/disable toggle Replace (vì không có DB để xóa) — hoặc giữ nhưng note.
7. Badge nhỏ thể hiện mode đang chọn ở màn success (tùy chọn).

## Todo
- [ ] toggle mode (default replace)
- [ ] confirm modal cho replace
- [ ] runUpload truyền mode vào processFile
- [ ] tsc + lint + build
- [ ] Smoke test: replace (data cũ mất), append (cộng dồn, metrics đúng)

## Success criteria
- Chọn Replace → confirm → data thay mới hoàn toàn.
- Chọn Append → confirm bỏ qua, cộng dồn, metrics nhất quán.
- Build sạch.

## Risks
- Đừng để double-submit khi modal mở; disable nút khi đang chạy.
