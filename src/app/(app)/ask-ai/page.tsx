'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles } from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { useAuth } from '@/lib/AuthContext'
import { getResponseByKey, buildGreeting, suggestedPrompts } from '@/data/aiResponses'
import { useAiContext } from '@/lib/useAiContext'
import { streamAsk } from '@/lib/useAsk'
import { auth } from '@/lib/firebase'
import ChatBubble from '@/components/ChatBubble'

type Message = { id: number; role: 'user' | 'ai'; content: string }

let SEQ = 1
const nextId = () => SEQ++

export default function AskAIPage() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const { context, mode, chainStats, metrics } = useAiContext()
  const isLive = mode === 'live'

  const greetingText = () => isLive && chainStats.totalReviews > 0
    ? buildGreeting('greeting_ask', lang, chainStats.totalReviews, metrics.length)
    : getResponseByKey('greeting_ask', lang)

  const [messages, setMessages] = useState<Message[]>([{ id: 0, role: 'ai', content: greetingText() }])
  const [input,    setInput]    = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, streaming])

  // Update greeting when live data loads or language changes
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
        { id: nextId(), role: 'ai', content: lang === 'vi' ? 'Vui lòng đăng nhập bằng tài khoản @hsb.edu.vn để dùng AI phân tích.' : 'Please sign in with an @hsb.edu.vn account to use the AI analyst.' },
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
      if (!token) throw new Error(lang === 'vi' ? 'Phiên đăng nhập hết hạn.' : 'Session expired.')
      await streamAsk({ question: text, history, context, lang }, token,
        delta => setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: m.content + delta } : m)))
    } catch (e) {
      const msg = e instanceof Error ? e.message : (lang === 'vi' ? 'Đã xảy ra lỗi.' : 'Something went wrong.')
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: `⚠️ ${msg}` } : m))
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const lastAi = messages[messages.length - 1]
  const showTyping = streaming && lastAi?.role === 'ai' && lastAi.content === ''

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <div className="w-8 h-8 rounded-xl bg-primary-700 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t('ai.title')}</h1>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Live AI · gpt-4o-mini
          </span>
          <span className="text-[10px] font-medium text-slate-400">{mode === 'live' ? (lang === 'vi' ? 'dữ liệu trực tiếp' : 'live data') : (lang === 'vi' ? 'dữ liệu mẫu' : 'demo data')}</span>
        </div>
        <p className="text-slate-500 text-sm">{t('ai.subtitle')}</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            (msg.role === 'ai' && msg.content === '') ? null : (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                <ChatBubble role={msg.role} content={msg.content} />
              </motion.div>
            )
          ))}
          {showTyping && (
            <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <ChatBubble role="ai" content="" isTyping />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="mb-4">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">{t('ai.suggested')}</p>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((p, i) => (
              <button key={i} onClick={() => sendMessage(p)}
                className="text-xs text-primary-700 bg-primary-50 border border-primary-100 px-3 py-2 rounded-xl hover:bg-primary-100 transition-colors font-medium">
                {lang === 'vi' ? p.vi : p.en}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-card flex items-center gap-3 p-2 pl-4">
        <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder={t('ai.placeholder')} disabled={streaming}
          className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 bg-transparent outline-none disabled:opacity-50" />
        <button onClick={() => sendMessage()} disabled={!input.trim() || streaming}
          className="flex items-center gap-1.5 bg-primary-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          <Send size={14} />
          {t('ai.send')}
        </button>
      </div>

      <p className="text-center text-[10px] text-slate-400 mt-2">{t('ai.disclaimer')}</p>
    </motion.div>
  )
}
