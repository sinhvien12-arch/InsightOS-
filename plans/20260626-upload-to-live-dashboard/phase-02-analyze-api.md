# Phase 02 — AI analyze API route

**Priority:** Critical · **Status:** pending
**Depends on:** 01 · **Blocks:** 03

## Overview
Route server-only nhận 1 lô review thô → gọi OpenAI gpt-4o-mini → trả classification
JSON đã validate. Thay hoàn toàn `detectSentiment` keyword cũ.

## Files
- **Create:** `src/app/api/analyze/route.ts`
- **Modify:** `src/lib/uploadTypes.ts` (đảm bảo `ProcessedReview` khớp output)

## Contract
**Request** `POST /api/analyze`
```json
{ "reviews": [{ "branch_name": "...", "review_text": "...", "rating": 4, "date": "...", "platform": "..." }] }
```
**Response**
```json
{ "results": [{ "sentiment": "positive|negative|neutral", "sentiment_score": 0.0-1.0,
                "categories": ["waiting_time", ...], "keywords_found": ["..."] }] }
```
- `results[i]` khớp `reviews[i]` theo thứ tự (index-aligned).
- categories ∈ CategoryKey union (uploadTypes.ts). Map thừa → `general`.

## Steps
1. Đọc `OPENAI_API_KEY`; thiếu → 500 `{error:'OPENAI_API_KEY missing'}`.
2. Validate body: `reviews` mảng, ≤ 60 phần tử (chặn lô quá to). Quá → 400.
3. Gọi `chat.completions.create`:
   - model `gpt-4o-mini`, `response_format: { type: 'json_object' }`, `temperature: 0`.
   - System prompt: phân tích review quán cà phê (VI+EN), trả MẢNG theo đúng thứ tự & schema; chỉ dùng category cho phép.
   - User: JSON các review (chỉ field cần: index, review_text, rating).
4. Parse JSON; nếu length lệch hoặc parse fail → **retry 1 lần**; vẫn fail → trả mỗi review fallback `{sentiment:'neutral', score:0.5, categories:['general'], keywords:[]}` (lô không chặn luồng).
5. Validate từng category về union; clamp score 0..1.
6. `export const runtime = 'nodejs'` (SDK cần Node).

## Todo
- [ ] Route + key guard
- [ ] Body validation (≤60)
- [ ] OpenAI call json_object + temp 0
- [ ] Parse + retry + fallback an toàn
- [ ] Category/score sanitize
- [ ] Test thủ công 1 lô 5 review (curl/Thunder)

## Success criteria
- Gửi 5 review VI → trả 5 kết quả đúng index, category hợp lệ, không throw.
- Lô lỗi/timeout → fallback, HTTP 200, không vỡ client.

## Risks
- Token: chỉ gửi text+rating, không gửi field thừa.
- Rate limit: client gọi tuần tự/concurrency thấp (phase 03).
