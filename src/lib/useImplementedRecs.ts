import { useState, useCallback, useEffect, useRef } from 'react'
import { auth } from '@/lib/firebase'

const LS_KEY = 'insightos_impl_recs'

function loadLocal(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(LS_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch { return new Set() }
}

function saveLocal(ids: Set<string>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(Array.from(ids))) } catch {}
}

async function getToken(): Promise<string | null> {
  try {
    const user = auth?.currentUser
    if (!user) return null
    return await user.getIdToken()
  } catch { return null }
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response | null> {
  const token = await getToken()
  if (!token) return null
  try {
    return await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
    })
  } catch { return null }
}

export function useImplementedRecs() {
  const [implementedIds, setIds] = useState<Set<string>>(loadLocal)
  const synced = useRef(false)

  // On mount: load from Supabase and merge with any local optimistic state
  useEffect(() => {
    if (synced.current) return
    synced.current = true
    ;(async () => {
      const res = await apiFetch('/api/recs')
      if (!res?.ok) return
      const json = await res.json() as { ids?: string[] }
      if (!Array.isArray(json.ids)) return
      const serverIds = new Set<string>(json.ids)
      setIds(prev => {
        // Union: keep any locally added IDs (optimistic) plus all server IDs
        const merged = new Set([...Array.from(prev), ...Array.from(serverIds)])
        saveLocal(merged)
        return merged
      })
    })()
  }, [])

  const markImplemented = useCallback((id: string) => {
    // Optimistic update first
    setIds(prev => {
      const next = new Set(prev)
      next.add(id)
      saveLocal(next)
      return next
    })
    // Async persist to Supabase
    apiFetch('/api/recs', { method: 'POST', body: JSON.stringify({ id }) })
  }, [])

  const clearAll = useCallback(() => {
    setIds(new Set())
    try { localStorage.removeItem(LS_KEY) } catch {}
    apiFetch('/api/recs', { method: 'DELETE' })
  }, [])

  return { implementedIds, markImplemented, clearAll }
}
