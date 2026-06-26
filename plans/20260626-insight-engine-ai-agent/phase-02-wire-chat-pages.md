# Phase 02 — Wire chat pages to streaming AI

**Priority:** Critical · **Status:** pending · **Depends on:** 01 · **Blocks:** 03

## Overview
Client helper đọc stream + viết lại 2 trang chat dùng LLM thật thay keyword engine.

## Files
- **Create:** `src/lib/useAsk.ts`
- **Modify:** `src/app/(app)/ai-center/page.tsx`
- **Modify:** `src/app/(app)/ask-ai/page.tsx`
- **Modify:** `src/data/aiResponses.ts` (giữ suggestedPrompts + greeting; bỏ getAIResponseKey/getResponseByKey khỏi luồng chat)

## useAsk.ts
```ts
export async function streamAsk(
  body: { question: string; history: {role:'user'|'assistant';content:string}[]; context: string; lang: 'en'|'vi' },
  token: string,
  onToken: (delta: string) => void,
  signal?: AbortSignal,
): Promise<void>
```
- `fetch('/api/ask', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body, signal })`.
- `if(!res.ok)` → throw Error(message từ JSON).
- Đọc `res.body!.getReader()` + `TextDecoder`, vòng lặp `onToken(decoder.decode(value))`.

## Page changes (cả 2 trang)
1. `useLiveData()` lấy `mode, chainStats, branches, reviews`.
2. Build context source theo mode:
   - live: reviews (ProcessedReview) → CtxReview `{branchName:r.branch_name, sentiment:r.sentiment, rating:r.rating, text:r.review_text}`; branches/chainStats từ useLiveData.
   - demo: `@/data/reviews` (Review) → `{branchName: getBranch(r.branchId)?.name, sentiment:r.sentiment.toLowerCase(), rating:r.rating, text:r.reviewText}`; branches/chainStats từ `@/data/branches`.
   - `buildContext({mode, chainStats, branches, reviews})`.
3. `sendMessage`:
   - push user message; push **empty AI message**; set streaming=true.
   - `token = await auth.currentUser?.getIdToken()`; nếu null → báo cần đăng nhập.
   - `streamAsk(..., delta => append delta vào AI message cuối)`.
   - history: map messages gần nhất (≤6) sang {role, content}.
   - finally streaming=false; bắt lỗi → hiện message lỗi thân thiện.
4. Bỏ `getAIResponseKey`; greeting ban đầu lấy text trực tiếp (giữ greeting trong aiResponses hoặc inline).
5. Badge: "Keyword rules · not ML" → **"Live AI · gpt-4o-mini"**; disclaimer cập nhật.
6. AI Center: tab Recommendations **giữ nguyên** (ngoài phạm vi).

## aiResponses.ts
- Giữ `suggestedPrompts`, greeting text (export hàm/đối tượng lấy greeting theo lang).
- Có thể giữ `getAIResponse*` cho tương thích nhưng KHÔNG dùng trong chat nữa (hoặc xoá nếu không nơi nào gọi — grep trước).

## Todo
- [ ] useAsk streamAsk + abort
- [ ] ai-center: useLiveData + buildContext + streaming + badge
- [ ] ask-ai: tương tự
- [ ] greeting/suggestedPrompts giữ; bỏ keyword matching
- [ ] tsc pass

## Success criteria
- Gõ câu hỏi → chữ hiện dần, nội dung phản ánh data hiện tại (live/demo).
- Không còn canned response cứng.

## Risks
- Shape review demo vs live khác → normalize đúng ở mỗi page.
- guest không có token → chat báo cần đăng nhập (AI Center/Ask AI nằm trong (app), guest vào được; cần xử lý token null gọn).
