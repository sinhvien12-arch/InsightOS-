'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  AreaChart, Area,
} from 'recharts'
import { Download, LayoutDashboard, Brain, Target, GitCompare, TrendingUp, FileText, RefreshCw } from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { useRouter } from 'next/navigation'
import { UploadCloud } from 'lucide-react'
import { branches as demoBranches, chainStats as demoChainStats } from '@/data/branches'
import { getPainPointCounts, getTrendData, reviews as demoReviews } from '@/data/reviews'
import { useLiveData } from '@/lib/useLiveData'
import { trendData as liveTrendData, painPointCounts as livePainPoints, platformCounts as livePlatforms } from '@/lib/aggregate'

type Tab = 'overview' | 'sentiment' | 'pain' | 'compare' | 'trends' | 'exec'

const TABS: { id: Tab; labelKey: string; icon: React.ElementType }[] = [
  { id: 'overview',  labelKey: 'analytics.overview',  icon: LayoutDashboard },
  { id: 'sentiment', labelKey: 'analytics.sentiment', icon: Brain            },
  { id: 'pain',      labelKey: 'analytics.pain',      icon: Target           },
  { id: 'compare',   labelKey: 'analytics.compare',   icon: GitCompare       },
  { id: 'trends',    labelKey: 'analytics.trends',    icon: TrendingUp       },
  { id: 'exec',      labelKey: 'analytics.exec',      icon: FileText         },
]

const SENTIMENT_COLORS = { Positive: '#10b981', Neutral: '#94a3b8', Negative: '#ef4444' }

