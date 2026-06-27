'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutDashboard, MessageSquare, HeartPulse, ThumbsUp, AlertOctagon, UploadCloud, RefreshCw } from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { useLiveData } from '@/lib/useLiveData'
import { painPointCounts, trendData } from '@/lib/aggregate'
import { branches as demoBranches, chainStats as demoChainStats } from '@/data/branches'
import { alerts as demoAlerts } from '@/data/alerts'
import { getSentimentCounts, getTrendData, getPainPointCounts } from '@/data/reviews'
import StatCard from '@/components/ui/StatCard'
import SentimentDonut from '@/components/charts/SentimentDonut'
import TrendLineChart from '@/components/charts/TrendLineChart'
import PainPointBar from '@/components/charts/PainPointBar'
import AlertCard from '@/components/AlertCard'
import BranchHealthGauge from '@/components/BranchHealthGauge'
import { priorityFromHealth, priorityColor } from '@/lib/utils'

const fade    = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.06 } } }

function painsFromBranches(branches: { topPainPoints: { key: string; label: string; count: number }[] }[]) {
  const map = new Map<string, { key: string; label: string; count: number }>()
  for (const b of branches) {
    for (const p of b.topPainPoints) {
      const cur = map.get(p.key)
      if (cur) cur.count += p.count
      else map.set(p.key, { key: p.key, label: p.label, count: p.count })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count)
}

export default function DashboardPage() {
  const { lang } = useLang()
  const vi = lang === 'vi'
  const router = useRouter()

  const { mode, metrics, branches: liveBranches, alerts: liveAlerts, chainStats: liveChain, reviews: liveReviews, refresh } = useLiveData()
  const isLive = mode === 'live'
  const isRefreshing = mode === 'checking'

  if (mode === 'empty') {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
          <UploadCloud size={28} className="text-slate-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">{vi ? 'Chưa có dữ liệu' : 'No data yet'}</h2>
          <p className="text-sm text-slate-500">{vi ? 'Tải lên CSV đánh giá để dựng dashboard trực tiếp.' : 'Upload a reviews CSV to build your live dashboard.'}</p>
        </div>
        <button onClick={() => router.push('/upload')} className="bg-slate-900 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-colors">
          {vi ? 'Tải dữ liệu lên' : 'Upload Data'}
        </button>
      </div>
    )
  }

  const branches   = isLive ? liveBranches : demoBranches
  const alerts     = isLive ? liveAlerts   : demoAlerts
  const chain      = isLive ? liveChain    : demoChainStats

  const sentiment = isLive
    ? {
        positive: metrics.reduce((s, m) => s + m.positive_count, 0),
        neutral:  metrics.reduce((s, m) => s + m.neutral_count,  0),
        negative: metrics.reduce((s, m) => s + m.negative_count, 0),
      }
    : getSentimentCounts()

  const trend = isLive
    ? trendData(liveReviews)
    : getTrendData(7)

  const pains = isLive
    ? (liveReviews.length ? painPointCounts(liveReviews) : painsFromBranches(liveBranches))
    : getPainPointCounts()

  const criticalCount = branches.filter(b => b.healthScore < 60).length
  const topAlerts = alerts.slice(0, 4)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <motion.div variants={fade} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard size={20} className="text-primary-600" />
            {vi ? 'Trung tâm Điều hành' : 'Command Center'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {vi ? 'Tổng quan sức khỏe chuỗi từ dữ liệu đánh giá' : 'Chain health overview from review data'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <button
              onClick={refresh}
              disabled={isRefreshing}
              title={vi ? 'Làm mới dữ liệu' : 'Refresh data'}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-primary-700 hover:border-primary-200 transition-all disabled:opacity-50"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
              {vi ? 'Làm mới' : 'Refresh'}
            </button>
          )}
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border ${
            isLive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {isRefreshing
              ? (vi ? 'Đang tải...' : 'Loading...')
              : isLive
                ? (vi ? 'Dữ liệu trực tiếp' : 'Live data')
                : (vi ? 'Dữ liệu mẫu' : 'Demo data')}
          </span>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={fade} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={vi ? 'Đánh giá' : 'Reviews'} value={chain.totalReviews ?? 0} icon={<MessageSquare size={18} className="text-primary-600" />} accent />
        <StatCard label={vi ? 'Sức khỏe TB' : 'Avg Health'} value={chain.avgHealthScore ?? 0} sub="/100" icon={<HeartPulse size={18} className="text-primary-600" />} />
        <StatCard label={vi ? 'Tích cực' : 'Positive'} value={`${chain.positivePct ?? 0}%`} icon={<ThumbsUp size={18} className="text-primary-600" />} />
        <StatCard label={vi ? 'Chi nhánh khẩn cấp' : 'Critical Branches'} value={criticalCount} sub={`/ ${branches.length}`} icon={<AlertOctagon size={18} className="text-primary-600" />} />
      </motion.div>

      {/* Charts row */}
      <motion.div variants={fade} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h2 className="font-bold text-slate-800 text-sm mb-3">{vi ? 'Phân bố cảm xúc' : 'Sentiment Distribution'}</h2>
          <SentimentDonut positive={sentiment.positive} neutral={sentiment.neutral} negative={sentiment.negative} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h2 className="font-bold text-slate-800 text-sm mb-3">{vi ? 'Xu hướng cảm xúc' : 'Sentiment Trend'}</h2>
          {trend.length > 0 ? (
            <TrendLineChart data={trend} />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">
              {vi ? 'Không đủ dữ liệu theo ngày' : 'Not enough dated data'}
            </div>
          )}
        </div>
      </motion.div>

      {/* Pain points + Alerts */}
      <motion.div variants={fade} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h2 className="font-bold text-slate-800 text-sm mb-3">{vi ? 'Vấn đề hàng đầu' : 'Top Issues'}</h2>
          {pains.length > 0 ? (
            <PainPointBar data={pains} />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">
              {vi ? 'Chưa phát hiện vấn đề' : 'No issues detected'}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-800 text-sm">{vi ? 'Cảnh báo gần đây' : 'Recent Alerts'}</h2>
            <button onClick={() => router.push('/alerts')} className="text-xs font-semibold text-primary-700 hover:text-primary-600">
              {vi ? 'Xem tất cả' : 'View all'}
            </button>
          </div>
          <div className="space-y-2.5">
            {topAlerts.length > 0 ? topAlerts.map(a => <AlertCard key={a.id} alert={a} />) : (
              <p className="text-xs text-slate-400 py-8 text-center">{vi ? 'Không có cảnh báo' : 'No alerts'}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Branch health gauges */}
      <motion.div variants={fade} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <h2 className="font-bold text-slate-800 text-sm mb-4">{vi ? 'Sức khỏe theo chi nhánh' : 'Branch Health'}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {branches.map(b => {
            const p = priorityFromHealth(b.healthScore)
            return (
              <button key={b.id} onClick={() => router.push(`/branch/${b.id}`)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                <BranchHealthGauge score={b.healthScore} prevScore={b.prevScore} size="sm" />
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-800 leading-tight">{b.name.replace('Phê La ', '')}</div>
                  <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1 inline-block ${priorityColor(p)}`}>{p}</div>
                </div>
              </button>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
