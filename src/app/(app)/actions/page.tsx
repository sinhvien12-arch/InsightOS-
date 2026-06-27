'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { Zap, ArrowRight, User, Calendar, ChevronDown, ChevronUp, Clock, MessageSquare, BarChart2, Eye, Send, Plus, X, CircleDot } from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { useLiveData, dbRowToAction } from '@/lib/useLiveData'
import { actions as demoActions } from '@/data/actions'
import { auth } from '@/lib/firebase'
import type { ActionStatus, Priority, ActionComment, Action } from '@/data/types'

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

const BLANK_FORM = { title: '', priority: 'Medium' as Priority, owner: 'Manager', branchId: '', deadline: '', description: '', issueId: '', issueCode: '' }

export default function ActionsPage() {
  const { lang, t } = useLang()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const vi           = lang === 'vi'
  const { mode, branches: liveBranches } = useLiveData()
  const isLive = mode === 'live' || mode === 'empty'

  const [localActions,   setLocalActions]   = useState<Action[]>([])
  const [statusFilter,   setStatusFilter]   = useState<FilterStatus>('All')
  const [expandedId,     setExpandedId]     = useState<string | null>(null)
  const [commentInputs,  setCommentInputs]  = useState<Record<string, string>>({})
  const [activeTab,      setActiveTab]      = useState<Record<string, 'desc' | 'timeline' | 'impact' | 'notes'>>({})
  const [editingStatus,  setEditingStatus]  = useState<Record<string, boolean>>({})
  const [showNewAction,  setShowNewAction]  = useState(false)
  const [newForm,        setNewForm]        = useState(BLANK_FORM)
  const [creating,       setCreating]       = useState(false)
  const [loadingActions, setLoadingActions] = useState(false)

  // Pre-fill form when arriving from Issues page via "Create Action"
  useEffect(() => {
    if (searchParams.get('create') !== '1') return
    const issueId   = searchParams.get('issueId')   ?? ''
    const issueCode = searchParams.get('issueCode') ?? ''
    const issueTitle = decodeURIComponent(searchParams.get('issueTitle') ?? '')
    const priority  = (searchParams.get('priority') ?? 'Medium') as Priority
    const branchId  = searchParams.get('branchId')  ?? ''
    setNewForm({ ...BLANK_FORM, title: issueTitle ? `Fix: ${issueTitle}` : '', priority, branchId, issueId, issueCode })
    setShowNewAction(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch actions from API (Firebase-authed, bypasses Supabase RLS)
  async function loadActions() {
    setLoadingActions(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return
      const res = await fetch('/api/actions', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const body = await res.json()
      if (Array.isArray(body.actions)) {
        setLocalActions(body.actions.map((row: Record<string, unknown>) => dbRowToAction(row)))
      }
    } catch {
      // silent — keep demo data if API unavailable
    } finally {
      setLoadingActions(false)
    }
  }

  // Load actions from DB when live; show demo data only in explicit demo mode
  useEffect(() => {
    if (isLive) {
      loadActions()
    } else if (mode === 'demo') {
      setLocalActions(demoActions)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, mode])

  // ─── API helper ──────────────────────────────────────────────────────────

  async function callApi(method: string, body: Record<string, unknown>): Promise<boolean> {
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return false
      const res = await fetch('/api/actions', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('[Actions] API error:', (err as { error?: string }).error ?? res.status)
      }
      return res.ok
    } catch (e) {
      console.error('[Actions] callApi failed:', e)
      return false
    }
  }

  // ─── Mutations ───────────────────────────────────────────────────────────

  async function handleStatusChange(id: string, status: ActionStatus) {
    setLocalActions(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    setEditingStatus(prev => ({ ...prev, [id]: false }))
    if (isLive) {
      await callApi('PATCH', { id, status })
    }
  }

  async function handleProgressChange(id: string, progress: number) {
    if (isLive) await callApi('PATCH', { id, progress })
  }

  async function addComment(actionId: string) {
    const text = commentInputs[actionId]?.trim()
    if (!text) return
    const newComment: ActionComment = {
      id:      `cmt-${Date.now()}`,
      author:  vi ? 'Quản lý' : 'Manager',
      date:    new Date().toISOString().slice(0, 10),
      text,
      textVi:  text,
    }
    setLocalActions(prev => prev.map(a =>
      a.id === actionId ? { ...a, comments: [...(a.comments ?? []), newComment] } : a
    ))
    setCommentInputs(prev => ({ ...prev, [actionId]: '' }))
    if (isLive) await callApi('PATCH', { id: actionId, addComment: newComment })
  }

  async function handleCreateAction() {
    if (!newForm.title.trim() || !newForm.deadline) return
    setCreating(true)

    const branchObj  = liveBranches.find(b => b.id === newForm.branchId)
    const today      = new Date().toISOString().slice(0, 10)
    const newAction: Action = {
      id:             `local-${Date.now()}`,
      issueId:        newForm.issueId,
      issueCode:      newForm.issueCode,
      title:          newForm.title,
      titleVi:        newForm.title,
      description:    newForm.description,
      descriptionVi:  newForm.description,
      owner:          newForm.owner || 'Manager',
      branchId:       newForm.branchId || null,
      branchName:     branchObj?.name || null,
      priority:       newForm.priority,
      status:         'Pending',
      deadline:       newForm.deadline,
      progress:       0,
      expectedImpact: '',
      tags:           [],
      timeline:       [{ date: today, event: 'Action created', eventVi: 'Hành động được tạo', type: 'created' }],
      comments:       [],
    }

    setLocalActions(prev => [newAction, ...prev])
    setShowNewAction(false)
    setNewForm(BLANK_FORM)
    setCreating(false)

    if (isLive) {
      const ok = await callApi('POST', {
        title:       newForm.title,
        description: newForm.description,
        owner:       newForm.owner || 'Manager',
        issue_id:    newForm.issueId  || null,
        issue_code:  newForm.issueCode || null,
        branchId:    newForm.branchId || null,
        branchName:  branchObj?.name  || null,
        priority:    newForm.priority,
        status:      'Pending',
        deadline:    newForm.deadline,
        progress:    0,
        timeline: [{ date: today, event: 'Action created', eventVi: 'Hành động được tạo', type: 'created' }],
      })
      // Reload from API to get real DB ids and confirm persistence
      if (ok) await loadActions()
    }
  }

  // ─── Derived stats ────────────────────────────────────────────────────────

  const displayStats = {
    total:      localActions.length,
    pending:    localActions.filter(a => a.status === 'Pending').length,
    inProgress: localActions.filter(a => a.status === 'In Progress').length,
    monitoring: localActions.filter(a => a.status === 'Monitoring').length,
    done:       localActions.filter(a => a.status === 'Done').length,
  }

  const issueIdFilter = searchParams.get('issueId') ?? ''

  const filtered = localActions.filter(a => {
    const matchStatus = statusFilter === 'All' || a.status === statusFilter
    const matchIssue  = !issueIdFilter || a.issueId === issueIdFilter
    return matchStatus && matchIssue
  })

  const STATUS_TABS: { label: string; value: FilterStatus; count: number }[] = [
    { label: t('common.all'),         value: 'All',         count: displayStats.total      },
    { label: t('actions.pending'),    value: 'Pending',     count: displayStats.pending    },
    { label: t('actions.inProgress'), value: 'In Progress', count: displayStats.inProgress },
    { label: t('actions.monitoring'), value: 'Monitoring',  count: displayStats.monitoring  },
    { label: t('actions.done'),       value: 'Done',        count: displayStats.done       },
  ]

  const PRIORITY_LABEL_VI: Record<string, string> = {
    Critical: 'Nghiêm trọng', High: 'Cao', Medium: 'Trung bình', Low: 'Thấp',
  }
  const STATUS_LABEL_VI: Record<string, string> = {
    'Pending': 'Chờ xử lý', 'In Progress': 'Đang thực hiện', 'Done': 'Hoàn thành', 'Monitoring': 'Theo dõi',
  }
  const STATUS_OPTIONS: ActionStatus[] = ['Pending', 'In Progress', 'Monitoring', 'Done']

  function formatDeadline(d: string) {
    if (!d) return { str: '—', color: 'text-slate-400' }
    // Parse YYYY-MM-DD into local midnight (avoids UTC-shift issues with new Date(string))
    const parts = d.split('-').map(Number)
    if (parts.length !== 3 || parts.some(isNaN)) return { str: d, color: 'text-slate-400' }
    const [y, m, day] = parts
    const date  = new Date(y, m - 1, day)
    const today = new Date(); today.setHours(0, 0, 0, 0); date.setHours(0, 0, 0, 0)
    const diff  = Math.round((date.getTime() - today.getTime()) / 86_400_000)
    // Manual month labels — avoids browser locale inconsistencies (e.g. "3/7" vs "20-6-2026")
    const MO_VI = ['thg 1','thg 2','thg 3','thg 4','thg 5','thg 6','thg 7','thg 8','thg 9','thg 10','thg 11','thg 12']
    const MO_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const dateStr = vi ? `${day} ${MO_VI[m - 1]}` : `${day} ${MO_EN[m - 1]}`
    if (diff < 0)   return { str: vi ? `Trễ ${Math.abs(diff)} ngày` : `${Math.abs(diff)}d overdue`, color: 'text-red-600 font-bold' }
    if (diff === 0) return { str: vi ? 'Đến hạn hôm nay' : 'Due today', color: 'text-red-600 font-bold' }
    if (diff <= 3)  return { str: vi ? `Còn ${diff} ngày` : `${diff}d left`, color: 'text-amber-600 font-bold' }
    return { str: dateStr, color: 'text-slate-500' }
  }

  function getTabFor(id: string) { return activeTab[id] ?? 'desc' }

  function setTabFor(id: string, tab: 'desc' | 'timeline' | 'impact' | 'notes') {
    setActiveTab(prev => ({ ...prev, [id]: tab }))
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
            {loadingActions
            ? (vi ? 'Đang tải...' : 'Loading...')
            : isLive
              ? (vi ? 'Hành động từ database · Có thể chỉnh sửa' : 'Actions from database · Editable')
              : (vi ? 'Dữ liệu mẫu · Hành động cố định' : 'Demo data · Actions are predefined')}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Stat boxes */}
          <div className="flex gap-2 flex-wrap">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center min-w-[72px]">
              <div className="text-xl font-extrabold text-amber-700">{displayStats.pending}</div>
              <div className="text-[10px] text-amber-600 font-semibold">{t('actions.pending')}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-center min-w-[72px]">
              <div className="text-xl font-extrabold text-blue-700">{displayStats.inProgress}</div>
              <div className="text-[10px] text-blue-600 font-semibold">{t('actions.inProgress')}</div>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3 text-center min-w-[72px]">
              <div className="text-xl font-extrabold text-teal-700">{displayStats.monitoring}</div>
              <div className="text-[10px] text-teal-600 font-semibold">{t('actions.monitoring')}</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-center min-w-[72px]">
              <div className="text-xl font-extrabold text-emerald-700">{displayStats.done}</div>
              <div className="text-[10px] text-emerald-600 font-semibold">{t('actions.done')}</div>
            </div>
          </div>
          {/* New action button — only in live mode */}
          {isLive && (
            <button
              onClick={() => setShowNewAction(true)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-primary-700 text-white px-4 py-2.5 rounded-xl hover:bg-primary-600 transition-colors whitespace-nowrap"
            >
              <Plus size={14} />
              {vi ? 'Tạo hành động' : 'New Action'}
            </button>
          )}
        </div>
      </motion.div>

      {/* Issue filter banner */}
      {issueIdFilter && (
        <motion.div variants={fade} className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-xl px-4 py-2.5">
          <span className="text-xs font-semibold text-primary-700 flex items-center gap-1.5">
            <CircleDot size={13} />
            {vi ? `Lọc theo vấn đề: ${issueIdFilter}` : `Filtered by issue: ${issueIdFilter}`}
          </span>
          <button
            onClick={() => router.push('/actions')}
            className="text-xs font-semibold text-primary-500 hover:text-primary-700 underline transition-colors"
          >
            {vi ? 'Xóa bộ lọc' : 'Clear filter'}
          </button>
        </motion.div>
      )}

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

      {/* Empty state (live mode, no actions) */}
      {isLive && localActions.length === 0 && (
        <motion.div variants={fade} className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Zap size={36} className="text-slate-200 mx-auto mb-3" />
          <h3 className="text-slate-700 font-semibold mb-1">{vi ? 'Chưa có hành động nào' : 'No actions yet'}</h3>
          <p className="text-xs text-slate-400 mb-4">
            {vi ? 'Tạo hành động đầu tiên để theo dõi tiến độ cải thiện' : 'Create your first action to track improvement progress'}
          </p>
          <button onClick={() => setShowNewAction(true)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold bg-primary-700 text-white px-5 py-2.5 rounded-xl hover:bg-primary-600 transition-colors">
            <Plus size={14} />
            {vi ? 'Tạo hành động' : 'Create Action'}
          </button>
        </motion.div>
      )}

      {/* Action list */}
      <div className="space-y-3">
        {filtered.length === 0 && localActions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-slate-400">
            {t('actions.noActions')}
          </div>
        )}

        {filtered.map((action, i) => {
          const expanded    = expandedId === action.id
          const deadline    = formatDeadline(action.deadline)
          const tab         = getTabFor(action.id)
          const allComments = action.comments ?? []
          const hasTimeline = (action.timeline?.length ?? 0) > 0
          const hasImpact   = (action.actualImpact?.length ?? 0) > 0 && (action.status === 'Done' || action.status === 'Monitoring')
          const hasMonitor  = !!action.monitoring
          const isEditingStatus = editingStatus[action.id] ?? false

          return (
            <motion.div key={action.id} variants={fade} transition={{ delay: i * 0.04 }}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
                {/* Action header */}
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : action.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {action.issueCode && (
                          <span className="text-[11px] font-mono text-slate-400 font-bold">{action.issueCode}</span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[action.priority]}`}>
                          {vi ? PRIORITY_LABEL_VI[action.priority] : action.priority}
                        </span>

                        {/* Status badge — clickable in live mode */}
                        {isEditingStatus ? (
                          <select
                            autoFocus
                            value={action.status}
                            onClick={e => e.stopPropagation()}
                            onChange={e => handleStatusChange(action.id, e.target.value as ActionStatus)}
                            onBlur={() => setEditingStatus(prev => ({ ...prev, [action.id]: false }))}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-300 bg-blue-50 text-blue-700 cursor-pointer focus:outline-none"
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{vi ? STATUS_LABEL_VI[s] : s}</option>
                            ))}
                          </select>
                        ) : (
                          <span
                            onClick={e => {
                              if (!isLive) return
                              e.stopPropagation()
                              setEditingStatus(prev => ({ ...prev, [action.id]: true }))
                            }}
                            title={isLive ? (vi ? 'Click để đổi trạng thái' : 'Click to change status') : undefined}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[action.status]} ${isLive ? 'cursor-pointer hover:opacity-70' : ''}`}
                          >
                            {vi ? STATUS_LABEL_VI[action.status] : action.status}
                          </span>
                        )}

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
                        { key: 'desc',     label: vi ? 'Chi tiết' : 'Details',    show: true        },
                        { key: 'timeline', label: vi ? 'Lịch sử' : 'Timeline',    show: hasTimeline },
                        { key: 'impact',   label: vi ? 'Kết quả' : 'Impact',      show: hasImpact   },
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
                          {/* Editable progress slider (live mode only) */}
                          {isLive && (
                            <div className="bg-white border border-gray-100 rounded-xl p-3 space-y-2" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-500">{vi ? 'Tiến độ' : 'Progress'}</span>
                                <span className="text-xs font-bold text-slate-700">{action.progress}%</span>
                              </div>
                              <input
                                type="range" min={0} max={100} step={5}
                                defaultValue={action.progress}
                                onChange={e => {
                                  const v = parseInt(e.target.value)
                                  setLocalActions(prev => prev.map(a => a.id === action.id ? { ...a, progress: v } : a))
                                }}
                                onMouseUp={e => handleProgressChange(action.id, parseInt((e.target as HTMLInputElement).value))}
                                onTouchEnd={e => handleProgressChange(action.id, parseInt((e.target as HTMLInputElement).value))}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary-600"
                              />
                              <div className="flex justify-between text-[10px] text-slate-300">
                                <span>0%</span><span>50%</span><span>100%</span>
                              </div>
                            </div>
                          )}

                          <p className="text-sm text-slate-600">{vi ? (action.descriptionVi ?? action.description) : action.description}</p>

                          {action.expectedImpact && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                              <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">{t('actions.impact')}</h4>
                              <p className="text-sm text-emerald-700">{vi ? (action.expectedImpactVi ?? action.expectedImpact) : action.expectedImpact}</p>
                            </div>
                          )}

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
                            {action.issueCode && (
                              <button
                                onClick={() => router.push(action.issueId ? `/issues?highlight=${action.issueId}` : '/issues')}
                                className="text-xs font-semibold text-primary-600 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors flex items-center gap-1"
                              >
                                {vi ? 'Xem vấn đề' : 'View Issue'} {action.issueCode} <ArrowRight size={11} />
                              </button>
                            )}
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
                          {isLive && (
                            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                              {vi ? 'Ghi chú được lưu vào database' : 'Notes are saved to database'}
                            </p>
                          )}
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

      {/* New Action Modal */}
      {showNewAction && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowNewAction(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{vi ? 'Tạo hành động mới' : 'New Action'}</h2>
              <button onClick={() => { setShowNewAction(false); setNewForm(BLANK_FORM) }} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Linked issue badge */}
            {newForm.issueCode && (
              <div className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-xl px-3 py-2">
                <CircleDot size={13} className="text-primary-600 flex-shrink-0" />
                <span className="text-xs text-primary-700 font-semibold">
                  {vi ? 'Liên kết với vấn đề:' : 'Linked to issue:'} <span className="font-mono">{newForm.issueCode}</span>
                </span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">{vi ? 'Tiêu đề *' : 'Title *'}</label>
              <input
                autoFocus
                value={newForm.title}
                onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))}
                placeholder={vi ? 'Tên hành động...' : 'Action title...'}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">{vi ? 'Ưu tiên' : 'Priority'}</label>
                <select
                  value={newForm.priority}
                  onChange={e => setNewForm(p => ({ ...p, priority: e.target.value as Priority }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent bg-white"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">{vi ? 'Hạn chót *' : 'Deadline *'}</label>
                <input
                  type="date"
                  value={newForm.deadline}
                  onChange={e => setNewForm(p => ({ ...p, deadline: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">{vi ? 'Người phụ trách' : 'Owner'}</label>
              <input
                value={newForm.owner}
                onChange={e => setNewForm(p => ({ ...p, owner: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
              />
            </div>

            {liveBranches.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">{vi ? 'Chi nhánh (tuỳ chọn)' : 'Branch (optional)'}</label>
                <select
                  value={newForm.branchId}
                  onChange={e => setNewForm(p => ({ ...p, branchId: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent bg-white"
                >
                  <option value="">{vi ? '— Không chọn —' : '— None —'}</option>
                  {liveBranches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">{vi ? 'Mô tả (tuỳ chọn)' : 'Description (optional)'}</label>
              <textarea
                value={newForm.description}
                onChange={e => setNewForm(p => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder={vi ? 'Chi tiết hành động cần thực hiện...' : 'Details about what needs to be done...'}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowNewAction(false)}
                className="flex-1 text-sm font-semibold text-slate-600 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {vi ? 'Huỷ' : 'Cancel'}
              </button>
              <button
                onClick={handleCreateAction}
                disabled={!newForm.title.trim() || !newForm.deadline || creating}
                className="flex-1 text-sm font-semibold bg-primary-700 text-white px-4 py-2.5 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {creating ? '...' : (vi ? 'Tạo' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
