// Client-side upload pipeline: parse CSV → chunked AI classify → aggregate → persist.
// Keeps the upload page thin (file-size rule) and the flow testable in isolation.

import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { supabaseConfigured } from './supabase'
import { auth } from './firebase'
import { reviewsToMetrics } from './aggregate'
import type { ProcessedReview, BranchMetrics } from './uploadTypes'

const CHUNK = 50
const CONCURRENCY = 5   // parallel OpenAI batches — cuts wall time ~5x
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
  dedupedCount:   number   // rows removed because file contained identical (branch+date+text)
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
}

async function parseFile(file: File): Promise<CsvRow[]> {
  const name = file.name.toLowerCase()
  // Excel: read all cells as formatted strings so downstream .trim() is safe.
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    return XLSX.utils.sheet_to_json<CsvRow>(sheet, { defval: '', raw: false })
  }
  // CSV (default)
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: r => resolve(r.data),
      error:    e => reject(new Error(e.message)),
    })
  })
}

function today() {
  return new Date().toISOString().split('T')[0]
}

type ChunkResult = { sentiment: ProcessedReview['sentiment']; sentiment_score: number; categories: ProcessedReview['categories'] }

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
    // A failed chunk must not block the whole upload — neutral fallback, but flag it.
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

  // Keep every row exactly as-is — use defaults only for truly empty fields.
  const rows = raw.map(r => ({
    branch_name: r.branch_name?.trim() || 'N/A',
    review_text: r.review_text?.trim() || '',
    date:        r.date?.trim() || today(),
    platform:    r.platform?.trim() || 'csv',
    author_name: r.author_name?.trim() || undefined,
    rating:      r.rating != null && r.rating !== '' ? Number(r.rating) : null,
    _noText:     !r.review_text?.trim(),
  }))

  // Auth token for the server routes (upload requires a signed-in org user).
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('You must be signed in to upload.')

  // 2. Chunked AI classification — chunks run CONCURRENCY-at-a-time to cut wall time.
  //    Rows with no review_text skip AI and get neutral sentiment directly.
  const total = rows.length
  const nowIso = new Date().toISOString()
  let failedChunks = 0

  const needsAI = rows.filter(r => !r._noText)
  const noText  = rows.filter(r => r._noText)

  const slices: typeof needsAI[] = []
  for (let i = 0; i < needsAI.length; i += CHUNK) slices.push(needsAI.slice(i, i + CHUNK))
  const totalChunks = slices.length
  const chunkOut: ProcessedReview[][] = new Array(slices.length)

  let nextIdx = 0
  let doneCount = 0
  async function worker() {
    while (nextIdx < slices.length) {
      const idx = nextIdx++
      const slice = slices[idx]
      const { results, ok } = await classifyChunk(slice.map(s => ({ review_text: s.review_text, rating: s.rating })), token!)
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

  // Rows with no review_text: pre-assign neutral, skip AI.
  const noTextProcessed: ProcessedReview[] = noText.map(s => ({
    date: s.date, platform: s.platform, branch_name: s.branch_name,
    review_text: s.review_text, author_name: s.author_name,
    rating: s.rating ?? undefined,
    sentiment: 'neutral' as const, sentiment_score: 0.5,
    categories: ['general' as const],
    keywords_found: [],
    processed_at: nowIso,
  }))

  // Dedup by (branch_name, date, review_text) — required because PostgreSQL's
  // ON CONFLICT DO UPDATE errors if the same key appears twice in one batch.
  // We keep the first occurrence and count how many were removed so the UI can warn the user.
  const seen = new Set<string>()
  const flat = [...chunkOut.flat(), ...noTextProcessed]
  const processed: ProcessedReview[] = flat.filter(r => {
    const k = `${r.branch_name}||${r.date}||${r.review_text}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  const dedupedCount = flat.length - processed.length

  // 3. Aggregate
  const metrics = reviewsToMetrics(processed)

  // 4. Persist via the authenticated server route (no client-side anon writes).
  let saved = false
  if (supabaseConfigured) {
    onProgress({ phase: 'saving', done: total, total })
    // Replace mode: wipe old data first (after analysis succeeded, before insert).
    if (mode === 'replace') await persist(token, { clear: true })
    // Reviews in batches to keep request bodies small.
    for (let i = 0; i < processed.length; i += PERSIST_BATCH) {
      await persist(token, { reviews: processed.slice(i, i + PERSIST_BATCH) })
    }
    // Recompute metrics from the full reviews table → consistent for both modes.
    await persist(token, { recompute: true })
    saved = true
  }

  onProgress({ phase: 'done', done: total, total })

  const totalPositive = metrics.reduce((s, m) => s + m.positive_count, 0)
  const positivePct = processed.length ? Math.round((totalPositive / processed.length) * 100) : 0
  const avgHealth = metrics.length
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
