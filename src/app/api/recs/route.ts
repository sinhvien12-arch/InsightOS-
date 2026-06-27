import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/verify-auth'
import { createServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'

// Requires this table in Supabase (run once in SQL editor):
// CREATE TABLE IF NOT EXISTS implemented_recs (
//   rec_id TEXT PRIMARY KEY,
//   implemented_at TIMESTAMPTZ DEFAULT NOW()
// );

export async function GET(request: NextRequest) {
  const user = await verifyRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = createServerClient()
  if (!client) return NextResponse.json({ ids: [] })

  const { data, error } = await client.from('implemented_recs').select('rec_id')
  if (error) return NextResponse.json({ ids: [] }) // table may not exist yet
  return NextResponse.json({ ids: (data ?? []).map((r: { rec_id: string }) => r.rec_id) })
}

export async function POST(request: NextRequest) {
  const user = await verifyRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = createServerClient()
  if (!client) return NextResponse.json({ ok: true })

  let body: { id?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }) }

  const { id } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await client
    .from('implemented_recs')
    .upsert({ rec_id: id }, { onConflict: 'rec_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const user = await verifyRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = createServerClient()
  if (!client) return NextResponse.json({ ok: true })

  const { error } = await client
    .from('implemented_recs')
    .delete()
    .neq('rec_id', '')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
