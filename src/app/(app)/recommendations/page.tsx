'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Filter } from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { recommendations } from '@/data/recommendations'
import RecommendationCard from '@/components/RecommendationCard'
import type { Priority } from '@/data/types'

const PRIORITIES: Priority[] = ['High', 'Medium', 'Low']
const PRIORITY_VI: Record<string, string> = { High: 'Cao', Medium: 'Trung bình', Low: 'Thấp' }
const CATEGORIES = ['All', ...Array.from(new Set(recommendations.map(r => r.category)))]

export default function RecommendationsPage() {
  const { t, lang } = useLang()
  const [branch,   setBranch]   = useState('all')
  const [priority, setPriority] = useState<string>('all')
  const [category, setCategory] = useState('All')

  const branchOptions = [
    { id: 'all', name: t('rec.allBranches') },
    { id: 'nvc', name: 'Nguyễn Văn Cừ' },
    { id: 'nt',  name: 'Núi Trúc' },
    { id: 'tt',  name: 'Thanh Thái' },
    { id: 'tqh', name: 'Trần Quốc Hoàn' },
    { id: 'lvl', name: 'Lê Văn Lương' },
  ]

  const filtered = recommendations.filter(r => {
    const bMatch = branch === 'all'   || r.branchId === branch   || r.branchId === null
    const pMatch = priority === 'all' || r.priority === priority
    const cMatch = category === 'All' || r.category === category
    return bMatch && pMatch && cMatch
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('recs.title')}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('recs.subtitle')}</p>
      </div>

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
          <div className="flex gap-1.5">
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
                    ? p === 'High' ? 'bg-red-100 text-red-700 border-red-200'
                    : p === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200'
                    : 'bg-green-100 text-green-700 border-green-200'
                    : 'text-slate-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {lang === 'vi' ? PRIORITY_VI[p] : p}
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

          <span className="text-xs text-slate-400 ml-auto">
            {filtered.length} {t('recs.count')}
          </span>
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-sm">{t('recs.noMatch')}</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        >
          {filtered.map(rec => (
            <motion.div
              key={rec.id}
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            >
              <RecommendationCard rec={rec} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Impact summary */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl p-6 text-white">
        <h3 className="font-bold text-lg mb-2">{t('recs.combinedImpact')}</h3>
        <p className="text-primary-200 text-sm mb-4">{t('recs.combinedSub')}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { val: '+15 pts', label: t('recs.chainHealthScore') },
            { val: '-28%',    label: t('recs.waitComplaints')   },
            { val: '+18%',    label: t('recs.satisfaction')     },
            { val: '+8%',     label: t('recs.revenueImpact')    },
          ].map(m => (
            <div key={m.val} className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-extrabold text-accent mb-1">{m.val}</div>
              <div className="text-xs text-primary-200">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
