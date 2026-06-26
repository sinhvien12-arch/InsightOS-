'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  CircleDot, ArrowRight, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronUp, AlertTriangle, UploadCloud,
} from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { issues as demoIssues, issueStats } from '@/data/issues'
import { getActionsForIssue } from '@/data/actions'
import type { IssueStatus, Priority } from '@/data/types'
import { useLiveData } from '@/lib/useLiveData'

const fade    = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.07 } } }

const PRIORITY_BADGE: Record<Priority, string> = {
  Critical: 'bg-red-100 text-red-700 border border-red-200',
  High:     'bg-orange-100 text-orange-700 border border-orange-200',
  Medium:   'bg-amber-100 text-amber-700 border border-amber-200',
  Low:      'bg-slate-100 text-slate-600 border border-slate-200',
}

const STATUS_BADGE: Record<IssueStatus, string> = {
  'Open':        'bg-red-50 text-red-600 border border-red-100',
  'In Progress': 'bg-blue-50 text-blue-600 border border-blue-100',
  'Monitoring':  'bg-amber-50 text-amber-600 border border-amber-100',
  'Resolved':    'bg-emerald-50 text-emerald-600 border border-emerald-100',
}

const CATEGORY_LABEL_EN: Record<string, string> = {
  WaitingTime:    'Waiting Time',
  ServiceQuality: 'Service Quality',
  ProductQuality: 'Product Quality',
  Delivery:       'Delivery',
  Environment:    'Environment',
  Pricing:        'Pricing',
  Seating:        'Seating',
  Other:          'Other',
}
const CATEGORY_LABEL_VI: Record<string, string> = {
  WaitingTime:    'Thời gian chờ',
  ServiceQuality: 'Chất lượng DV',
  ProductQuality: 'Chất lượng SP',
  Delivery:       'Giao hàng',
  Environment:    'Không gian',
  Pricing:        'Giá cả',
  Seating:        'Chỗ ngồi',
  Other:          'Khác',
}
const PRIORITY_LABEL_VI: Record<string, string> = {
  Critical: 'Nghiêm trọng', High: 'Cao', Medium: 'Trung bình', Low: 'Thấp',
}
const STATUS_LABEL_VI: Record<string, string> = {
  'Open': 'Mở', 'In Progress': 'Đang xử lý', 'Monitoring': 'Theo dõi', 'Resolved': 'Đã giải quyết',
}

type FilterStatus = IssueStatus | 'All'

