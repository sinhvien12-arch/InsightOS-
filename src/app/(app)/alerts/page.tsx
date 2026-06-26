'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle, Clock, Filter, UploadCloud } from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { alerts as demoAlerts } from '@/data/alerts'
import AlertCard from '@/components/AlertCard'
import { branches as demoBranches } from '@/data/branches'
import { useLiveData } from '@/lib/useLiveData'

const fade = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

const SEVERITY_LABEL_VI: Record<string, string> = {
  All: 'Tất cả', High: 'Nghiêm trọng', Medium: 'Trung bình', Low: 'Thấp',
}

export default function AlertsPage() {
  const { t, lang } = useLang()
  const vi = lang === 'vi'
  const router = useRouter()
  const [severity, setSeverity] = useState<string>('All')
  const [branchFilter, setBranchFilter] = useState<string>('All')

  const { mode, alerts: liveAlerts, branches: liveBranches } = useLiveData()
  const isLive   = mode === 'live'
  const alerts   = isLive ? liveAlerts   : demoAlerts
  const branches = isLive ? liveBranches.map(b => ({ id: b.id, name: b.name }))
                          : demoBranches.map(b => ({ id: b.id, name: b.name }))

  if (mode === 'empty') {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-5 text-center">
        <UploadCloud size={36} className="text-slate-300" />
        <div>
          <h2 className="text-xl font-bold text-slate-800">{vi ? 'Chưa có cảnh báo' : 'No alerts yet'}</h2>
          <p className="text-sm text-slate-500 mt-1">{vi ? 'Tải dữ liệu lên để xem cảnh báo trực tiếp.' : 'Upload data to see live alerts.'}</p>
        </div>
        <button onClick={() => router.push('/upload')} className="bg-slate-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl">
          {vi ? 'Tải dữ liệu lên' : 'Upload Data'}
        </button>
      </div>
    )
  }

  const severities = ['All', 'High', 'Medium', 'Low']

  const filtered = alerts.filter(a => {
    const matchSeverity = severity === 'All' || a.severity === severity
    const matchBranch   = branchFilter === 'All' || a.branchId === branchFilter || (branchFilter === 'chain' && !a.branchId)
    return matchSeverity && matchBranch
  })

  const counts = {
    High:   alerts.filter(a => a.severity === 'High').length,
    Medium: alerts.filter(a => a.severity === 'Medium').length,
    Low:    alerts.filter(a => a.severity === 'Low').length,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle size={22} className="text-red-500" />
            {t('alerts.title')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('alerts.subtitle')}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-500 font-medium">{t('alerts.liveMonitoring')}</span>
        </div>
      </div>

      {/* Severity summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: vi ? SEVERITY_LABEL_VI.High   : 'High',   count: counts.High,   color: 'bg-red-50 border-red-200 text-red-700',    dot: 'bg-red-500'    },
          { label: vi ? SEVERITY_LABEL_VI.Medium : 'Medium', count: counts.Medium, color: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-500'  },
          { label: vi ? SEVERITY_LABEL_VI.Low    : 'Low',    count: counts.Low,    color: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-xs font-semibold uppercase tracking-wide">{s.label}</span>
            </div>
            <div className="text-3xl font-extrabold">{s.count}</div>
            <div className="text-xs opacity-70 mt-0.5">{t('alerts.alertsLabel')}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter size={14} className="text-slate-400" />

        {/* Severity filter */}
        <div className="flex items-center gap-1">
          {severities.map(s => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                severity === s
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50'
              }`}
            >
              {vi ? SEVERITY_LABEL_VI[s] : s}
            </button>
          ))}
        </div>

        {/* Branch filter */}
        <select
          value={branchFilter}
          onChange={e => setBranchFilter(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-slate-600 focus:outline-none"
        >
          <option value="All">{t('alerts.allBranches')}</option>
          <option value="chain">{t('alerts.chainWide')}</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.name.replace('Phê La ', '')}</option>
          ))}
        </select>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <CheckCircle size={40} className="mb-3 text-emerald-300" />
            <p className="font-semibold">{t('alerts.noAlerts')}</p>
          </div>
        ) : (
          filtered.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <AlertCard alert={alert} />
            </motion.div>
          ))
        )}
      </div>

      {/* Timeline note */}
      <div className="flex items-center gap-2 text-xs text-slate-400 pb-4">
        <Clock size={12} />
        <span>
          {t('alerts.autoGenerated')}
        </span>
      </div>
    </motion.div>
  )
}
