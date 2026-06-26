'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Zap, ArrowRight, User, Calendar, ChevronDown, ChevronUp, Clock, MessageSquare, BarChart2, Eye, Send } from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { useLiveData } from '@/lib/useLiveData'
import { actions, actionStats } from '@/data/actions'
import type { ActionStatus, Priority, ActionComment } from '@/data/types'

const fade    = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.07 } } }

const PRIORITY_BADGE: Record<Priority, string> = {
  Critical: 'bg-red-100 text-red-700 border border-red-200',
  High:     'bg-orange-100 text-orange-700 border border-orange-200',
  Medium:   'bg-amber-100 text-amber-700 border border-amber-200',
  Low:      'bg-slate-100 text-slate-600 border border-slate-200',
}

const STATUS_BADGE: Record<ActionStatus, string> = {
  'Pending':     'bg-slate-50 text-slate-500 border border-slate-200',
  'In Progress': 'bg-blue-50 text-blue-600 border border-blue-100',
  'Done':        'bg-emerald-50 text-emerald-600 border border-emerald-200',
  'Monitoring':  'bg-amber-50 text-amber-600 border border-amber-100',
}

const TIMELINE_DOT: Record<string, string> = {
  created:    'bg-red-400',
  assigned:   'bg-blue-400',
  progress:   'bg-amber-400',
  deployed:   'bg-purple-400',
  completed:  'bg-green-500',
  monitoring: 'bg-teal-400',
  improved:   'bg-emerald-500',
}

const MONITORING_STATUS_STYLE: Record<string, string> = {
  'Improving':       'bg-emerald-100 text-emerald-700',
  'Stable':          'bg-blue-100 text-blue-700',
  'Regression Risk': 'bg-red-100 text-red-700',
}

const PROGRESS_COLOR = (pct: number) => {
  if (pct === 100) return 'bg-emerald-500'
  if (pct >= 50)   return 'bg-blue-500'
  if (pct > 0)     return 'bg-amber-400'
  return 'bg-slate-200'
}

type FilterStatus = ActionStatus | 'All'