export default function AnalyticsPage() {
  const { t, lang } = useLang()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [dateRange, setDateRange] = useState('30')
  const [exported,  setExported]  = useState(false)

  const { mode, branches: liveBranches, chainStats: liveChain, reviews: liveReviews, refresh } = useLiveData()
  const isLive = mode === 'live'
  const isRefreshing = mode === 'checking'
  const branches   = isLive ? liveBranches : demoBranches
  const chainStats = isLive ? liveChain    : demoChainStats

  const trendData  = isLive ? liveTrendData(liveReviews, parseInt(dateRange)) : getTrendData(parseInt(dateRange) > 30 ? 30 : parseInt(dateRange))
  const painData   = isLive ? livePainPoints(liveReviews) : getPainPointCounts()

  // Branch comparison data
  const compareData = branches.map(b => ({
    name:    b.name.replace('Phê La ', ''),
    health:  b.healthScore,
    rating:  b.avgRating * 20,
    positive: b.sentiment.positive,
    negative: b.sentiment.negative,
    reviews: b.reviewCount,
  }))

  // Sentiment by branch donut data
  const sentimentData = branches.map(b => ({
    name:    b.name.replace('Phê La ', '').slice(0, 8),
    positive: b.sentiment.positive,
    neutral:  b.sentiment.neutral,
    negative: b.sentiment.negative,
  }))

  // Platform distribution
  let platformData: { name: string; value: number }[]
  if (isLive) {
    platformData = livePlatforms(liveReviews)
  } else {
    const platforms: Record<string, number> = {}
    demoReviews.forEach(r => { platforms[r.platform] = (platforms[r.platform] ?? 0) + 1 })
    platformData = Object.entries(platforms).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }
  const PIE_COLORS = ['#0F766E','#14B8A6','#2DD4BF','#5EEAD4','#99F6E4','#F59E0B','#FCD34D']

  function priorityFromHealth(score: number) {
    if (score < 50) return 'Critical'
    if (score < 65) return 'High'
    if (score < 80) return 'Medium'
    return 'Low'
  }

  function recommendedAction(painPoint: string) {
    const map: Record<string, string> = {
      WaitingTime:     'Add one barista during peak hours.',
      ServiceQuality:  'Staff retraining and service audit.',
      ProductQuality:  'Increase inventory planning and quality checks.',
      Delivery:        'Activate real-time order tracking notifications.',
      Environment:     'Improve seating arrangement and store layout.',
      Pricing:         'Review promotions and value bundles.',
      Seating:         'Reconfigure floor plan to increase seating capacity.',
    }
    return map[painPoint] ?? 'Conduct operations review.'
  }

  function expectedImprovement(priority: string) {
    const map: Record<string, string> = {
      Critical: '+15 satisfaction points',
      High:     '+10 satisfaction points',
      Medium:   '+6 satisfaction points',
      Low:      '+3 satisfaction points',
    }
    return map[priority] ?? '+5 satisfaction points'
  }

  function handleExport() {
    const now = new Date()
    const generatedAt = now.toISOString().slice(0, 16).replace('T', ' ')
    const dateStr = now.toISOString().slice(0, 10)

    const header = [
      'Branch',
      'Health Score',
      'Priority Level',
      'Total Reviews',
      'Positive Sentiment %',
      'Negative Sentiment %',
      'Average Rating',
      'Top Pain Point',
      'Trend vs Last Month',
      'Recommended Action',
      'Expected Improvement',
      'Generated At',
    ]

    const rows = branches.map(b => {
      const priority = priorityFromHealth(b.healthScore)
      const trend = b.healthScore - b.prevScore
      const trendStr = trend >= 0 ? `+${trend} pts` : `${trend} pts`
      const topPain = b.topPainPoints[0]?.key ?? 'Other'
      return [
        b.name,
        `${b.healthScore}/100`,
        priority,
        b.reviewCount,
        `${b.sentiment.positive}%`,
        `${b.sentiment.negative}%`,
        `${b.avgRating}★`,
        b.topPainPoints[0]?.label ?? '',
        trendStr,
        recommendedAction(topPain),
        expectedImprovement(priority),
        generatedAt,
      ]
    })

    const csv = [header, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `phela-executive-action-report-${dateStr}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExported(true)
    setTimeout(() => setExported(false), 3000)
  }

  if (mode === 'empty') {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
          <UploadCloud size={28} className="text-slate-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">{lang === 'vi' ? 'Chưa có dữ liệu phân tích' : 'No analytics data yet'}</h2>
          <p className="text-sm text-slate-500">{lang === 'vi' ? 'Tải lên CSV để xem phân tích trực tiếp.' : 'Upload a CSV to see live analytics.'}</p>
        </div>
        <button onClick={() => router.push('/upload')} className="bg-slate-900 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-colors">
          {lang === 'vi' ? 'Tải dữ liệu lên' : 'Upload Data'}
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('analytics.title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {t('analytics.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <button
              onClick={refresh}
              disabled={isRefreshing}
              title={lang === 'vi' ? 'Làm mới dữ liệu' : 'Refresh data'}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-primary-700 hover:border-primary-200 transition-all disabled:opacity-50"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? (lang === 'vi' ? 'Đang tải...' : 'Loading...') : (lang === 'vi' ? 'Làm mới' : 'Refresh')}
            </button>
          )}
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-slate-600 font-medium focus:outline-none"
          >
            <option value="7">{t('analytics.last7')}</option>
            <option value="30">{t('analytics.last30')}</option>
            <option value="90">{t('analytics.last90')}</option>
          </select>
          <button
            onClick={handleExport}
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
              exported
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50'
            }`}
          >
            <Download size={13} />
            {exported ? t('analytics.exportDone') : t('analytics.exportFull')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-100">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-700 bg-primary-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={14} />
              {t(tab.labelKey as Parameters<typeof t>[0])}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="p-5"
          >
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: t('analytics.customerReviews'),   val: String(chainStats.totalReviews ?? 0),     sub: t('analytics.hanoiBranches')  },
                    { label: t('analytics.chainAvgRating'),    val: `${chainStats.avgRating ?? 0}★`,          sub: t('analytics.fiveBranches')   },
                    { label: t('analytics.positiveSentiment'), val: `${chainStats.positivePct ?? 0}%`,        sub: t('analytics.vsTarget')       },
                    { label: t('analytics.criticalBranchCount'), val: String(branches.filter(b => b.healthScore < 50).length), sub: t('analytics.fiveBranches') },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                      <p className="text-2xl font-bold text-slate-800">{s.val}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    {t('analytics.sentimentTrend7')}
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="pos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="neg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.08)', fontSize: '12px' }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" dataKey="positive" stroke="#10b981" fill="url(#pos)" strokeWidth={2} />
                      <Area type="monotone" dataKey="negative" stroke="#ef4444" fill="url(#neg)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* SENTIMENT TAB */}
            {activeTab === 'sentiment' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Sentiment by branch */}
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-3">
                      {t('analytics.sentimentByBranch')}
                    </p>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={sentimentData} layout="vertical" margin={{ left: 60, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={60} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.08)', fontSize: '12px' }} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="positive" name={t('positive')} stackId="a" fill="#10b981" />
                        <Bar dataKey="neutral"  name={t('neutral')}  stackId="a" fill="#94a3b8" />
                        <Bar dataKey="negative" name={t('negative')} stackId="a" fill="#ef4444" radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Platform distribution */}
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-3">
                      {t('analytics.reviewSources')}
                    </p>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={platformData} cx="50%" cy="50%" outerRadius={80} dataKey="value" strokeWidth={0}>
                          {platformData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.08)', fontSize: '12px' }} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* PAIN POINTS TAB */}
            {activeTab === 'pain' && (
              <div className="space-y-5">
                <p className="text-sm font-semibold text-slate-700">
                  {t('analytics.painFreq')}
                </p>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={painData} margin={{ top: 0, right: 16, left: 80, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="label" type="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.08)', fontSize: '12px' }} />
                    <Bar dataKey="count" name={t('analytics.reviewsLabel')} radius={[0,6,6,0]} maxBarSize={24}>
                      {painData.map((_, i) => <Cell key={i} fill={['#0F766E','#14B8A6','#2DD4BF','#5EEAD4','#99F6E4','#F59E0B','#FCD34D','#E2E8F0'][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* BRANCH COMPARISON TAB */}
            {activeTab === 'compare' && (
              <div className="space-y-5">
                <p className="text-sm font-semibold text-slate-700">
                  {t('analytics.performanceCompare')}
                </p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={compareData} margin={{ top: 0, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.08)', fontSize: '12px' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="health"   name={t('analytics.healthScoreLabel')} fill="#0F766E" radius={[4,4,0,0]} maxBarSize={32} />
                    <Bar dataKey="positive" name={t('analytics.positivePercent')}   fill="#10b981" radius={[4,4,0,0]} maxBarSize={32} />
                    <Bar dataKey="negative" name={t('analytics.negativePercent')}   fill="#ef4444" radius={[4,4,0,0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>

                {/* Branch table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {[
                          t('analytics.colBranch'), t('analytics.colHealth'), t('analytics.colRating'),
                          t('analytics.colReviews'), t('analytics.colPositive'), t('analytics.colNegative'), t('analytics.colIssues'),
                        ].map(h => (
                          <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {branches.map(b => (
                        <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2.5 px-3 text-xs font-medium text-primary-700">{b.name.replace('Phê La ', '')}</td>
                          <td className="py-2.5 px-3 text-xs font-bold text-slate-700">{b.healthScore}/100</td>
                          <td className="py-2.5 px-3 text-xs text-amber-500">{'★'.repeat(Math.round(b.avgRating))} {b.avgRating}</td>
                          <td className="py-2.5 px-3 text-xs text-slate-600">{b.reviewCount}</td>
                          <td className="py-2.5 px-3 text-xs text-emerald-600 font-medium">{b.sentiment.positive}%</td>
                          <td className="py-2.5 px-3 text-xs text-red-500 font-medium">{b.sentiment.negative}%</td>
                          <td className="py-2.5 px-3 text-xs text-slate-600">{b.issueCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TRENDS TAB */}
            {activeTab === 'trends' && (
              <div className="space-y-5">
                <p className="text-sm font-semibold text-slate-700">
                  {t('analytics.sentimentTrends')}
                </p>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.08)', fontSize: '12px' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="positive" name={t('positive')} stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="neutral"  name={t('neutral')}  stroke="#94a3b8" strokeWidth={2}   dot={false} activeDot={{ r: 4 }} strokeDasharray="4 2" />
                    <Line type="monotone" dataKey="negative" name={t('negative')} stroke="#ef4444" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* EXECUTIVE SUMMARY TAB */}
            {activeTab === 'exec' && (
              <div className="space-y-5 max-w-3xl">
                <div className="bg-gradient-to-br from-primary-900 to-primary-700 rounded-2xl p-6 text-white">
                  <div className="text-xs font-bold uppercase tracking-widest text-primary-200 mb-2">{t('analytics.execHeader')}</div>
                  <h2 className="text-xl font-bold mb-4">Phê La Chain — {t('analytics.juneReport')}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { val: `${chainStats.avgHealthScore ?? 0}/100`,            label: t('analytics.chainHealth')      },
                      { val: `${chainStats.negativePct ?? 0}%`,                  label: t('analytics.negativeReviews')  },
                      { val: String(chainStats.totalReviews ?? 0),              label: t('analytics.reviewsAnalyzed')  },
                      { val: String(branches.filter(b => b.healthScore < 50).length), label: t('analytics.criticalDanger') },
                    ].map(s => (
                      <div key={s.val} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                        <div className="text-xl font-extrabold text-accent">{s.val}</div>
                        <div className="text-xs text-primary-200 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {isLive ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 text-sm text-slate-500 leading-relaxed">
                    {lang === 'vi'
                      ? 'Tóm tắt điều hành dạng văn bản chỉ áp dụng cho dữ liệu mẫu. Các số liệu phía trên được tính trực tiếp từ dữ liệu bạn đã tải lên.'
                      : 'The narrative executive summary applies to demo data only. The figures above are computed directly from your uploaded data.'}
                  </div>
                ) : (
                <div className="space-y-3">
                  {[
                    {
                      title: lang === 'vi' ? '1. Vấn đề hàng đầu — Thời gian chờ đợi' : '1. Top Issue — Waiting Time',
                      body: lang === 'vi'
                        ? 'Phàn nàn về thời gian chờ chiếm 28% tổng đánh giá (142 lượt). Trần Quốc Hoàn là tâm điểm với tỷ lệ 45% (25/55 đánh giá), tiếp theo là Thanh Thái 41% (23/56 đánh giá), đặc biệt trong giờ cao điểm 11:30am–1:30pm và 5:30–7:30pm.'
                        : 'Waiting time complaints account for 28% of all reviews (142 mentions). Trần Quốc Hoàn is the epicenter at 45% complaint rate (25/55 reviews), followed by Thanh Thái at 41% (23/56 reviews). Peak windows: 11:30am–1:30pm and 5:30–7:30pm.',
                    },
                    {
                      title: lang === 'vi' ? '2. Chi nhánh khẩn cấp — Thanh Thái' : '2. Critical Branch — Thanh Thái',
                      body: lang === 'vi'
                        ? 'Với điểm sức khỏe 43/100 và 75% cảm xúc tiêu cực, Thanh Thái cần can thiệp khẩn cấp ngay. Điểm đánh giá trung bình thấp nhất chuỗi (1.93★). Chất lượng dịch vụ và thời gian chờ là nguyên nhân chính.'
                        : 'With a health score of 43/100 and 75% negative sentiment, Thanh Thái requires immediate intervention. Lowest average rating in the chain (1.93★). Service quality and waiting time are the primary drivers.',
                    },
                    {
                      title: lang === 'vi' ? '3. Điểm sáng — Nguyễn Văn Cừ' : '3. Bright Spot — Nguyễn Văn Cừ',
                      body: lang === 'vi'
                        ? 'Đạt 78/100 điểm sức khỏe và 60% cảm xúc tích cực (+6 điểm trong tháng). Điểm đánh giá cao nhất chuỗi (3.42★). Mô hình thành công — xác nhận đơn hàng chủ động, lịch ca nhất quán, kiểm tra chất lượng tuần — cần nhân rộng ra Thanh Thái và Trần Quốc Hoàn.'
                        : 'Achieving 78/100 health score and 60% positive sentiment (+6 pts this month). Highest rating in the chain (3.42★). Success model — proactive order confirmation, consistent shift scheduling, weekly quality check — should be replicated at Thanh Thái and Trần Quốc Hoàn.',
                    },
                    {
                      title: lang === 'vi' ? '4. Khuyến nghị ưu tiên' : '4. Priority Recommendation',
                      body: lang === 'vi'
                        ? 'Khởi động phục hồi dịch vụ khẩn cấp tại Thanh Thái (mục tiêu: sức khỏe 43 → 60 trong 30 ngày) và thêm 1 barista ca cao điểm tại Trần Quốc Hoàn và Thanh Thái (tác động: -40% phàn nàn chờ đợi). Hai hành động này kết hợp dự kiến nâng điểm sức khỏe chuỗi từ 55 lên 65+ trong 30 ngày.'
                        : 'Initiate emergency service recovery at Thanh Thái (target: health 43 → 60 in 30 days) and add 1 peak-hour barista at Trần Quốc Hoàn and Thanh Thái (impact: -40% wait complaints). Combined, these two actions are projected to raise chain health score from 55 to 65+ within 30 days.',
                    },
                  ].map((item, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                      <h3 className="text-sm font-bold text-slate-800 mb-2">{item.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.body}</p>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
