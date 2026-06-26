import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { SentimentLabel, CategoryKey } from '@/lib/uploadTypes'
import { verifyRequest } from '@/lib/verify-auth'

export const runtime = 'nodejs'

const MAX_BATCH = 60
const MODEL = 'gpt-4o-mini'

const CATEGORIES: CategoryKey[] = [
  'waiting_time', 'service_quality', 'hygiene',
  'order_accuracy', 'product_quality', 'general',
]
const SENTIMENTS: SentimentLabel[] = ['positive', 'negative', 'neutral']

interface InReview { review_text: string; rating?: number | null }
interface OutResult {
  sentiment:       SentimentLabel
  sentiment_score: number
  categories:      CategoryKey[]
}

const SYSTEM_PROMPT = `You analyze customer reviews for a Vietnamese coffee chain (Phê La). Reviews are in Vietnamese or English.
For EACH input review (identified by its "i" index) return an object:
{ "i": <same index as input>, "sentiment": positive|negative|neutral, "sentiment_score": 0..1 confidence,
  "categories": subset of [waiting_time, service_quality, hygiene, order_accuracy, product_quality, general] }
Return ONLY JSON: {"results":[{...}]} with exactly one object per input review.
ALWAYS echo back the input "i" so order can be verified. Use "general" when no specific category fits.
Keep it concise. Never add categories outside the allowed list.`

function fallback(): OutResult {
  return { sentiment: 'neutral', sentiment_score: 0.5, categories: ['general'] }
}

function sanitize(raw: unknown): OutResult {
  const o = (raw ?? {}) as Record<string, unknown>
  const sentiment = SENTIMENTS.includes(o.sentiment as SentimentLabel)
    ? (o.sentiment as SentimentLabel) : 'neutral'
  const score = typeof o.sentiment_score === 'number'
    ? Math.max(0, Math.min(1, o.sentiment_score)) : 0.5
  const cats = Array.isArray(o.categories)
    ? (o.categories as unknown[]).filter((c): c is CategoryKey => CATEGORIES.includes(c as CategoryKey))
    : []
  return {
    sentiment,
    sentiment_score: score,
    categories: cats.length ? Array.from(new Set(cats)) : ['general'],
  }
}

async function classify(client: OpenAI, reviews: InReview[]): Promise<OutResult[]> {
  const payload = reviews.map((r, i) => ({ i, text: r.review_text, rating: r.rating ?? null }))
  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify({ reviews: payload }) },
    ],
  })
  const content = completion.choices[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(content) as { results?: unknown[] }
  if (!Array.isArray(parsed.results) || parsed.results.length !== reviews.length) {
    throw new Error('length mismatch')
  }
  // Re-sort by the echoed index when the model returns it, so a misordered
  // response can't silently apply classifications to the wrong reviews.
  let results = parsed.results as Record<string, unknown>[]
  if (results.every(r => typeof r?.i === 'number')) {
    results = [...results].sort((a, b) => (a.i as number) - (b.i as number))
  }
  return results.map(sanitize)
}

export async function POST(request: NextRequest) {
  // C1: gate the OpenAI proxy behind a valid Firebase session (org domain only).
  const user = await verifyRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })
  }

  let reviews: InReview[]
  try {
    const body = await request.json()
    reviews = body?.reviews
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({ error: 'reviews must be a non-empty array' }, { status: 400 })
    }
    if (reviews.length > MAX_BATCH) {
      return NextResponse.json({ error: `batch too large (max ${MAX_BATCH})` }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const client = new OpenAI({ apiKey: key })

  try {
    const results = await classify(client, reviews)
    return NextResponse.json({ results })
  } catch {
    // Retry once, then fall back to neutral so a bad batch never blocks the flow.
    try {
      const results = await classify(client, reviews)
      return NextResponse.json({ results })
    } catch {
      return NextResponse.json({ results: reviews.map(fallback) })
    }
  }
}
