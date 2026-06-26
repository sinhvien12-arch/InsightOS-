import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim()
const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()

// Only treat as configured when the URL is a real http(s) endpoint — a malformed
// value (empty, postgres://, stray whitespace) must NOT crash the build/import.
const validUrl = /^https?:\/\/[^\s]+$/.test(url)

export const supabaseConfigured = Boolean(validUrl && anon)

function safeClient(key: string, persistSession: boolean): SupabaseClient | null {
  if (!validUrl || !key) return null
  try {
    return createClient(url, key, { auth: { persistSession } })
  } catch {
    return null
  }
}

export const supabase: SupabaseClient | null = safeClient(anon, true)

export function createServerClient(): SupabaseClient | null {
  const svcKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? anon).trim()
  return safeClient(svcKey, false)
}
