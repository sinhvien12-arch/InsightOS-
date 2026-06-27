'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, MessageSquare, Lightbulb, Send, Tag, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { useAuth } from '@/lib/AuthContext'
import { getResponseByKey, buildGreeting, suggestedPrompts } from '@/data/aiResponses'
import { recommendations as demoRecs } from '@/data/recommendations'
import { branches as demoBranches } from '@/data/branches'
import { useAiContext } from '@/lib/useAiContext'
import { liveToRecommendations, computeImpactSummary } from '@/lib/liveRecommendations'
import { useImplementedRecs } from '@/lib/useImplementedRecs'
import { streamAsk } from '@/lib/useAsk'
import { auth } from '@/lib/firebase'
import ChatBubble from '@/components/ChatBubble'
import RecommendationCard from '@/components/RecommendationCard'

type Tab = 'ask' | 'recs'
type Message = { id: number; role: 'user' | 'ai'; content: string }

let SEQ = 1
const nextId = () => SEQ++

const PRIORITY_LABEL_VI: Record<string, string> = {
  Critical: 'Nghiêm trọng', High: 'Cao', Medium: 'Trung bình', Low: 'Thấp',
}
const CATEGORY_LABEL_VI: Record<string, string> = {
  Operations: 'Vận hành', Service: 'Dịch vụ', Staffing: 'Nhân sự',
  Strategy: 'Chiến lược', Technology: 'Công nghệ', Training: 'Đào tạo',
  Environment: 'Môi trường', Product: 'Sản phẩm',
}
const PAIN_POINT_LABEL_VI: Record<string, string> = {
  'Waiting Time': 'Thời gian chờ', 'Service Quality': 'Chất lượng dịch vụ',
  'Hygiene': 'Vệ sinh', 'Order Accuracy': 'Độ chính xác đơn hàng',
  'Product Quality': 'Chất lượng sản phẩm', 'General': 'Chung',
}

