'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { MapPin, Search, UploadCloud, RefreshCw } from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { branches as demoBranches, chainStats as demoChainStats } from '@/data/branches'
import BranchCard from '@/components/BranchCard'
import BranchHealthGauge from '@/components/BranchHealthGauge'
import { priorityFromHealth, priorityColor } from '@/lib/utils'
import { useLiveData } from '@/lib/useLiveData'

const fade    = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.08 } } }

export default function BranchesPage() {
  const { t, lang } = useLang()
  const vi = lang === 'vi'
  const router   = useRouter()
  const [search, setSearch]       = useState('')
  const [sortBy, setSortBy]       = useState<'health' | 'rating' | 'issues'>('health')
  const [healthFilter, setFilter] = useState<string>('All')

  const { mode, branches: liveBranches, chainStats: liveChain, refresh } = useLiveData()
  const isLive      = mode === 'live'
  const isRefreshing = mode === 'checking'
  const branches    = isLive ? liveBranches  : demoBranches
  const chainStats  = isLive ? liveChain     : demoChainStats

  if (mode === 'empty') {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
          <UploadCloud size={28} className="text-slate-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">{vi ? 'Chưa có dữ liệu chi nhánh' : 'No branch data yet'}</h2>
          <p className="text-sm text-slate-500">{vi ? 'Tải lên CSV để xem dữ liệu trực tiếp.' : 'Upload a CSV to see live branch data.'}</p>
        </div>
        <button onClick={() => router.push('/upload')} className="bg-slate-900 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-colors">
          {vi ? 'Tải dữ liệu lên' : 'Upload Data'}
        </button>
      </div>
    )
  }

  const filtered = branches
    .filter(b => {
      const q = search.toLowerCase()
      const matchSearch = b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q)
      const p = priorityFromHealth(b.healthScore)
      const matchFilter = healthFilter === 'All' || p === healthFilter
      return matchSearch && matchFilter
    })
    .sort((a, b) => {
      if (sortBy === 'health')  return b.healthScore - a.healthScore
      if (sortBy === 'rating')  return b.avgRating - a.avgRating
      return b.issueCount - a.issueCount
    })

  const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low']

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={fade} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin size={20} className="text-primary-600" />
            {t('branches.title')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {t('branches.subtitle')}
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
              {isRefreshing ? (vi ? 'Đang tải...' : 'Loading...') : (vi ? 'Làm mới' : 'Refresh')}
            </button>
          )}
          <div className="text-xs text-slate-400 bg-white rounded-xl border border-gray-100 px-3 py-2">
            <span className="font-bold text-primary-700">{chainStats.totalReviews}</span>{' '}
            {t('branches.reviewsAvgHealth')}{' '}
            <span className="font-bold text-slate-700">{chainStats.avgHealthScore}/100</span>
          </div>
        </div>
      </motion.div>

      {/* Chain health overview */}
      <motion.div variants={fade} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {branches.map(b => {
          const p = priorityFromHealth(b.healthScore)
          return (
            <button
              key={b.id}
              onClick={() => router.push(`/branch/${b.id}`)}
              className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 flex flex-col items-center gap-2 hover:shadow-card-hover hover:-translate-y-0.5 transition-all text-left group"
            >
              <BranchHealthGauge score={b.healthScore} prevScore={b.prevScore} size="sm" />
              <div className="text-center">
                <div className="text-xs font-bold text-slate-800 leading-tight">{b.name.replace('Phê La ', '')}</div>
                <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1 inline-block ${priorityColor(p)}`}>
                  {p}
                </div>
              </div>
            </button>
          )
        })}
      </motion.div>

      {/* Filters */}
      <motion.div variants={fade} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('branches.search')}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>

        <div className="flex items-center gap-1">
          {PRIORITIES.map(p => {
            const label = p === 'All' ? t('common.all') : t(p.toLowerCase() as 'critical' | 'high' | 'medium' | 'low')
            return (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${
                  healthFilter === p
                    ? 'bg-primary-700 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-slate-600 focus:outline-none ml-auto"
        >
          <option value="health">{t('branches.sortHealth')}</option>
          <option value="rating">{t('branches.sortRating')}</option>
          <option value="issues">{t('branches.sortIssues')}</option>
        </select>
      </motion.div>

      {/* Branch grid */}
      <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {filtered.map((branch, i) => (
          <motion.div key={branch.id} variants={fade} transition={{ delay: i * 0.07 }}>
            <BranchCard branch={branch} />
          </motion.div>
        ))}
      </motion.div>

      {/* Branch detail table */}
      <motion.div variants={fade} className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-slate-800 text-sm">
            {t('branches.compareTable')}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  t('branches.colBranch'), t('branches.colHealth'), t('branches.colPriority'),
                  t('branches.colRating'), t('branches.colReviews'), t('branches.colPositive'),
                  t('branches.colNegative'), t('branches.colIssues'), t('branches.colManager'),
                ].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {branches.map(b => {
                const p = priorityFromHealth(b.healthScore)
                return (
                  <tr
                    key={b.id}
                    onClick={() => router.push(`/branch/${b.id}`)}
                    className="border-b border-gray-50 hover:bg-primary-50/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="text-xs font-bold text-primary-700">{b.name.replace('Phê La ', '')}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{b.address}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-extrabold text-slate-800">{b.healthScore}</span>
                      <span className="text-xs text-slate-400">/100</span>
                      <span className={`ml-1 text-xs ${b.healthScore >= b.prevScore ? 'text-emerald-500' : 'text-red-500'}`}>
                        {b.healthScore >= b.prevScore ? '↑' : '↓'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityColor(p)}`}>{p}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-amber-500 font-medium">{'★'.repeat(Math.round(b.avgRating))} {b.avgRating}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 font-medium">{b.reviewCount}</td>
                    <td className="py-3 px-4 text-xs text-emerald-600 font-bold">{b.sentiment.positive}%</td>
                    <td className="py-3 px-4 text-xs text-red-500 font-bold">{b.sentiment.negative}%</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{b.issueCount}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">{b.manager}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
