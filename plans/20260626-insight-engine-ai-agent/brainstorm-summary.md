# Brainstorm Summary: Insight Engine → Real AI Agent

**Date:** 2026-06-26
**Status:** Approved → plan
**Repo:** InsightOS (Phê La) — Next.js 14

## Problem
AI hiện tại (AI Center, Ask AI) là **giả**: keyword matching → câu trả lời hardcode gắn dataset demo 504 review (badge "Keyword rules · not ML"). Không đọc data thật, không phân tích. Cần thay bằng **LLM thật phân tích dữ liệu thật**.

## Decisions
| Quyết định | Lựa chọn |
|---|---|
| Năng lực agent | **Context-injection (RAG-lite)** |
| Phạm vi | **AI Center + Ask AI** (chat). feedback-engine + Recommendations tab giữ nguyên |
| UX | **Streaming** (chữ hiện dần) |
| LLM | OpenAI **gpt-4o-mini** (đã tích hợp) |
| Data | Live (Supabase qua useLiveData) + demo fallback |

## Kiến trúc
```
Chat page → useLiveData (chainStats+branches+reviews)
  → buildContext() (snapshot + ~40 review mẫu)
  → POST /api/ask {question, history, context, lang} + Firebase token
  → /api/ask server (auth-gated) → OpenAI stream=true → ReadableStream
  → client đọc stream → append token vào bong bóng AI
```

## Files
- `src/lib/aiContext.ts` 🆕 — pure builder context string (live/demo).
- `src/app/api/ask/route.ts` 🆕 — streaming, auth-gated (reuse verifyRequest).
- `src/lib/useAsk.ts` 🆕 — client `streamAsk(body, onToken)`.
- `ai-center/page.tsx` ♻️ — bỏ keyword engine, gọi streamAsk, badge "Live AI".
- `ask-ai/page.tsx` ♻️ — tương tự.
- `ChatBubble.tsx` ♻️ — render markdown.
- `aiResponses.ts` ♻️ — giữ suggestedPrompts + greeting; bỏ getAIResponseKey.

## Context (RAG-lite)
- Chain: tổng review, health TB, rating TB, %pos/neg.
- Per branch: tên, health, rating, #review, %pos/neg, top pain points.
- ~40 review mẫu (trộn sentiment/branch): branch, sentiment, rating, text rút gọn.
- Cờ live/demo.

## Prompt
System: chuyên viên phân tích InsightOS Phê La; CHỈ dùng data cung cấp; trả lời theo lang; ngắn gọn, trích số, không bịa. + context.
User: câu hỏi + vài lượt history.

## Risks
- RAG-lite không đọc hết từng review (token) → đếm chính xác dựa metrics; sắc thái dựa mẫu. Nâng tool-calling sau nếu cần.
- gpt-4o-mini stream: token đầu ~1-2s.
- Demo mode: phân tích thật trên data mẫu.
- Markdown: cần render ở ChatBubble.
- Security: key server-only, route auth-gated.

## Success criteria
- Hỏi tự do → AI trả lời phân tích đúng theo data hiện tại (live hoặc demo), stream mượt.
- Không còn keyword/canned; badge phản ánh "Live AI".
- Build/lint pass; route 401 khi không auth.
