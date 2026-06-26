# Phase 01 — Context builder + streaming /api/ask

**Priority:** Critical · **Status:** pending · **Blocks:** 02

## Overview
Tạo bộ dựng context thuần (pure) và route AI streaming, auth-gated, tái dùng pattern `/api/analyze`.

## Files
- **Create:** `src/lib/aiContext.ts`
- **Create:** `src/app/api/ask/route.ts`

## aiContext.ts
Pure, không phụ thuộc React/Supabase. Export:
```ts
export interface CtxReview { branchName?: string; sentiment: string; rating?: number | null; text: string }
export interface CtxInput {
  mode: 'live' | 'demo'
  chainStats: { totalReviews: number; avgHealthScore: number; avgRating: number; positivePct: number; negativePct: number }
  branches: { name: string; healthScore: number; avgRating: number; reviewCount: number;
              sentiment: { positive: number; negative: number }; topPainPoints: { label: string; count: number }[] }[]
  reviews: CtxReview[]
}
export function buildContext(input: CtxInput): string
export const SAMPLE_SIZE = 40
```
Logic:
- Header: "Data mode: live|demo. Chain: N reviews, health X/100, rating Y★, +P% / -Q%".
- Per branch: 1 dòng gọn (tên, health, rating, #review, %pos/neg, top 2-3 pain points).
- Sample ~40 review: trộn đều theo sentiment + branch (round-robin), mỗi dòng: `[branch | sentiment | rating★] text` (cắt ~160 ký tự).
- Tổng context giữ ~2k token (giới hạn số review nếu cần).

## /api/ask/route.ts
- `export const runtime = 'nodejs'`.
- `verifyRequest` → 401 nếu fail (reuse từ `@/lib/verify-auth`).
- `OPENAI_API_KEY` thiếu → 500.
- Body: `{ question: string, history?: {role:'user'|'assistant', content:string}[], context: string, lang: 'en'|'vi' }`. Validate question non-empty, context length ≤ ~12k chars.
- System prompt: "Bạn là chuyên viên phân tích InsightOS của chuỗi cà phê Phê La. CHỈ dùng DATA dưới đây, trả lời bằng {lang}, ngắn gọn, trích số cụ thể, KHÔNG bịa. Dùng markdown nhẹ (đậm, gạch đầu dòng), TRÁNH bảng lớn." + `\n\nDATA:\n${context}`.
- Messages: system + history (giới hạn ~6 lượt gần nhất) + user question.
- `client.chat.completions.create({ model:'gpt-4o-mini', temperature:0.3, stream:true })`.
- Trả `new Response(readable, { headers: { 'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-store' } })` — đẩy từng `chunk.choices[0]?.delta?.content`.
- try/catch: nếu lỗi trước khi stream → 500 JSON; nếu lỗi giữa stream → đóng stream.

## Todo
- [ ] aiContext.ts pure + sample trộn đều + giới hạn token
- [ ] /api/ask auth-gated + key guard + validate body
- [ ] OpenAI stream → ReadableStream text
- [ ] Test curl: 401 khi không token; 200 stream khi có (tạm bỏ auth để test cục bộ nếu cần, rồi bật lại)
- [ ] tsc pass

## Success criteria
- buildContext cho ra chuỗi gọn, đại diện, < ~2k token với 500 review.
- /api/ask stream text mượt, 401 khi không auth.

## Security
- Key server-only. Auth bắt buộc. Giới hạn độ dài context để tránh lạm dụng token.
