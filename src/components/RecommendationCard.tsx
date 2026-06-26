'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Zap, Clock, TrendingUp } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { useLang } from '@/lib/LangContext'
import type { Recommendation } from '@/data/types'
import type { Priority } from '@/data/types'

const PRIORITY_VARIANT: Record<Priority, 'high'|'medium'|'low'> = {
  Critical: 'high', High: 'high', Medium: 'medium', Low: 'low',
}

const EFFORT_COLOR: Record<string, string> = {
  Low:    'text-emerald-600 bg-emerald-50',
  Medium: 'text-amber-600  bg-amber-50',
  High:   'text-red-600    bg-red-50',
}

const EFFORT_VI: Record<string, string> = { Low: 'Thấp', Medium: 'Trung bình', High: 'Cao' }

interface Props { rec: Recommendation; lang?: 'en' | 'vi' }

export default function RecommendationCard({ rec }: Props) {
  const { t, lang } = useLang()
  const vi = lang === 'vi'
  const [done, setDone]         = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [implDate]              = useState(() => new Date().toLocaleDateString(vi ? 'vi-VN' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }))

  return (
    <div className={`bg-white rounded-2xl border shadow-card transition-all duration-200 ${done ? 'border-emerald-200' : 'border-gray-100 hover:shadow-card-hover'}`}>
      <div className="p-5">
        {/* Header badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant={PRIORITY_VARIANT[rec.priority]} dot>{rec.priority}</Badge>
          <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
            {rec.category}
          </span>
          {rec.branchName && (
            <span className="text-[10px] font-medium text-primary-700 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-full">
              {rec.branchName}
            </span>
          )}
          {!rec.branchName && (
            <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
              {t('rec.allBranches')}
            </span>
          )}
          {done && (
            <span className="ml-auto text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp size={10} /> {t('rec.improving')}
            </span>
          )}
        </div>

        <h3 className="text-sm font-bold text-slate-800 mb-2 leading-snug">{vi ? (rec.titleVi ?? rec.title) : rec.title}</h3>

        {/* Expanded description */}
        {expanded && (
          <p className="text-xs text-slate-500 leading-relaxed mb-3">{vi ? (rec.descriptionVi ?? rec.description) : rec.description}</p>
        )}

        {/* Impact metrics */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs">
            <Zap size={12} className="text-primary-600" />
            <span className="text-slate-400">{t('rec.impact')}</span>
            <span className="font-semibold text-emerald-600">{vi ? (rec.estimatedImprovementVi ?? rec.estimatedImprovement) : rec.estimatedImprovement}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Clock size={12} className="text-slate-400" />
            <span className="text-slate-400">{t('rec.timeline')}</span>
            <span className="font-medium text-slate-600">{rec.timeframe}</span>
          </div>
          <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${EFFORT_COLOR[rec.effort]}`}>
            {t('rec.effortLabel')}{' '}
            {vi ? EFFORT_VI[rec.effort] : rec.effort}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {rec.tags.map(tag => (
            <span key={tag} className="text-[10px] text-slate-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDone(d => !d)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
              done
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-primary-700 text-white hover:bg-primary-600'
            }`}
          >
            {done && <Check size={12} />}
            {done ? t('recs.implemented') : t('recs.implement')}
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? t('rec.less') : t('rec.details')}
          </button>
        </div>

        {/* Implementation record — shown after marking done */}
        {done && (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">{t('rec.implementedOn')} {implDate}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">{t('rec.improving')}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('rec.expectedLabel')}</div>
                <div className="text-xs text-slate-700 leading-relaxed">{rec.expectedImpact}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">{t('rec.projectedLabel')}</div>
                <div className="text-xs text-emerald-700 font-semibold leading-relaxed">{vi ? (rec.estimatedImprovementVi ?? rec.estimatedImprovement) : rec.estimatedImprovement}</div>
              </div>
            </div>
            <div className="text-[10px] text-emerald-600 flex items-center gap-1">
              <Clock size={9} />
              {t('rec.trackIn14')}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