export default function ActionsPage() {
  const { lang, t } = useLang()
  const router   = useRouter()
  const vi       = lang === 'vi'
  const { mode } = useLiveData()
  const isLive   = mode === 'live'

  const [statusFilter,   setStatusFilter]   = useState<FilterStatus>('All')
  const [expandedId,     setExpandedId]     = useState<string | null>(null)
  const [commentInputs,  setCommentInputs]  = useState<Record<string, string>>({})
  const [extraComments,  setExtraComments]  = useState<Record<string, ActionComment[]>>({})
  const [activeTab,      setActiveTab]      = useState<Record<string, 'desc' | 'timeline' | 'impact' | 'notes'>>({})

  const filtered = statusFilter === 'All'
    ? actions
    : actions.filter(a => a.status === statusFilter)

  const STATUS_TABS: { label: string; value: FilterStatus; count: number }[] = [
    { label: t('common.all'),         value: 'All',         count: actionStats.total      },
    { label: t('actions.pending'),    value: 'Pending',     count: actionStats.pending    },
    { label: t('actions.inProgress'), value: 'In Progress', count: actionStats.inProgress },
    { label: t('actions.monitoring'), value: 'Monitoring',  count: actionStats.monitoring  },
    { label: t('actions.done'),       value: 'Done',        count: actionStats.done       },
  ]

  const PRIORITY_LABEL_VI: Record<string, string> = {
    Critical: 'Nghiêm trọng', High: 'Cao', Medium: 'Trung bình', Low: 'Thấp',
  }
  const STATUS_LABEL_VI: Record<string, string> = {
    'Pending': 'Chờ xử lý', 'In Progress': 'Đang thực hiện', 'Done': 'Hoàn thành', 'Monitoring': 'Theo dõi',
  }

  function formatDeadline(d: string) {
    const date    = new Date(d)
    const today   = new Date()
    const diff    = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const dateStr = date.toLocaleDateString(vi ? 'vi-VN' : 'en-GB', { day: 'numeric', month: 'short' })
    if (diff < 0)   return { str: vi ? `Trễ ${Math.abs(diff)} ngày` : `${Math.abs(diff)}d overdue`, color: 'text-red-600 font-bold' }
    if (diff === 0) return { str: vi ? 'Đến hạn hôm nay' : 'Due today', color: 'text-red-600 font-bold' }
    if (diff <= 3)  return { str: vi ? `Còn ${diff} ngày` : `${diff}d left`, color: 'text-amber-600 font-bold' }
    return { str: dateStr, color: 'text-slate-500' }
  }

  function getTabFor(id: string) { return activeTab[id] ?? 'desc' }

  function setTabFor(id: string, tab: 'desc' | 'timeline' | 'impact' | 'notes') {
    setActiveTab(prev => ({ ...prev, [id]: tab }))
  }

  function addComment(actionId: string) {
    const text = commentInputs[actionId]?.trim()
    if (!text) return
    const newComment: ActionComment = {
      id: `new-${Date.now()}`,
      author: vi ? 'Quản lý' : 'Manager',
      date: new Date().toISOString().slice(0, 10),
      text,
      textVi: text,
    }
    setExtraComments(prev => ({
      ...prev,
      [actionId]: [...(prev[actionId] ?? []), newComment],
    }))
    setCommentInputs(prev => ({ ...prev, [actionId]: '' }))
  }

  function getDaysRemaining(monitoring: { startDate: string; period: number }) {
    const start = new Date(monitoring.startDate)
    const end   = new Date(start)
    end.setDate(end.getDate() + monitoring.period)
    const today = new Date()
    return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div variants={fade} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Zap size={20} className="text-amber-500" />
            <h1 className="text-2xl font-bold text-slate-900">{t('actions.title')}</h1>
          </div>
          <p className="text-slate-500 text-sm">{t('actions.subtitle')}</p>
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold mt-2 px-2.5 py-1 rounded-full border ${
            isLive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {isLive
              ? (vi ? 'Cảnh báo từ dữ liệu trực tiếp · Hành động cố định' : 'Alerts from live data · Actions are predefined')
              : (vi ? 'Dữ liệu mẫu · Hành động cố định' : 'Demo data · Actions are predefined')}
          </span>
        </div>
        <div className="flex gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center min-w-[80px]">
            <div className="text-2xl font-extrabold text-amber-700">{actionStats.pending}</div>
            <div className="text-[10px] text-amber-600 font-semibold">{t('actions.pending')}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-center min-w-[80px]">
            <div className="text-2xl font-extrabold text-blue-700">{actionStats.inProgress}</div>
            <div className="text-[10px] text-blue-600 font-semibold">{t('actions.inProgress')}</div>
          </div>
          <div className="bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3 text-center min-w-[80px]">
            <div className="text-2xl font-extrabold text-teal-700">{actionStats.monitoring}</div>
            <div className="text-[10px] text-teal-600 font-semibold">{t('actions.monitoring')}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-center min-w-[80px]">
            <div className="text-2xl font-extrabold text-emerald-700">{actionStats.done}</div>
            <div className="text-[10px] text-emerald-600 font-semibold">{t('actions.done')}</div>
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

      {/* Action list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-slate-400">
            {t('actions.noActions')}
          </div>
        )}

        {filtered.map((action, i) => {
          const expanded = expandedId === action.id
          const deadline = formatDeadline(action.deadline)
          const tab      = getTabFor(action.id)
          const allComments = [...(action.comments ?? []), ...(extraComments[action.id] ?? [])]
          const hasTimeline = (action.timeline?.length ?? 0) > 0
          const hasImpact   = (action.actualImpact?.length ?? 0) > 0 && (action.status === 'Done' || action.status === 'Monitoring')
          const hasMonitor  = !!action.monitoring

          return (
            <motion.div key={action.id} variants={fade} transition={{ delay: i * 0.05 }}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
                {/* Action header */}
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : action.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[11px] font-mono text-slate-400 font-bold">{action.issueCode}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[action.priority]}`}>
                          {vi ? PRIORITY_LABEL_VI[action.priority] : action.priority}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[action.status]}`}>
                          {vi ? STATUS_LABEL_VI[action.status] : action.status}
                        </span>
                        {action.branchName && (
                          <span className="text-[10px] text-primary-700 bg-primary-50 border border-primary-200 px-2 py-0.5 rounded-full font-semibold">
                            {action.branchName.replace('Phê La ', '')}
                          </span>
                        )}
                        {hasMonitor && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${MONITORING_STATUS_STYLE[action.monitoring!.status]}`}>
                            <Eye size={9} /> {vi ? (action.monitoring!.status === 'Improving' ? 'Cải thiện' : action.monitoring!.status === 'Stable' ? 'Ổn định' : 'Rủi ro') : action.monitoring!.status}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-800">{vi ? (action.titleVi ?? action.title) : action.title}</h3>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-400">{t('actions.progress')}</span>
                          <span className="text-[10px] font-bold text-slate-600">{action.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${PROGRESS_COLOR(action.progress)}`}
                            style={{ width: `${action.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className={`text-xs ${deadline.color} flex items-center gap-1`}>
                        <Calendar size={11} />
                        {deadline.str}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <User size={11} />
                        <span className="max-w-[100px] truncate">{action.owner.split(' (')[0]}</span>
                      </div>
                      {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    {/* Sub-tabs */}
                    <div className="flex gap-0 border-b border-gray-100 px-5">
                      {([
                        { key: 'desc',     label: vi ? 'Chi tiết' : 'Details',    show: true          },
                        { key: 'timeline', label: vi ? 'Lịch sử' : 'Timeline',    show: hasTimeline   },
                        { key: 'impact',   label: vi ? 'Kết quả' : 'Impact',      show: hasImpact     },
                        { key: 'notes',    label: vi ? 'Ghi chú' : 'Notes',       show: true, count: allComments.length },
                      ] as const).filter(s => s.show).map(s => (
                        <button
                          key={s.key}
                          onClick={(e) => { e.stopPropagation(); setTabFor(action.id, s.key) }}
                          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1 ${
                            tab === s.key
                              ? 'border-primary-600 text-primary-700'
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {s.label}
                          {'count' in s && s.count > 0 && (
                            <span className="bg-gray-200 text-slate-500 text-[9px] font-bold px-1 rounded-full">{s.count}</span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="p-5 space-y-4">
                      {/* DETAILS TAB */}
                      {tab === 'desc' && (
                        <>
                          <p className="text-sm text-slate-600">{vi ? (action.descriptionVi ?? action.description) : action.description}</p>
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">{t('actions.impact')}</h4>
                            <p className="text-sm text-emerald-700">{vi ? (action.expectedImpactVi ?? action.expectedImpact) : action.expectedImpact}</p>
                          </div>

                          {/* Monitoring status panel */}
                          {hasMonitor && (
                            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Eye size={13} className="text-teal-600" />
                                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">{t('action.monitoring.period')}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <div className="text-[10px] text-teal-500 font-medium">{t('action.monitoring.status')}</div>
                                  <div className={`mt-1 text-xs font-bold px-2 py-1 rounded-lg inline-block ${MONITORING_STATUS_STYLE[action.monitoring!.status]}`}>
                                    {vi ? (action.monitoring!.status === 'Improving' ? 'Đang cải thiện' : action.monitoring!.status === 'Stable' ? 'Ổn định' : 'Có nguy cơ sụt giảm') : action.monitoring!.status}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-teal-500 font-medium">{vi ? 'Chu kỳ theo dõi' : 'Period'}</div>
                                  <div className="mt-1 text-sm font-bold text-teal-800">{action.monitoring!.period}{vi ? ' ngày' : ' days'}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-teal-500 font-medium">{t('action.monitoring.nextCheck')}</div>
                                  <div className="mt-1 text-sm font-bold text-teal-800">
                                    {getDaysRemaining(action.monitoring!)}d
                                    <span className="text-[10px] text-teal-500 font-normal ml-1">{vi ? 'còn lại' : 'remaining'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex gap-1.5 flex-wrap">
                              {action.tags.map(tag => (
                                <span key={tag} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{tag}</span>
                              ))}
                            </div>
                            <button
                              onClick={() => router.push('/issues')}
                              className="text-xs font-semibold text-primary-600 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors flex items-center gap-1"
                            >
                              {vi ? 'Xem vấn đề' : 'View Issue'} {action.issueCode} <ArrowRight size={11} />
                            </button>
                          </div>
                        </>
                      )}

                      {/* TIMELINE TAB */}
                      {tab === 'timeline' && hasTimeline && (
                        <div className="space-y-0">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Clock size={12} /> {t('action.timeline')}
                          </h4>
                          <div className="relative pl-5">
                            {action.timeline!.map((ev, idx) => (
                              <div key={idx} className="relative mb-3 last:mb-0">
                                {/* vertical line */}
                                {idx < action.timeline!.length - 1 && (
                                  <div className="absolute left-[-13px] top-4 bottom-[-12px] w-px bg-gray-200" />
                                )}
                                <div className={`absolute left-[-16px] top-1.5 w-2 h-2 rounded-full ${TIMELINE_DOT[ev.type] ?? 'bg-gray-300'}`} />
                                <div className="text-[10px] text-slate-400 mb-0.5">{ev.date}</div>
                                <div className="text-xs text-slate-700">{vi ? ev.eventVi : ev.event}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* IMPACT TAB */}
                      {tab === 'impact' && hasImpact && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <BarChart2 size={12} /> {t('action.impact.title')}
                          </h4>
                          <div className="rounded-xl border border-gray-100 overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase">{vi ? 'Chỉ số' : 'Metric'}</th>
                                  <th className="text-center px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase">{t('action.impact.expected')}</th>
                                  <th className="text-center px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase">{t('action.impact.actual')}</th>
                                  <th className="text-center px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase">{vi ? 'Kết quả' : 'Result'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {action.actualImpact!.map((item, idx) => (
                                  <tr key={idx} className="bg-white hover:bg-gray-50">
                                    <td className="px-3 py-2.5 font-medium text-slate-700">{vi ? item.metricVi : item.metric}</td>
                                    <td className="px-3 py-2.5 text-center text-slate-500">{item.expected}</td>
                                    <td className="px-3 py-2.5 text-center font-semibold text-slate-800">{item.actual}</td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={`font-bold text-xs px-1.5 py-0.5 rounded-full ${item.positive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {item.delta}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* NOTES TAB */}
                      {tab === 'notes' && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <MessageSquare size={12} /> {t('action.comments')}
                          </h4>
                          <div className="space-y-3 mb-4">
                            {allComments.length === 0 && (
                              <p className="text-xs text-slate-400">{vi ? 'Chưa có ghi chú nào.' : 'No notes yet.'}</p>
                            )}
                            {allComments.map(c => (
                              <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-3">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-semibold text-slate-700">{c.author}</span>
                                  <span className="text-[10px] text-slate-400">{c.date}</span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">{vi ? c.textVi : c.text}</p>
                              </div>
                            ))}
                          </div>
                          {/* Add comment */}
                          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                            <input
                              value={commentInputs[action.id] ?? ''}
                              onChange={e => setCommentInputs(prev => ({ ...prev, [action.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') addComment(action.id) }}
                              placeholder={t('action.addNote')}
                              className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
                            />
                            <button
                              onClick={() => addComment(action.id)}
                              className="px-3 py-2 bg-primary-700 text-white rounded-xl hover:bg-primary-600 transition-colors"
                            >
                              <Send size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
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
