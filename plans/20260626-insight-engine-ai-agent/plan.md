---
title: Insight Engine → Real AI Agent
status: completed
created: 2026-06-26
completed: 2026-06-26
mode: auto
blockedBy: []
blocks: []
---

# Plan: Insight Engine → Real AI Agent (RAG-lite, streaming)

Thay engine keyword/canned của AI Center + Ask AI bằng **OpenAI gpt-4o-mini thật**,
phân tích dữ liệu thật (Supabase live + demo fallback) qua context-injection, trả lời
**streaming**.

**Brainstorm:** [brainstorm-summary.md](./brainstorm-summary.md)

## Decisions
- RAG-lite (context-injection), không tool-calling.
- Phạm vi: `ai-center` + `ask-ai`. KHÔNG đụng feedback-engine, Recommendations tab.
- Streaming. LLM gpt-4o-mini. Auth-gated như `/api/analyze`.
- Context build **client-side** (reuse useLiveData; demo dùng data tĩnh) → gửi lên route.

## Key context (đã verify)
- AI hiện tại: `aiResponses.ts` keyword→canned; pages dùng `getAIResponseKey/getResponseByKey`.
- `ChatBubble.tsx` đã render **light markdown** (bold + newline) → giữ nhẹ, prompt model tránh bảng nặng.
- `useLiveData` trả `reviews` (ProcessedReview) chỉ khi live; demo reviews ở `@/data/reviews` (shape `Review` khác) → page tự normalize trước khi buildContext.
- Pattern OpenAI + `verifyRequest` + streaming sẵn sàng tái dùng từ `/api/analyze`.

## Phases
| # | Phase | Status |
|---|-------|--------|
| 01 | [Context builder + streaming /api/ask](./phase-01-context-and-api.md) | ✅ done |
| 02 | [Wire chat pages to streaming AI](./phase-02-wire-chat-pages.md) | ✅ done |
| 03 | [Polish: markdown, errors, verify](./phase-03-polish-verify.md) | ✅ done |

## Post-review follow-ups (not done — own scope)
- **W1** `context` built client-side → an authenticated org user could inject prompt text into their own session. Low impact for internal tool; production fix = assemble context server-side from Supabase tied to the session.
- **N1** `/api/ask` keeps consuming OpenAI tokens if the user navigates away mid-stream (no abort wired). Add an AbortController + propagate `request.signal` to the OpenAI call for a cancel path.

## Dependencies
01 → 02 → 03 (tuần tự).

## Success criteria
- Hỏi tự do ở AI Center / Ask AI → LLM trả lời phân tích đúng theo data hiện tại (live/demo), stream mượt.
- Không còn keyword/canned; badge "Live AI".
- `/api/ask` 401 khi không auth. Build/lint pass.
