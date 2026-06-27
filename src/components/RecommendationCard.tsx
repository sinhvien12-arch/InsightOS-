'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, ChevronUp, Zap, Clock, TrendingUp, ArrowRight, Loader2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { useLang } from '@/lib/LangContext'
import { auth } from '@/lib/firebase'
import type { Recommendation, Priority } from '@/data/types'

const PRIORITY_VARIANT: Record<Priority, 'high' | 'medium' | 'low'> = {
  Critical: 'high', High: 'high', Medium: 'medium', Low: 'low',
}

const EFFORT_COLOR: Record<string, string> = {
  Low:    'text-emerald-600 bg-emerald-50',
  Medium: 'text-amber-600  bg-amber-50',
  High:   'text-red-600    bg-red-50',
}

const EFFORT_VI: Record<string, string> = { Low: 'Thấp', Medium: 'Trung bình', High: 'Cao' }

type ImplStatus = 'idle' | 'creating' | 'done' | 'error'

interface Props {
  rec:              Recommendation
  isLive?:          boolean
  onImplemented?:   (id: string) => void
}

export default function RecommendationCard({ rec, isLive = false, onImplemented }: Props) {
  const { t, lang } = useLang()
  const vi     = lang === 'vi'
  const router = useRouter()

  const [status,   setStatus]   = useState<ImplStatus>('idle')
  const [errMsg,   setErrMsg]   = useState('')
  const [expanded, setExpanded] = useState(false)
  const [implDate] = useState(() =>
    new Date().toLocaleDateString(vi ? 'vi-VN' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  )

  const isDone     = status === 'done'
  const isCreating = status === 'creating'
  const isError    = status === 'error'

  async function handleImplement() {
    if (isDone || isCreating) return

    // Demo mode — mark done locally
    if (!isLive) {
      setStatus('done')
      setTimeout(() => onImplemented?.(rec.id), 2000)
      return
    }

    // Live mode — create a real Action in Supabase
    setStatus('creating')
    setErrMsg('')
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error(vi ? 'Chưa đăng nhập' : 'Not signed in')

      const deadline = new Date()
      deadline.setDate(deadline.getDate() + 7)

      const res = await fetch('/api/actions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          issueId:          '',
          issueCode:        '',
          title:            rec.title,
          titleVi:          rec.titleVi         ?? rec.title,
          description:      rec.description,
          descriptionVi:    rec.descriptionVi   ?? rec.description,
          owner:            'Manager',
          branchId:         rec.branchId,
          branchName:       rec.branchName,
          priority:         rec.priority,
          status:           'Pending',
          deadline:         deadline.toISOString().slice(0, 10),
          progress:         0,
          expectedImpact:   rec.expectedImpact,
          expectedImpactVi: rec.estimatedImprovementVi ?? rec.estimatedImprovement,
          tags:             rec.tags,
          timeline: [{
            date:    new Date().toISOString().slice(0, 10),
            event:   'Action created from AI recommendation',
            eventVi: 'Hành động được tạo từ khuyến nghị AI',
            type:    'created',
          }],
          comments: [],
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg  = (body as { error?: string }).error ?? `HTTP ${res.status}`
        console.error('[RecommendationCard] API error:', msg)
        throw new Error(msg)
      }

      setStatus('done')
      // Notify parent after brief delay so user sees confirmation before card is removed
      setTimeout(() => onImplemented?.(rec.id), 2000)
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'unknown error'
      console.error('[RecommendationCard] implement failed:', raw)
      // Friendly hint for missing table
      setErrMsg(raw)
      setStatus('error')
      setTimeout(() => { setStatus('idle'); setErrMsg('') }, 6000)
    }
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-card transition-all duration-200 ${
      isDone ? 'border-emerald-200' : 'border-gray-100 hover:shadow-card-hover'
    }`}>
      <div className="p-5">

        {/* Header badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant={PRIORITY_VARIANT[rec.priority]} dot>{rec.priority}</Badge>
          <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
            {rec.category}
          </span>
          {rec.branchName ? (
            <span className="text-[10px] font-medium text-primary-700 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-full">
              {rec.branchName.replace('Phê La ', '')}
            </span>
          ) : (
            <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
              {t('rec.allBranches')}
            </span>
          )}
          {isDone && (
            <span className="ml-auto text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp size={10} /> {t('rec.improving')}
            </span>
          )}
        </div>

        <h3 className="text-sm font-bold text-slate-800 mb-2 leading-snug">
          {vi ? (rec.titleVi ?? rec.title) : rec.title}
        </h3>

        {expanded && (
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            {vi ? (rec.descriptionVi ?? rec.description) : rec.description}
          </p>
        )}

        {/* Impact row */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs">
            <Zap size={12} className="text-primary-600" />
            <span className="text-slate-400">{t('rec.impact')}</span>
            <span className="font-semibold text-emerald-600">
              {vi ? (rec.estimatedImprovementVi ?? rec.estimatedImprovement) : rec.estimatedImprovement}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Clock size={12} className="text-slate-400" />
            <span className="text-slate-400">{t('rec.timeline')}</span>
            <span className="font-medium text-slate-600">{rec.timeframe}</span>
          </div>
          <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${EFFORT_COLOR[rec.effort]}`}>
            {t('rec.effortLabel')}{' '}{vi ? EFFORT_VI[rec.effort] : rec.effort}
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

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleImplement}
            disabled={isCreating || isDone}
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-all disabled:cursor-default ${
              isDone     ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : isError   ? 'bg-red-50 text-red-600 border border-red-200'
              : isCreating ? 'bg-gray-100 text-slate-400'
              : 'bg-primary-700 text-white hover:bg-primary-600'
            }`}
          >
            {isCreating && <Loader2 size={12} className="animate-spin" />}
            {isDone && <Check size={12} />}
            {isCreating  ? (vi ? 'Đang tạo...' : 'Creating...')
             : isDone    ? (vi ? 'Đã tạo Action' : 'Action Created')
             : isError   ? (vi ? 'Lỗi — Thử lại' : 'Error — Retry')
             : (vi ? 'Triển khai' : t('recs.implement'))}
          </button>

          {/* View in Actions after successful live creation */}
          {isDone && isLive && (
            <button
              onClick={() => router.push('/actions')}
              className="flex items-center gap-1 text-xs font-semibold text-primary-700 bg-primary-50 border border-primary-200 px-3 py-2 rounded-xl hover:bg-primary-100 transition-colors"
            >
              {vi ? 'Xem Actions' : 'View Actions'} <ArrowRight size={11} />
            </button>
          )}

          {/* Link to related Issues (always visible when collapsed) */}
          {!isDone && rec.branchId && (
            <button
              onClick={() => router.push(`/issues?branch=${rec.branchId}`)}
              className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-primary-700 px-2 py-2 rounded-xl hover:bg-primary-50 transition-colors"
            >
              {vi ? 'Xem vấn đề' : 'View Issues'} <ArrowRight size={11} />
            </button>
          )}

          {/* Expand / collapse — hidden when done in live mode */}
          {!(isDone && isLive) && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? t('rec.less') : t('rec.details')}
            </button>
          )}
        </div>

        {/* Error message */}
        {isError && errMsg && (
          <p className="mt-2 text-[11px] text-red-500 leading-snug">{errMsg}</p>
        )}

        {/* Post-implementation panel */}
        {isDone && (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">
                {isLive
                  ? (vi ? `Action được tạo · ${implDate}` : `Action created · ${implDate}`)
                  : `${t('rec.implementedOn')} ${implDate}`}
              </span>
              {isLive ? (
                <button
                  onClick={() => router.push('/actions')}
                  className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-emerald-200 transition-colors"
                >
                  {vi ? 'Xem trong Actions' : 'View in Actions'} <ArrowRight size={9} />
                </button>
              ) : (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                  {t('rec.improving')}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('rec.expectedLabel')}</div>
                <div className="text-xs text-slate-700 leading-relaxed">{rec.expectedImpact}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">{t('rec.projectedLabel')}</div>
                <div className="text-xs text-emerald-700 font-semibold leading-relaxed">
                  {vi ? (rec.estimatedImprovementVi ?? rec.estimatedImprovement) : rec.estimatedImprovement}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-emerald-600 flex items-center gap-1">
              <Clock size={9} />
              {isLive
                ? (vi ? 'Đang theo dõi trong Actions · Deadline mặc định 7 ngày' : 'Tracked in Actions · Default 7-day deadline')
                : t('rec.trackIn14')}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
