import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/verify-auth'
import { createServerClient } from '@/lib/supabase'
import { reviewsToMetrics } from '@/lib/aggregate'
import type { ProcessedReview, BranchMetrics } from '@/lib/uploadTypes'

export const runtime = 'nodejs'

const PAGE = 1000

// Supabase returns a plain PostgrestError object (not an Error), so we surface
// message + code + details/hint explicitly instead of losing it in the catch.
function dbError(e: unknown): string {
  if (e && typeof e === 'object') {
    const o = e as { message?: string; code?: string; details?: string; hint?: string }
    const parts = [o.message, o.code && `code=${o.code}`, o.details, o.hint].filter(Boolean)
    if (parts.length) return parts.join(' | ')
  }
  return e instanceof Error ? e.message : 'persist failed'
}

// C2: persistence runs server-side with the Supabase service-role key (falls back
// to anon in dev). Supports: upsert reviews/metrics, clear-all, and recompute
// branch_metrics from the full reviews table (keeps metrics consistent).
export async function POST(request: NextRequest) {
  const user = await verifyRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = createServerClient()
  if (!client) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  let body: { reviews?: ProcessedReview[]; metrics?: BranchMetrics[]; clear?: boolean; recompute?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  try {
    // 1. Clear all data (Replace mode). supabase-js requires a filter on delete.
    if (body.clear === true) {
      const r = await client.from('reviews').delete().not('id', 'is', null)
      if (r.error) throw r.error
      const m = await client.from('branch_metrics').delete().not('id', 'is', null)
      if (m.error) throw m.error
      return NextResponse.json({ ok: true })
    }

    // 2. Upsert reviews. Replace mode clears the table first, so conflicts only
    //    arise if the same (branch_name, date, review_text) appears twice within
    //    the uploaded file itself — in that case Postgres keeps one row (update).
    if (Array.isArray(body.reviews) && body.reviews.length) {
      const { error } = await client.from('reviews').upsert(body.reviews, { onConflict: 'branch_name,date,review_text' })
      if (error) throw error
    }
    if (Array.isArray(body.metrics) && body.metrics.length) {
      const { error } = await client.from('branch_metrics').upsert(body.metrics, { onConflict: 'branch_name' })
      if (error) throw error
    }

    // 3. Recompute branch_metrics from the FULL reviews table (consistency fix).
    if (body.recompute === true) {
      // Read ALL reviews (paginated, ordered) so accumulated appends aren't truncated.
      const all: ProcessedReview[] = []
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await client.from('reviews').select('*').order('id', { ascending: true }).range(from, from + PAGE - 1)
        if (error) throw error
        if (!data?.length) break
        all.push(...(data as ProcessedReview[]))
        if (data.length < PAGE) break
      }
      const metrics = reviewsToMetrics(all)
      // Always wipe metrics first so branches no longer present can't leave stale rows.
      const delErr = (await client.from('branch_metrics').delete().not('id', 'is', null)).error
      if (delErr) throw delErr
      if (metrics.length) {
        const { error: upErr } = await client.from('branch_metrics').upsert(metrics, { onConflict: 'branch_name' })
        if (upErr) throw upErr
      }
      return NextResponse.json({ ok: true, branches: metrics.length })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = dbError(e)
    console.error('[persist] failed:', msg, e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
