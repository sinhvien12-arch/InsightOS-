import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { verifyRequest } from '@/lib/verify-auth'

export const runtime = 'nodejs'

const MODEL = 'gpt-4o-mini'
const MAX_CONTEXT  = 16000  // chars — guard against token abuse
const MAX_QUESTION = 2000
const MAX_HIST_ITEM = 4000
const MAX_HISTORY = 6

interface HistoryMsg { role: 'user' | 'assistant'; content: string }

function systemPrompt(lang: string, context: string): string {
  const langName = lang === 'vi' ? 'Vietnamese' : 'English'
  return `You are the InsightOS analyst for the Phê La coffee chain. Answer ONLY from the DATA below — never invent numbers or branches. Reply in ${langName}, concise and specific, citing concrete figures. Use light markdown (bold, "- " bullets); avoid large tables. If the data can't answer, say so briefly.

DATA:
${context}`
}

export async function POST(request: NextRequest) {
  const user = await verifyRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = process.env.OPENAI_API_KEY
  if (!key) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })

  let question: string, context: string, lang: string, history: HistoryMsg[]
  try {
    const body = await request.json()
    question = String(body?.question ?? '').trim()
    context  = String(body?.context ?? '')
    lang     = body?.lang === 'vi' ? 'vi' : 'en'
    history  = Array.isArray(body?.history) ? body.history.slice(-MAX_HISTORY) : []
    if (!question) return NextResponse.json({ error: 'question is required' }, { status: 400 })
    if (question.length > MAX_QUESTION) return NextResponse.json({ error: 'question too long' }, { status: 400 })
    if (context.length > MAX_CONTEXT) context = context.slice(0, MAX_CONTEXT)
    history = history.map(m => ({ role: m.role, content: String(m.content ?? '').slice(0, MAX_HIST_ITEM) }))
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const client = new OpenAI({ apiKey: key })

  const messages = [
    { role: 'system' as const, content: systemPrompt(lang, context) },
    ...history
      .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map(m => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: question },
  ]

  let completion
  try {
    completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      stream: true,
      messages,
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'AI request failed' }, { status: 500 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content
          if (delta) controller.enqueue(encoder.encode(delta))
        }
      } catch (e) {
        console.error('[ask] stream error:', e)
        const notice = lang === 'vi' ? '\n\n⚠️ (phản hồi bị gián đoạn, vui lòng thử lại)' : '\n\n⚠️ (response interrupted, please retry)'
        try { controller.enqueue(encoder.encode(notice)) } catch { /* already closed */ }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