export default function IssuesPage() {
  const { lang, t } = useLang()
  const router   = useRouter()
  const vi       = lang === 'vi'

  const { mode, issues: liveIssues } = useLiveData()
  const isLive = mode === 'live'
  const issues = isLive ? liveIssues : demoIssues

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All')
  const [expandedId,   setExpandedId]   = useState<string | null>(null)

  if (mode === 'empty') {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-5 text-center">
        <UploadCloud size={36} className="text-slate-300" />
        <div>
          <h2 className="text-xl font-bold text-slate-800">{vi ? 'Chưa có vấn đề nào' : 'No issues yet'}</h2>
          <p className="text-sm text-slate-500 mt-1">{vi ? 'Tải dữ liệu lên để phát hiện vấn đề tự động.' : 'Upload data to auto-detect issues.'}</p>
        </div>
        <button onClick={() => router.push('/upload')} className="bg-slate-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl">
          {vi ? 'Tải dữ liệu lên' : 'Upload Data'}
        </button>
      </div>
    )
  }

  const filtered = statusFilter === 'All'
    ? issues
    : issues.filter(i => i.status === statusFilter)

  const liveStats = isLive
    ? { total: issues.length, open: issues.filter(i => i.status === 'Open').length, inProgress: 0, monitoring: 0, resolved: 0 }
    : issueStats

  const STATUS_TABS: { label: string; value: FilterStatus; count: number }[] = [
    { label: t('common.all'),         value: 'All',         count: liveStats.total      },
    { label: t('issues.open'),        value: 'Open',        count: liveStats.open       },
    { label: t('issues.inProgress'),  value: 'In Progress', count: liveStats.inProgress },
    { label: t('issues.monitoring'),  value: 'Monitoring',  count: liveStats.monitoring },
    { label: t('issues.resolved'),    value: 'Resolved',    count: liveStats.resolved   },
  ]

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div variants={fade} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <CircleDot size={20} className="text-red-500" />
            <h1 className="text-2xl font-bold text-slate-900">
              {t('issues.title')}
            </h1>
          </div>
          <p className="text-slate-500 text-sm">
            {t('issues.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-center min-w-[80px]">
            <div className="text-2xl font-extrabold text-red-700">{issueStats.critical}</div>
            <div className="text-[10px] text-red-500 font-semibold">{t('critical')}</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 text-center min-w-[80px]">
            <div className="text-2xl font-extrabold text-orange-700">{issueStats.open + issueStats.inProgress}</div>
            <div className="text-[10px] text-orange-500 font-semibold">{vi ? 'Đang mở' : 'Active'}</div>
          </div>
        </div>
      </motion.div>

      {/* Status filter tabs */}
      <motion.div variants={fade} className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              statusFilter === tab.value
                ? 'bg-primary-700 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-slate-600 hover:border-primary-300 hover:text-primary-700'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              statusFilter === tab.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-slate-500'
            }`}>{tab.count}</span>
          </button>
        ))}
      </motion.div>

      {/* Issue list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-slate-400">
            {t('issues.noIssues')}
          </div>
        )}

        {filtered.map((issue, i) => {
          const expanded = expandedId === issue.id
          const linkedActions = getActionsForIssue(issue.id)

          return (
            <motion.div key={issue.id} variants={fade} transition={{ delay: i * 0.05 }}>
              <div className={`bg-white rounded-2xl border shadow-card overflow-hidden transition-all ${
                issue.priority === 'Critical' ? 'border-red-200' : 'border-gray-100'
              }`}>
                {/* Issue header — always visible */}
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : issue.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[11px] font-mono text-slate-400 font-bold">{issue.code}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[issue.priority]}`}>
                          {issue.priority === 'Critical' && <AlertTriangle size={10} className="inline mr-0.5" />}
                          {vi ? PRIORITY_LABEL_VI[issue.priority] : issue.priority}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[issue.status]}`}>
                          {vi ? STATUS_LABEL_VI[issue.status] : issue.status}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                          {vi ? CATEGORY_LABEL_VI[issue.category] : CATEGORY_LABEL_EN[issue.category]}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-800">{vi ? (issue.titleVi ?? issue.title) : issue.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{vi ? (issue.descriptionVi ?? issue.description) : issue.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xl font-extrabold text-slate-800">{issue.reviewCount}</div>
                        <div className="text-[10px] text-slate-400">{t('issues.reviewCount')}</div>
                      </div>
                      <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg ${
                        issue.trend === 'Rising' ? 'text-red-600 bg-red-50' :
                        issue.trend === 'Falling' ? 'text-emerald-600 bg-emerald-50' :
                        'text-slate-500 bg-slate-50'
                      }`}>
                        {issue.trend === 'Rising'  && <TrendingUp size={11} />}
                        {issue.trend === 'Falling' && <TrendingDown size={11} />}
                        {issue.trend === 'Stable'  && <Minus size={11} />}
                        {issue.trend === 'Rising' ? t('dash.rising') : issue.trend === 'Falling' ? t('dash.falling') : t('dash.stable')}
                      </div>
                      {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-gray-100 p-5 space-y-5 bg-gray-50/50">
                    {/* Root causes */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('issues.rootCauses')}
                      </h4>
                      <ul className="space-y-1">
                        {(vi ? (issue.rootCausesVi ?? issue.rootCauses) : issue.rootCauses).map((rc, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                            {rc}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Business impact */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t('issues.impact')}
                      </h4>
                      <p className="text-sm text-slate-600">{vi ? (issue.businessImpactVi ?? issue.businessImpact) : issue.businessImpact}</p>
                    </div>

                    {/* Before / After metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                        <h5 className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2">
                          {t('issues.before')}
                        </h5>
                        {issue.beforeMetrics.map((m, j) => (
                          <div key={j} className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-500">{vi ? (m.labelVi ?? m.label) : m.label}</span>
                            <span className="font-bold text-red-700">{m.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                        <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">
                          {t('issues.after')}
                        </h5>
                        {issue.afterMetrics.map((m, j) => (
                          <div key={j} className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-500">{vi ? (m.labelVi ?? m.label) : m.label}</span>
                            <span className="font-bold text-emerald-700">{m.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Affected branches */}
                    {issue.affectedBranches.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          {t('issues.affected')}
                        </h4>
                        <div className="flex gap-2 flex-wrap">
                          {issue.affectedBranches.map(bid => (
                            <button
                              key={bid}
                              onClick={() => router.push(`/branch/${bid}`)}
                              className="text-xs font-semibold text-primary-700 bg-primary-50 border border-primary-200 px-2.5 py-1 rounded-lg hover:bg-primary-100 transition-colors"
                            >
                              {bid.toUpperCase()} <ArrowRight size={10} className="inline ml-0.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Linked actions */}
                    {linkedActions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          {t('issues.actions')} ({linkedActions.length})
                        </h4>
                        <div className="space-y-2">
                          {linkedActions.map(action => (
                            <div key={action.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between">
                              <div>
                                <div className="text-xs font-semibold text-slate-700">{vi ? (action.titleVi ?? action.title) : action.title}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{action.owner}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-xs font-bold text-slate-500">{action.progress}%</div>
                                <button
                                  onClick={() => router.push('/actions')}
                                  className="text-[10px] font-bold text-primary-600 bg-primary-50 border border-primary-200 px-2 py-1 rounded-lg hover:bg-primary-100 transition-colors"
                                >
                                  {vi ? 'Xem' : 'View'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
