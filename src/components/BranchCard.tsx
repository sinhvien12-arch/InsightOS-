'use client'

import { useRouter } from 'next/navigation'
import { MapPin, Star, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { healthColor } from '@/lib/utils'
import { useLang } from '@/lib/LangContext'
import type { Branch } from '@/data/types'

interface Props { branch: Branch }

export default function BranchCard({ branch }: Props) {
  const router = useRouter()
  const { t } = useLang()
  const color  = healthColor(branch.healthScore)
  const diff   = branch.healthScore - branch.prevScore

  return (
    <div
      onClick={() => router.push(`/branch/${branch.id}`)}
      className="bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer p-5 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 truncate group-hover:text-primary-700 transition-colors">
            {branch.name}
          </h3>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={11} className="text-slate-400 flex-shrink-0" />
            <p className="text-xs text-slate-400 truncate">{branch.address.split(',')[0]}</p>
          </div>
        </div>

        {/* Health badge */}
        <div
          className="ml-3 flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold text-white text-sm"
          style={{ background: color }}
        >
          {branch.healthScore}
          <span className="text-[9px] font-normal opacity-80">/100</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="flex items-center justify-center gap-0.5 text-amber-500">
            <Star size={11} fill="currentColor" />
            <span className="text-sm font-bold text-slate-800">{branch.avgRating}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{t('branch.rating')}</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-slate-800">{branch.reviewCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{t('branch.reviewsLabel')}</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-0.5">
            <AlertCircle size={11} className="text-red-400" />
            <span className="text-sm font-bold text-slate-800">{branch.issueCount}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{t('branch.issuesLabel')}</div>
        </div>
      </div>

      {/* Trend */}
      <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
        {diff >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {diff >= 0 ? '+' : ''}{diff} {t('branch.ptsFromLastMonth')}
      </div>

      {/* Sentiment bar */}
      <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden flex">
        <div className="bg-emerald-400 h-full" style={{ width: `${branch.sentiment.positive}%` }} />
        <div className="bg-slate-300 h-full" style={{ width: `${branch.sentiment.neutral}%` }} />
        <div className="bg-red-400 h-full" style={{ width: `${branch.sentiment.negative}%` }} />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-slate-400">
        <span className="text-emerald-600">{branch.sentiment.positive}% {t('branch.pos')}</span>
        <span className="text-red-400">{branch.sentiment.negative}% {t('branch.neg')}</span>
      </div>
    </div>
  )
}
