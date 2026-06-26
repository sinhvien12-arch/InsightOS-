'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import AppShell from '@/components/AppShell'
import { Coffee } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isGuest, loading } = useAuth()
  const router                     = useRouter()

  useEffect(() => {
    if (!loading && !user && !isGuest) router.replace('/')
  }, [user, isGuest, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-700 flex items-center justify-center shadow-lg animate-pulse-slow">
            <Coffee size={24} className="text-white" />
          </div>
          <div className="text-slate-500 text-sm font-medium">Loading InsightOS…</div>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user && !isGuest) return null

  return <AppShell>{children}</AppShell>
}
