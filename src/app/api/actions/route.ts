import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/verify-auth'
import { createServerClient } from '@/lib/supabase'
import type { ActionComment } from '@/data/types'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const user = await verifyRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = createServerClient()
  if (!client) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const { data, error } = await client
    .from('actions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ actions: data ?? [] })
}

export async function POST(request: NextRequest) {
  const user = await verifyRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = createServerClient()
  if (!client) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const body = await request.json()

  // Only include columns that are core to a new action.
  // JSONB columns with DB defaults (actual_impact, monitoring) are omitted
  // so older table schemas without those columns still work.
  // Build row defensively: use null (not '') for optional fields to avoid
  // uuid/type mismatch errors on tables created via Supabase UI.
  const row: Record<string, unknown> = {
    title:    body.title,
    priority: body.priority  ?? 'Medium',
    status:   body.status    ?? 'Pending',
    deadline: body.deadline  ?? '',
    progress: body.progress  ?? 0,
    owner:    body.owner     ?? 'Manager',
  }
  // Text fields — only set if non-empty
  if (body.issueId)        row.issue_id          = body.issueId
  if (body.issueCode)      row.issue_code         = body.issueCode
  if (body.titleVi)        row.title_vi           = body.titleVi
  if (body.description)    row.description        = body.description
  if (body.descriptionVi)  row.description_vi     = body.descriptionVi
  if (body.branchId)       row.branch_id          = body.branchId
  if (body.branchName)     row.branch_name        = body.branchName
  if (body.expectedImpact)    row.expected_impact    = body.expectedImpact
  if (body.expectedImpactVi)  row.expected_impact_vi = body.expectedImpactVi
  // JSONB / array columns — only set if non-empty (avoids missing-column errors)
  if (Array.isArray(body.tags)      && body.tags.length)      row.tags      = body.tags
  if (Array.isArray(body.timeline)  && body.timeline.length)  row.timeline  = body.timeline
  if (Array.isArray(body.comments)  && body.comments.length)  row.comments  = body.comments
  if (body.monitoring)  row.monitoring   = body.monitoring
  if (Array.isArray(body.actualImpact) && body.actualImpact.length) row.actual_impact = body.actualImpact

  const { data, error } = await client.from('actions').insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ action: data })
}

export async function PATCH(request: NextRequest) {
  const user = await verifyRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = createServerClient()
  if (!client) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const body = await request.json()
  const { id, addComment, ...rest } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const now = new Date().toISOString()

  if (addComment) {
    const { data: row, error: fetchErr } = await client
      .from('actions').select('comments').eq('id', id).single()
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    const comments = [...((row?.comments as ActionComment[]) ?? []), addComment]
    const { error } = await client.from('actions').update({ comments, updated_at: now }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const updates: Record<string, unknown> = { updated_at: now }
  if (rest.status      !== undefined) updates.status       = rest.status
  if (rest.progress    !== undefined) updates.progress     = rest.progress
  if (rest.timeline    !== undefined) updates.timeline     = rest.timeline
  if (rest.monitoring  !== undefined) updates.monitoring   = rest.monitoring
  if (rest.actualImpact !== undefined) updates.actual_impact = rest.actualImpact

  const { error } = await client.from('actions').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
