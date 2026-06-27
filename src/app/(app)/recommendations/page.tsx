'use client'

import { useState, useMemo, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { Filter, RefreshCw, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { useLiveData } from '@/lib/useLiveData'
import { liveToRecommendations, computeImpactSummary } from '@/lib/liveRecommendations'
import { useImplementedRecs } from '@/lib/useImplementedRecs'
import { recommendations as demoRecs } from '@/data/recommendations'
import RecommendationCard from '@/components/RecommendationCard'
import type { Priority } from '@/data/types'

const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low']
const PRIORITY_VI: Record<string, string> = { Critical: 'Nghiêm trọng', High: 'Cao', Medium: 'Trung bình', Low: 'Thấp' }

function RecommendationsInner() {
  const searchParams = useSearchParams()
  const urlBranch    = searchParams.get('branch') ?? 'all'
  const { t, lang } = useLang()
  const vi = lang === 'vi'

  const { mode, metrics, branches: liveBranches, chainStats, refresh } = useLiveData()
  const isLive      = mode === 'live'
  const isChecking  = mode === 'checking'

  // Derive live recommendations from real metrics
  const liveRecs = useMemo(() => liveToRecommendations(metrics), [metrics])
  const impact   = useMemo(() => computeImpactSummary(metrics),  [metrics])

  const displayRecs = isLive ? liveRecs : demoRecs

  const { implementedIds, markImplemented, clearAll } = useImplementedRecs()
  const [showImplemented, setShowImplemented] = useState(false)

  const [branch,   setBranch]   = useState(urlBranch)
  const [priority, setPriority] = useState<string>('all')
  const [category, setCategory] = useState('All')

  // Branch options from live data (or fallback hardcoded demo list)
  const branchOptions = isLive
    ? [{ id: 'all', name: t('rec.allBranches') }, ...liveBranches.map(b => ({ id: b.id, name: b.name }))]
    : [
        { id: 'all', name: t('rec.allBranches') },
        { id: 'nvc', name: 'Nguyễn Văn Cừ' },
        { id: 'nt',  name: 'Núi Trúc' },
        { id: 'tt',  name: 'Thanh Thái' },
        { id: 'tqh', name: 'Trần Quốc Hoàn' },
        { id: 'lvl', name: 'Lê Văn Lương' },
      ]

  // Dynamic category list from current recs
  const CATEGORIES = ['All', ...Array.from(new Set(displayRecs.map(r => r.category)))]

  const filtered = displayRecs.filter(r => {
    const bMatch = branch === 'all'   || r.branchId === branch   || r.branchId === null
    const pMatch = priority === 'all' || r.priority === priority
    const cMatch = category === 'All' || r.category === category
    return bMatch && pMatch && cMatch
  })

  const activeRecs = filtered.filter(r => !implementedIds.has(r.id))
  const doneRecs   = filtered.filter(r => implementedIds.has(r.id))
  const visibleRecs = showImplemented ? filtered : activeRecs

  // Combined impact values
  const impactMetrics = isLive
    ? [
        { val: `+${impact.potentialHealthGain} pts`, label: t('recs.chainHealthScore') },
        { val: `-${impact.waitReductionPct}%`,        label: t('recs.waitComplaints')   },
        { val: `+${impact.satisfactionGainPct}%`,     label: t('recs.satisfaction')     },
        { val: `+${impact.revenueImpactPct}%`,        label: t('recs.revenueImpact')    },
      ]
    : [
        { val: '+15 pts', label: t('recs.chainHealthScore') },
        { val: '-28%',    label: t('recs.waitComplaints')   },
        { val: '+18%',    label: t('recs.satisfaction')     },
        { val: '+8%',     label: t('recs.revenueImpact')    },
      ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('recs.title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('recs.subtitle')}</p>
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold mt-2 px-2.5 py-1 rounded-full border ${
            isLive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {isChecking
              ? (vi ? 'Đang tải...' : 'Loading...')
              : isLive
                ? (vi ? `${liveRecs.length} khuyến nghị từ dữ liệu trực tiếp` : `${liveRecs.length} recommendations from live data`)
                : (vi ? 'Dữ liệu mẫu · Khuyến nghị cố định' : 'Demo data · Predefined recommendations')}
          </span>
        </div>
        {isLive && (
          <button
            onClick={refresh}
            disabled={isChecking}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-primary-700 hover:border-primary-200 transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={isChecking ? 'animate-spin' : ''} />
            {vi ? 'Làm mới' : 'Refresh'}
          </button>
        )}
      </div>

      {/* Live summary row */}
      {isLive && metrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: vi ? 'Sức khỏe hiện tại' : 'Current Health',      val: `${chainStats.avgHealthScore}/100`,  color: 'text-slate-700' },
            { label: vi ? 'Chi nhánh cần cải thiện' : 'Need Improvement', val: `${metrics.filter(m => m.health_score < 75).length}/${metrics.length}`, color: 'text-amber-600' },
            { label: vi ? 'Khuyến nghị khẩn cấp' : 'Critical Recs',     val: String(liveRecs.filter(r => r.priority === 'Critical').length), color: 'text-red-600' },
            { label: vi ? 'Có thể triển khai ngay' : 'Quick Wins',        val: String(liveRecs.filter(r => r.effort === 'Low').length),       color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-3 shadow-card text-center">
              <div className={`text-xl font-extrabold ${s.color}`}>{s.val}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
            <Filter size={13} />
            {t('recs.filter')}
          </div>

          {/* Branch */}
          <select
            value={branch}
            onChange={e => setBranch(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-slate-600 font-medium focus:outline-none focus:border-primary-400"
          >
            {branchOptions.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Priority */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setPriority('all')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${
                priority === 'all' ? 'bg-primary-700 text-white border-primary-700' : 'text-slate-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t('recs.all')}
            </button>
            {PRIORITIES.map(p => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${
                  priority === p
                    ? p === 'Critical' ? 'bg-red-600 text-white border-red-600'
                    : p === 'High'     ? 'bg-red-100 text-red-700 border-red-200'
                    : p === 'Medium'   ? 'bg-amber-100 text-amber-700 border-amber-200'
                    : 'bg-green-100 text-green-700 border-green-200'
                    : 'text-slate-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {vi ? PRIORITY_VI[p] : p}
              </button>
            ))}
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-slate-600 font-medium focus:outline-none focus:border-primary-400"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-400">{activeRecs.length} {t('recs.count')}</span>
            {doneRecs.length > 0 && (
              <button
                onClick={() => setShowImplemented(s => !s)}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                {showImplemented ? <EyeOff size={11} /> : <Eye size={11} />}
                {showImplemented
                  ? (vi ? 'Ẩn đã triển khai' : 'Hide implemented')
                  : (vi ? `Đã triển khai (${doneRecs.length})` : `Implemented (${doneRecs.length})`)}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cards grid */}
      {activeRecs.length === 0 && doneRecs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-sm">{t('recs.noMatch')}</p>
        </div>
      ) : activeRecs.length === 0 && !showImplemented ? (
        <div className="text-center py-16 text-slate-400">
          <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-300" />
          <p className="text-sm font-semibold text-emerald-600">
            {vi ? 'Tất cả đã được triển khai!' : 'All recommendations implemented!'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              onClick={() => setShowImplemented(true)}
              className="text-xs text-emerald-600 underline"
            >
              {vi ? `Xem ${doneRecs.length} đã triển khai` : `View ${doneRecs.length} implemented`}
            </button>
            <span className="text-slate-300">·</span>
            <button onClick={clearAll} className="text-xs text-slate-400 underline">
              {vi ? 'Đặt lại' : 'Reset'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          >
            {visibleRecs.map(rec => (
              <motion.div
                key={rec.id}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                className={implementedIds.has(rec.id) ? 'opacity-60' : ''}
              >
                <RecommendationCard rec={rec} isLive={isLive} onImplemented={markImplemented} />
              </motion.div>
            ))}
          </motion.div>
          {doneRecs.length > 0 && showImplemented && (
            <div className="flex justify-center">
              <button onClick={clearAll} className="text-xs text-slate-400 hover:text-slate-600 underline">
                {vi ? 'Đặt lại tất cả trạng thái' : 'Reset all to pending'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Combined impact summary */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl p-6 text-white">
        <h3 className="font-bold text-lg mb-1">{t('recs.combinedImpact')}</h3>
        <p className="text-primary-200 text-sm mb-4">
          {isLive
            ? (vi ? `Ước tính khi thực hiện toàn bộ ${liveRecs.length} khuyến nghị trên ${metrics.length} chi nhánh` : `Estimated impact when all ${liveRecs.length} recommendations across ${metrics.length} branches are implemented`)
            : t('recs.combinedSub')}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {impactMetrics.map(m => (
            <div key={m.val} className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-extrabold text-accent mb-1">{m.val}</div>
              <div className="text-xs text-primary-200">{m.label}</div>
            </div>
          ))}
        </div>
        {isLive && (
          <p className="text-[11px] text-primary-300 mt-3">
            {vi
              ? `Tính từ điểm sức khỏe hiện tại ${chainStats.avgHealthScore}/100 · Ước tính bảo thủ dựa trên dữ liệu ${chainStats.totalReviews} đánh giá`
              : `Based on current chain health ${chainStats.avgHealthScore}/100 · Conservative estimates from ${chainStats.totalReviews} reviews`}
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default function RecommendationsPage() {
  return (
    <Suspense>
      <RecommendationsInner />
    </Suspense>
  )
}