export default function AICenterPage() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const { context, mode, chainStats, criticalCount, topIssueLabel, metrics, liveBranches } = useAiContext()
  const isLive = mode === 'live'
  const displayRecs    = isLive ? liveToRecommendations(metrics) : demoRecs
  const displayBranches = isLive ? liveBranches : demoBranches
  const liveImpact     = computeImpactSummary(metrics)
  const vi = lang === 'vi'
  const [tab, setTab] = useState<Tab>('ask')

  const greetingText = () => isLive && chainStats.totalReviews > 0
    ? buildGreeting('greeting_center', lang, chainStats.totalReviews, metrics.length)
    : getResponseByKey('greeting_center', lang)

  const [messages, setMessages] = useState<Message[]>([{ id: 0, role: 'ai', content: greetingText() }])
  const [input,     setInput]     = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { implementedIds, markImplemented, clearAll } = useImplementedRecs()
  const [showImplemented, setShowImplemented] = useState(false)

  const [branchFilter,   setBranchFilter]   = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, streaming])

  // Update the initial greeting when language changes or live data loads
  useEffect(() => {
    setMessages(prev => prev.map(m => m.id === 0 ? { ...m, content: greetingText() } : m))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, mode, chainStats.totalReviews, metrics.length])

  async function sendMessage(prompt?: string | { en: string; vi: string }) {
    const text = (prompt && typeof prompt === 'object' ? (lang === 'vi' ? prompt.vi : prompt.en) : (typeof prompt === 'string' ? prompt : input)).trim()
    if (!text || streaming) return
    setInput('')

    if (!user) {
      setMessages(prev => [...prev,
        { id: nextId(), role: 'user', content: text },
        { id: nextId(), role: 'ai', content: vi ? 'Vui lòng đăng nhập bằng tài khoản @hsb.edu.vn để dùng AI phân tích.' : 'Please sign in with an @hsb.edu.vn account to use the AI analyst.' },
      ])
      return
    }

    const history = messages.filter(m => m.id !== 0).slice(-6).map(m => ({ role: (m.role === 'ai' ? 'assistant' : 'user') as 'assistant' | 'user', content: m.content }))
    setMessages(prev => [...prev, { id: nextId(), role: 'user', content: text }])
    const aiId = nextId()
    setMessages(prev => [...prev, { id: aiId, role: 'ai', content: '' }])
    setStreaming(true)

    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error(vi ? 'Phiên đăng nhập hết hạn.' : 'Session expired.')
      await streamAsk({ question: text, history, context, lang }, token,
        delta => setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: m.content + delta } : m)))
    } catch (e) {
      const msg = e instanceof Error ? e.message : (vi ? 'Đã xảy ra lỗi.' : 'Something went wrong.')
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: `⚠️ ${msg}` } : m))
    } finally {
      setStreaming(false)
    }
  }

  const lastAi = messages[messages.length - 1]
  const showTyping = streaming && lastAi?.role === 'ai' && lastAi.content === ''

  const categories = displayRecs.map(r => r.category).filter((c, i, a) => a.indexOf(c) === i)
  const filteredRecs = displayRecs.filter(r => {
    const matchB = !branchFilter || r.branchId === branchFilter || (branchFilter === '__chain__' && !r.branchId)
    const matchP = !priorityFilter || r.priority === priorityFilter
    const matchC = !categoryFilter || r.category === categoryFilter
    return matchB && matchP && matchC
  })

  const activeRecs  = filteredRecs.filter(r => !implementedIds.has(r.id))
  const doneRecs    = filteredRecs.filter(r => implementedIds.has(r.id))
  const visibleRecs = showImplemented ? filteredRecs : activeRecs

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Brain size={22} className="text-primary-600" />
            {t('aiCenter.title')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('aiCenter.subtitle')}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold px-3 py-1.5 rounded-xl flex-shrink-0">
          <Tag size={11} />
          {mode === 'live' ? (vi ? 'Live AI · dữ liệu trực tiếp' : 'Live AI · live data') : (vi ? 'Live AI · dữ liệu mẫu' : 'Live AI · demo data')}
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { id: 'ask',  label: t('aiCenter.askTab'),  icon: MessageSquare },
          { id: 'recs', label: t('aiCenter.recsTab'), icon: Lightbulb     },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === id ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'ask' ? (
          <motion.div key="ask" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chat panel */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-card flex flex-col" style={{ height: '600px' }}>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
                {messages.map(m => (m.role === 'ai' && m.content === '') ? null : (
                  <ChatBubble key={m.id} role={m.role} content={m.content} />
                ))}
                {showTyping && <ChatBubble role="ai" content="" isTyping />}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-gray-100 p-4">
                <form onSubmit={e => { e.preventDefault(); sendMessage() }} className="flex gap-2">
                  <input value={input} onChange={e => setInput(e.target.value)} placeholder={t('ai.placeholder')} disabled={streaming}
                    className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:bg-gray-50" />
                  <button type="submit" disabled={streaming || !input.trim()}
                    className="px-4 py-2.5 bg-primary-700 text-white rounded-xl hover:bg-primary-800 disabled:opacity-40 transition-all">
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>

            {/* Suggested prompts + quick stats */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{t('ai.suggested')}</h3>
                <div className="space-y-2">
                  {suggestedPrompts.map((p, i) => (
                    <button key={i} onClick={() => sendMessage(p)}
                      className="w-full text-left text-xs text-slate-600 bg-gray-50 hover:bg-primary-50 hover:text-primary-700 border border-gray-100 hover:border-primary-200 rounded-xl px-3 py-2.5 transition-all font-medium">
                      {vi ? p.vi : p.en}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary-900 to-primary-700 rounded-2xl p-5 text-white">
                <div className="text-xs font-bold uppercase tracking-widest text-primary-200 mb-3">{t('aiCenter.quickSnapshot')}</div>
                <div className="space-y-2">
                  {[
                    { label: t('aiCenter.chainHealth'),      val: `${chainStats.avgHealthScore}/100` },
                    { label: t('aiCenter.reviewsAnalyzed'),  val: String(chainStats.totalReviews) },
                    { label: t('aiCenter.criticalBranches'), val: String(criticalCount) },
                    { label: t('aiCenter.topIssue'),         val: vi ? (PAIN_POINT_LABEL_VI[topIssueLabel] ?? topIssueLabel) : topIssueLabel },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span className="text-xs text-primary-200">{s.label}</span>
                      <span className="text-xs font-bold text-accent">{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="recs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <div className="flex flex-wrap gap-3 items-center">
              <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white text-slate-600 focus:outline-none">
                <option value="">{t('recs.allBranches')}</option>
                <option value="__chain__">{t('aiCenter.chainWide')}</option>
                {displayBranches.map(b => <option key={b.id} value={b.id}>{b.name.replace('Phê La ', '')}</option>)}
              </select>
              <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white text-slate-600 focus:outline-none">
                <option value="">{t('recs.allPriority')}</option>
                {['Critical', 'High', 'Medium', 'Low'].map(p => (
                  <option key={p} value={p}>{vi ? (PRIORITY_LABEL_VI[p] ?? p) : p}</option>
                ))}
              </select>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white text-slate-600 focus:outline-none">
                <option value="">{t('recs.allCategory')}</option>
                {categories.map(c => <option key={c} value={c}>{vi ? (CATEGORY_LABEL_VI[c] ?? c) : c}</option>)}
              </select>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-slate-400">{activeRecs.length} {t('aiCenter.recLabel')}</span>
                {doneRecs.length > 0 && (
                  <button
                    onClick={() => setShowImplemented(s => !s)}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    {showImplemented ? <EyeOff size={10} /> : <Eye size={10} />}
                    {showImplemented
                      ? (vi ? 'Ẩn đã triển khai' : 'Hide done')
                      : (vi ? `${doneRecs.length} đã triển khai` : `${doneRecs.length} done`)}
                  </button>
                )}
              </div>
            </div>

            {activeRecs.length === 0 && doneRecs.length > 0 && !showImplemented ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-300" />
                <p className="text-sm font-semibold text-emerald-600">
                  {vi ? 'Tất cả đã triển khai!' : 'All implemented!'}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button onClick={() => setShowImplemented(true)} className="text-xs text-emerald-600 underline">
                    {vi ? `Xem ${doneRecs.length} đã triển khai` : `View ${doneRecs.length} done`}
                  </button>
                  <span className="text-slate-300">·</span>
                  <button onClick={clearAll} className="text-xs text-slate-400 underline">Reset</button>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {visibleRecs.map((rec, i) => (
                <motion.div key={rec.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={implementedIds.has(rec.id) ? 'opacity-60' : ''}>
                  <RecommendationCard rec={rec} isLive={isLive} onImplemented={markImplemented} />
                </motion.div>
              ))}
            </div>
            )}

            <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl p-6 text-white">
              <h3 className="font-bold mb-1">{t('aiCenter.combinedImpact')}</h3>
              {isLive && (
                <p className="text-primary-200 text-xs mb-3">
                  {vi
                    ? `Ước tính từ ${displayRecs.length} khuyến nghị · Sức khỏe hiện tại ${chainStats.avgHealthScore}/100`
                    : `Estimated from ${displayRecs.length} recommendations · Current health ${chainStats.avgHealthScore}/100`}
                </p>
              )}
              <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${!isLive ? 'mt-4' : ''}`}>
                {(isLive ? [
                  { val: `+${liveImpact.potentialHealthGain} pts`, label: t('aiCenter.chainHealthScore') },
                  { val: `-${liveImpact.waitReductionPct}%`,        label: t('aiCenter.waitComplaints')   },
                  { val: `+${liveImpact.satisfactionGainPct}%`,     label: t('aiCenter.thanhThaiSat')     },
                  { val: `+${liveImpact.revenueImpactPct}%`,        label: t('aiCenter.stockout')         },
                ] : [
                  { val: '+12%', label: t('aiCenter.chainHealthScore') },
                  { val: '-35%', label: t('aiCenter.waitComplaints')   },
                  { val: '+15%', label: t('aiCenter.thanhThaiSat')     },
                  { val: '-35%', label: t('aiCenter.stockout')         },
                ]).map(s => (
                  <div key={s.val} className="bg-white/10 rounded-xl p-3">
                    <div className="text-2xl font-extrabold text-accent">{s.val}</div>
                    <div className="text-xs text-primary-200 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
