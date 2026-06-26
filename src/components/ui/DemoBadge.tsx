'use client'

import { Sparkles } from 'lucide-react'
import { useLang } from '@/lib/LangContext'

/** Fixed pill marking pages that always render sample (non-live) data. */
export default function DemoBadge() {
  const { lang } = useLang()
  return (
    <div className="fixed top-20 right-4 z-30 inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-sm pointer-events-none">
      <Sparkles size={12} />
      {lang === 'vi' ? 'Dữ liệu mẫu' : 'Demo data'}
    </div>
  )
}
