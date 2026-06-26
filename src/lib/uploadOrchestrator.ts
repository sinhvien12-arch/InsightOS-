// Client-side upload pipeline: parse CSV → chunked AI classify → aggregate → persist.
// If the CSV already has a 'sentiment' column, those labels are used as-is and AI
// classification is skipped for those rows (saves time + API cost).

import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { supabaseConfigured } from './supabase'
import { auth } from './firebase'
import { reviewsToMetrics } from './aggregate'
import type { ProcessedReview, BranchMetrics, SentimentLabel } from './uploadTypes'

const CHUNK = 50
const CONCURRENCY = 5
const PERSIST_BATCH = 500
export const MAX_ROWS = 5000

export type UploadPhase = 'parsing' | 'analyzing' | 'saving' | 'done'

export interface UploadProgress {
  phase: UploadPhase
  done:  number
  total: number
}

export interface UploadSummary {
  totalReviews:   number
  dedupedCount:   number
  branches:       number
  positivePct:    number
  avgHealthScore: number
  saved:          boolean
  failedChunks:   number
  totalChunks:    number
}

interface CsvRow {
  branch_name?: string
  review_text?: string
  date?:        string
  platform?:    string
  rating?:      string
  author_name?: string
  sentiment?:   string   // pre-labeled sentiment from CSV (optional)
}

// Normalize CSV header keys to lowercase so "Date"/"DATE"/"date" all work.
function normalizeRow(raw: Record<string, unknown>): CsvRow {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw)) out[k.toLowerCase()] = v
  return out as CsvRow
}

// Map CSV sentiment cell to stored SentimentLabel.
// Handles English and Vietnamese, any capitalisation.
function parseSentiment(s?: string): SentimentLabel | null {
  switch (s?.toLowerCase().trim()) {
    case 'positive': case 'tích cực':   return 'positive'
    case 'negative': case 'tiêu cực':   return 'negative'
    case 'neutral':  case 'trung tính': return 'neutral'
    default: return null
  }
}

async function parseFile(file: File): Promise<CsvRow[]> {
  const name = file.name.toLowerCase()
  let raw: Record<string, unknown>[]

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false })
  } else {
    raw = await new Promise((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: r => resolve(r.data),
        error:    e => reject(new Error(e.message)),
      })
    })
  }

  // Normalize all header keys to lowercase so column name casing doesn't matter.
  return raw.map(normalizeRow)
}

function today() {
  return new Date().toISOString().split('T')[0]
}

type ChunkResult = { sentiment: SentimentLabel; sentiment_score: number; categories: ProcessedReview['categories'] }

async function classifyChunk(
  rows: { review_text: string; rating: number | null }[],
  token: string,
): Promise<{ results: ChunkResult[]; ok: boolean }> {
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reviews: rows }),
    })
    const data = await res.json()
    if (!res.ok || !Array.isArray(data.results) || data.results.length !== rows.length) {
      throw new Error(data.error ?? 'analyze failed')
    }
    return { results: data.results, ok: true }
  } catch (err) {
    console.error('[upload] chunk classification failed:', err)
    return {
      ok: false,
      results: rows.map(() => ({
        sentiment: 'neutral' as const, sentiment_score: 0.5,
        categories: ['general' as const],
      })),
    }
  }
}

async function persist(token: string, body: { reviews?: ProcessedReview[]; metrics?: BranchMetrics[]; clear?: boolean; recompute?: boolean }): Promise<void> {
  const res = await fetch('/api/persist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(`Save failed: ${data.error ?? res.status}`)
  }
}

export async function processFile(
  file: File,
  onProgress: (p: UploadProgress) => void,
  mode: 'replace' | 'append' = 'replace',
): Promise<UploadSummary> {
  // 1. Parse + validate
  onProgress({ phase: 'parsing', done: 0, total: 0 })
  const raw = await parseFile(file)
  if (!raw.length) throw new Error('File is empty.')
  if (raw.length > MAX_ROWS) throw new Error(`Too many rows (${raw.length}). Max ${MAX_ROWS}.`)

  const first = raw[0]
  if (!('branch_name' in first) || !('review_text' in first)) {
    throw new Error('Missing required columns: branch_name, review_text.')
  }

  const rows = raw.map(r => ({
    branch_name:   r.branch_name?.trim() || 'N/A',
    review_text:   r.review_text?.trim() || '',
    date:          r.date?.trim() || today(),
    platform:      r.platform?.trim() || 'csv',
    author_name:   r.author_name?.trim() || undefined,
    rating:        r.rating != null && r.rating !== '' ? Number(r.rating) : null,
    _noText:       !r.review_text?.trim(),
    _csvSentiment: parseSentiment(r.sentiment),  // null = not pre-labeled
  }))

  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('You must be signed in to upload.')

  // 2. Classify sentiment
  //    Priority: CSV pre-label > AI (has text) > neutral fallback (no text)
  const nowIso = new Date().toISOString()
  let failedChunks = 0
  let doneCount = 0
  const total = rows.length

  // Rows with a valid pre-labeled sentiment — skip AI entirely.
  const preLabeled = rows.filter(r => r._csvSentiment !== null)
  // Rows without pre-label but with review text — run AI.
  const needsAI    = rows.filter(r => r._csvSentiment === null && !r._noText)
  // Rows without pre-label and without text — neutral fallback.
  const noText     = rows.filter(r => r._csvSentiment === null && r._noText)

  // Pre-labeled rows: use CSV sentiment directly.
  const preLabeledProcessed: ProcessedReview[] = preLabeled.map(s => ({
    date: s.date, platform: s.platform, branch_name: s.branch_name,
    review_text: s.review_text, author_name: s.author_name,
    rating: s.rating ?? undefined,
    sentiment:       s._csvSentiment!,
    sentiment_score: s._csvSentiment === 'positive' ? 0.9 : s._csvSentiment === 'negative' ? 0.1 : 0.5,
    categories:      ['general' as const],
    keywords_found:  [],
    processed_at:    nowIso,
  }))
  doneCount += preLabeled.length
  if (preLabeled.length) onProgress({ phase: 'analyzing', done: Math.min(doneCount, total), total })

  // AI-classified rows.
  const slices: typeof needsAI[] = []
  for (let i = 0; i < needsAI.length; i += CHUNK) slices.push(needsAI.slice(i, i + CHUNK))
  const totalChunks = slices.length
  const chunkOut: ProcessedReview[][] = new Array(slices.length)

  let nextIdx = 0
  async function worker() {
    while (nextIdx < slices.length) {
      const idx = nextIdx++
      const slice = slices[idx]
      const { results, ok } = await classifyChunk(
        slice.map(s => ({ review_text: s.review_text, rating: s.rating })), token!,
      )
      if (!ok) failedChunks++
      chunkOut[idx] = slice.map((s, j) => ({
        date: s.date, platform: s.platform, branch_name: s.branch_name,
        review_text: s.review_text, author_name: s.author_name,
        rating: s.rating ?? undefined,
        sentiment:       results[j].sentiment,
        sentiment_score: results[j].sentiment_score,
        categories:      results[j].categories,
        keywords_found:  [],
        processed_at:    nowIso,
      }))
      doneCount += slice.length
      onProgress({ phase: 'analyzing', done: Math.min(doneCount, total), total })
    }
  }
  if (slices.length) await Promise.all(Array.from({ length: Math.min(CONCURRENCY, slices.length) }, worker))

  // No-text rows: neutral fallback.
  const noTextProcessed: ProcessedReview[] = noText.map(s => ({
    date: s.date, platform: s.platform, branch_name: s.branch_name,
    review_text: s.review_text, author_name: s.author_name,
    rating: s.rating ?? undefined,
    sentiment: 'neutral' as const, sentiment_score: 0.5,
    categories: ['general' as const],
    keywords_found: [],
    processed_at: nowIso,
  }))

  // Dedup by (branch_name, date, review_text) — required for Postgres unique constraint.
  const seen = new Set<string>()
  const flat = [...preLabeledProcessed, ...chunkOut.flat(), ...noTextProcessed]
  const processed: ProcessedReview[] = flat.filter(r => {
    const k = `${r.branch_name}||${r.date}||${r.review_text}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  const dedupedCount = flat.length - processed.length

  // 3. Aggregate client-side (for the summary card).
  const metrics = reviewsToMetrics(processed)

  // 4. Persist.
  let saved = false
  if (supabaseConfigured) {
    onProgress({ phase: 'saving', done: total, total })
    if (mode === 'replace') await persist(token, { clear: true })
    for (let i = 0; i < processed.length; i += PERSIST_BATCH) {
      await persist(token, { reviews: processed.slice(i, i + PERSIST_BATCH) })
    }
    await persist(token, { recompute: true })
    saved = true
  }

  onProgress({ phase: 'done', done: total, total })

  const totalPositive = metrics.reduce((s, m) => s + m.positive_count, 0)
  const positivePct   = processed.length ? Math.round((totalPositive / processed.length) * 100) : 0
  const avgHealth     = metrics.length
    ? Math.round(metrics.reduce((s, m) => s + m.health_score, 0) / metrics.length)
    : 0

  return {
    totalReviews:   processed.length,
    dedupedCount,
    branches:       metrics.length,
    positivePct,
    avgHealthScore: avgHealth,
    saved,
    failedChunks,
    totalChunks,
  }
}
