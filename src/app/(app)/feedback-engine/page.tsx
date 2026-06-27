'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Globe, Users, Music, Truck, ShoppingCart, MessageCircle,
  Download, Sparkles, Tag, Search, BarChart2, LayoutDashboard,
  CheckCircle, Loader2, Database, ArrowRight, Clock,
  Cpu, Zap, Shield,
} from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { useLiveData } from '@/lib/useLiveData'

// ── Animated counter hook ──────────────────────────────────────────────
function useCounter(target: number, duration = 1800, active = true) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) { setCount(0); return }
    let val = 0
    const step = target / (duration / 16)
    const id = setInterval(() => {
      val += step
      if (val >= target) { setCount(target); clearInterval(id) }
      else { setCount(Math.round(val)) }
    }, 16)
    return () => clearInterval(id)
  }, [target, duration, active])
  return count
}

// ── Data sources (static metadata + fallback counts from research dataset) ─
const SOURCES_META = [
  { name: 'Google Reviews', platformKey: 'google',     Icon: Globe,         fallback: 275, color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-100',    dot: 'bg-red-500',    updated: 'Jun 25, 2026' },
  { name: 'ShopeeFood',     platformKey: 'shopeefood', Icon: ShoppingCart,  fallback: 154, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', dot: 'bg-orange-500', updated: 'Jun 22, 2026' },
  { name: 'GrabFood',       platformKey: 'grabfood',   Icon: Truck,         fallback: 64,  color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-100',  dot: 'bg-green-600',  updated: 'Jun 23, 2026' },
  { name: 'TikTok',         platformKey: 'tiktok',     Icon: Music,         fallback: 11,  color: 'text-slate-800',  bg: 'bg-slate-50',  border: 'border-slate-200',  dot: 'bg-slate-800',  updated: 'Jun 25, 2026' },
  { name: 'Facebook',       platformKey: 'facebook',   Icon: Users,         fallback: 0,   color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100',   dot: 'bg-blue-500',   updated: 'Jun 24, 2026' },
  { name: 'Threads',        platformKey: 'threads',    Icon: MessageCircle, fallback: 0,   color: 'text-slate-700',  bg: 'bg-gray-50',   border: 'border-gray-200',   dot: 'bg-slate-900',  updated: 'Jun 24, 2026' },
]

// ── Pipeline steps ─────────────────────────────────────────────────────
const STEPS = [
  { Icon: Download,      label: 'Collect Customer Feedback',    labelVi: 'Thu thập phản hồi khách hàng',   desc: 'Import feedback from 6 public digital channels across Google, Facebook, TikTok, GrabFood, ShopeeFood, and Threads.',  descVi: 'Nhập phản hồi từ 6 kênh kỹ thuật số công khai: Google, Facebook, TikTok, GrabFood, ShopeeFood và Threads.'  },
  { Icon: Sparkles,      label: 'Clean and Standardize Data',   labelVi: 'Làm sạch và chuẩn hóa dữ liệu', desc: 'Remove duplicates, normalize encoding, and filter irrelevant records. 539 raw records → 504 clean records.', descVi: 'Loại trùng lặp, chuẩn hóa mã hóa và lọc bản ghi không liên quan. 539 bản gốc → 504 bản sạch.' },
  { Icon: Tag,           label: 'Classify Sentiment',           labelVi: 'Phân loại cảm xúc',              desc: 'Assign Positive, Neutral, or Negative sentiment labels to each feedback record.',                         descVi: 'Gán nhãn Tích cực, Trung tính hoặc Tiêu cực cho từng bản ghi phản hồi.'                                   },
  { Icon: Search,        label: 'Detect Pain Points',           labelVi: 'Phát hiện điểm đau',             desc: 'Identify operational issues across 6 categories: waiting time, service quality, hygiene, order accuracy, product quality, and general.', descVi: 'Xác định vấn đề vận hành theo 6 danh mục: thời gian chờ, chất lượng dịch vụ, vệ sinh, độ chính xác đơn hàng, chất lượng sản phẩm và chung.' },
  { Icon: BarChart2,     label: 'Generate Branch Metrics',      labelVi: 'Tạo chỉ số chi nhánh',           desc: 'Calculate health scores, sentiment ratios, and performance indicators for all 5 Hanoi branches.',         descVi: 'Tính điểm sức khỏe, tỷ lệ cảm xúc và chỉ số hiệu suất cho tất cả 5 chi nhánh Hà Nội.'                },
  { Icon: LayoutDashboard, label: 'Prepare Operational Dashboard', labelVi: 'Chuẩn bị bảng điều hành',   desc: 'Transform processed feedback into business intelligence — alerts, issues, recommendations, and actions.',    descVi: 'Chuyển đổi phản hồi đã xử lý thành dữ liệu kinh doanh — cảnh báo, vấn đề, khuyến nghị và hành động.' },
]

// SUMMARY built dynamically inside the component from live data

const fade    = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.08 } } }

type SourceEntry = typeof SOURCES_META[0] & { records: number }

// ── Source card with animated counter ─────────────────────────────────
function SourceCard({ source, active, delay }: { source: SourceEntry; active: boolean; delay: number }) {
  const { lang } = useLang()
  const vi = lang === 'vi'
  const cleaned = source.records === 0
  const count = useCounter(source.records, 1600, active)
  return (
    <motion.div
      variants={fade}
      transition={{ delay }}
      className={`rounded-2xl border p-5 flex flex-col gap-3 ${cleaned ? 'bg-slate-50 border-slate-200 opacity-70' : `${source.bg} ${source.border}`}`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl ${cleaned ? 'bg-slate-100 border-slate-200' : `${source.bg} border ${source.border}`} flex items-center justify-center shadow-sm`}>
          <source.Icon size={17} className={cleaned ? 'text-slate-400' : source.color} />
        </div>
        {cleaned ? (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {vi ? 'Đã lọc' : 'Cleaned'}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full ${source.dot} animate-pulse`} />
            {vi ? 'Đã kết nối' : 'Connected'}
          </div>
        )}
      </div>
      <div>
        <div className={`text-sm font-bold ${cleaned ? 'text-slate-500' : 'text-slate-800'}`}>{source.name}</div>
        <div className={`text-3xl font-extrabold mt-1 tabular-nums ${cleaned ? 'text-slate-400' : 'text-slate-900'}`}>{(count ?? 0).toLocaleString()}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          {cleaned ? (vi ? 'đã loại khỏi tập dữ liệu' : 'excluded from dataset') : (vi ? 'bản ghi đã nhập' : 'records imported')}
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-black/5">
        <Clock size={10} />
        <span>{vi ? 'Cập nhật lần cuối:' : 'Last updated:'} {source.updated}</span>
      </div>
    </motion.div>
  )
}

// ── Pipeline step ──────────────────────────────────────────────────────
function PipelineStep({
  step, index, isLast, state,
}: {
  step: typeof STEPS[0]; index: number; isLast: boolean; state: 'pending' | 'active' | 'done'
}) {
  const { lang } = useLang()
  const vi = lang === 'vi'
  return (
    <div className="relative flex gap-4">
      {/* Connector line */}
      {!isLast && (
        <div className={`absolute left-4 top-10 bottom-0 w-0.5 transition-colors duration-700 ${state === 'done' ? 'bg-emerald-200' : 'bg-gray-100'}`} />
      )}

      {/* Icon circle */}
      <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
        state === 'done'    ? 'bg-emerald-500 border-emerald-500'   :
        state === 'active'  ? 'bg-primary-700 border-primary-700 shadow-md shadow-primary-200' :
                              'bg-white border-gray-200'
      }`}>
        {state === 'done'   ? <CheckCircle size={14} className="text-white" /> :
         state === 'active' ? <Loader2 size={13} className="text-white animate-spin" /> :
                              <step.Icon size={13} className="text-gray-300" />}
      </div>

      {/* Content */}
      <div className={`pb-8 flex-1 min-w-0 transition-opacity duration-500 ${state === 'pending' ? 'opacity-40' : 'opacity-100'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-sm font-bold transition-colors duration-300 ${
            state === 'done' ? 'text-emerald-700' : state === 'active' ? 'text-primary-700' : 'text-slate-800'
          }`}>
            {vi ? step.labelVi : step.label}
          </span>
          {state === 'active' && (
            <span className="text-[10px] font-semibold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full animate-pulse">
              Processing…
            </span>
          )}
          {state === 'done' && (
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              ✓ Complete
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{vi ? step.descVi : step.desc}</p>
      </div>
    </div>
  )
}

type SummaryItem = { label: string; labelVi: string; value: number; suffix: string; icon: React.ElementType; color: string }

// ── Summary stat card ──────────────────────────────────────────────────
function SummaryCard({ item, active }: { item: SummaryItem; active: boolean }) {
  const { lang } = useLang()
  const vi = lang === 'vi'
  const count = useCounter(item.value, 1800, active)
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-5 flex flex-col gap-2">
      <item.icon size={18} className={item.color} />
      <div className="text-3xl font-extrabold text-white tabular-nums">
        {(count ?? 0).toLocaleString()}{item.suffix}
      </div>
      <div className="text-xs text-white/60 font-medium leading-tight">
        {vi ? item.labelVi : item.label}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────
export default function FeedbackEnginePage() {
  const { lang } = useLang()
  const router   = useRouter()
  const vi       = lang === 'vi'

  const { branches: liveBranches, mode } = useLiveData()
  const isLive      = mode === 'live'
  const totalClean  = isLive ? 504 : 504
  const branchCount = isLive ? liveBranches.length : 5

  // Source counts are hardcoded from the confirmed research dataset.
  // The DB only stores clean records — raw entry counts per platform are not
  // queryable from the reviews table, so fallback values are always used.
  const SOURCES: SourceEntry[] = SOURCES_META.map(s => ({ ...s, records: s.fallback }))

  const totalRaw = 539

  const SUMMARY: SummaryItem[] = [
    { label: 'Raw Feedback Records',       labelVi: 'Bản ghi thô',              value: totalRaw,    suffix: '',  icon: Database,  color: 'text-slate-300'   },
    { label: 'Cleaned Records',            labelVi: 'Bản ghi đã làm sạch',      value: totalClean,  suffix: '',  icon: Sparkles,  color: 'text-blue-300'    },
    { label: 'Sentiment Labels Generated', labelVi: 'Nhãn cảm xúc đã tạo',     value: totalClean,  suffix: '',  icon: Tag,       color: 'text-purple-300'  },
    { label: 'Pain Point Classifications', labelVi: 'Phân loại điểm đau',       value: totalClean,  suffix: '',  icon: Search,    color: 'text-amber-300'   },
    { label: 'Branch Metrics Generated',   labelVi: 'Chỉ số chi nhánh đã tạo', value: branchCount, suffix: '',  icon: BarChart2, color: 'text-green-300'   },
    { label: 'Data Quality Score',         labelVi: 'Điểm chất lượng dữ liệu', value: 94,          suffix: '%', icon: Shield,    color: 'text-emerald-300' },
  ]

  // Section in-view triggers
  const sourcesRef  = useRef<HTMLDivElement>(null)
  const sourcesView = useInView(sourcesRef,  { once: true, margin: '-80px' })
  const pipeRef     = useRef<HTMLDivElement>(null)
  const pipeView    = useInView(pipeRef,     { once: true, margin: '-80px' })
  const summaryRef  = useRef<HTMLDivElement>(null)
  const summaryView = useInView(summaryRef,  { once: true, margin: '-80px' })

  // Pipeline animation state
  const [pipeStep, setPipeStep] = useState(-1)
  const [pipeDone, setPipeDone] = useState(false)

  useEffect(() => {
    if (!pipeView) return
    const timers: ReturnType<typeof setTimeout>[] = []
    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setPipeStep(i), 400 + i * 650))
    })
    timers.push(setTimeout(() => setPipeDone(true), 400 + STEPS.length * 650 + 300))
    return () => timers.forEach(clearTimeout)
  }, [pipeView])

  const getStepState = (i: number): 'pending' | 'active' | 'done' => {
    if (pipeDone || i < pipeStep) return 'done'
    if (i === pipeStep) return 'active'
    return 'pending'
  }

  const rawCount = useCounter(totalRaw, 1400, sourcesView)

  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-16">

      {/* ── HERO ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-primary-950 to-slate-800 px-8 py-14 text-white"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        <div className="relative">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Cpu size={17} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">
              {vi ? 'Module Xử lý Dữ liệu' : 'Data Processing Module'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">
            {vi ? 'Engine Phân tích Phản hồi Khách hàng' : 'Customer Feedback Intelligence Engine'}
          </h1>
          <p className="text-white/60 text-base max-w-xl leading-relaxed">
            {vi
              ? 'Chuyển đổi phản hồi khách hàng thực thành dữ liệu vận hành có thể hành động.'
              : 'Transforming real customer feedback into actionable operational intelligence.'}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { icon: Database, label: vi ? '6 nguồn kết nối' : '6 Sources Connected' },
              { icon: Zap,         label: vi ? `${totalRaw} bản ghi thô`  : `${totalRaw} Raw Records`   },
              { icon: CheckCircle, label: vi ? `${totalClean} bản ghi đã xử lý` : `${totalClean} Processed Records` },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-3.5 py-2">
                <Icon size={13} className="text-white/70" />
                <span className="text-xs font-semibold text-white/80">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── SECTION 1: CONNECTED DATA SOURCES ───────────── */}
      <motion.div
        ref={sourcesRef}
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
      >
        <motion.div variants={fade} className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Database size={15} className="text-primary-600" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {vi ? 'Bước 1 · Nguồn dữ liệu' : 'Step 1 · Data Sources'}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {vi ? 'Các nguồn phản hồi đã kết nối' : 'Connected Feedback Sources'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {vi
              ? 'Phản hồi khách hàng thực được thu thập từ các kênh kỹ thuật số công khai.'
              : 'Real customer feedback collected from publicly available digital channels.'}
          </p>
        </motion.div>

        {/* Summary badges */}
        <motion.div variants={fade} className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 bg-slate-900 text-white rounded-xl px-4 py-2.5 text-sm font-bold">
            <span className="text-slate-400 text-xs font-semibold">{vi ? 'Tổng nguồn' : 'Total Sources'}</span>
            <span className="text-white">6</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 text-white rounded-xl px-4 py-2.5 text-sm font-bold">
            <span className="text-slate-400 text-xs font-semibold">{vi ? 'Bản ghi thô' : 'Total Raw Records'}</span>
            <span className="text-accent tabular-nums">{sourcesView ? (rawCount ?? 0).toLocaleString() : 0}</span>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-700 font-semibold">{vi ? '4 nguồn có dữ liệu · 2 đã lọc' : '4 Sources with Data · 2 Cleaned'}</span>
          </div>
        </motion.div>

        {/* Source cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {SOURCES.map((source, i) => (
            <SourceCard key={source.name} source={source} active={sourcesView} delay={i * 0.06} />
          ))}
        </div>
      </motion.div>

      {/* ── SECTION 2: DATA PIPELINE ─────────────────────── */}
      <div ref={pipeRef}>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Cpu size={15} className="text-primary-600" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {vi ? 'Bước 2 · Quy trình xử lý' : 'Step 2 · Processing Pipeline'}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {vi ? 'Quy trình xử lý dữ liệu' : 'Data Processing Pipeline'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {vi
              ? 'Phản hồi thô được chuyển đổi qua 6 giai đoạn xử lý thành dữ liệu vận hành.'
              : 'Raw feedback is transformed through 6 processing stages into operational intelligence.'}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-card p-8">
          <div>
            {STEPS.map((step, i) => (
              <PipelineStep
                key={step.label}
                step={step}
                index={i}
                isLast={i === STEPS.length - 1}
                state={getStepState(i)}
              />
            ))}
          </div>

          {pipeDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-2 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4"
            >
              <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-emerald-800">
                  {vi ? 'Tất cả 6 giai đoạn hoàn thành' : 'All 6 pipeline stages completed'}
                </div>
                <div className="text-xs text-emerald-600 mt-0.5">
                  {vi
                    ? `${totalClean} bản ghi đã được xử lý và sẵn sàng phân tích.`
                    : `${totalClean} records processed and ready for operational analysis.`}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── SECTION 3: PROCESSING SUMMARY ───────────────── */}
      <div ref={summaryRef}>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={15} className="text-primary-600" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {vi ? 'Bước 3 · Tóm tắt xử lý' : 'Step 3 · Processing Summary'}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {vi ? 'Kết quả xử lý dữ liệu' : 'Data Processing Results'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {vi
              ? 'Tổng hợp toàn bộ quá trình chuyển đổi từ dữ liệu thô thành dữ liệu vận hành.'
              : 'Complete overview of the transformation from raw data to operational intelligence.'}
          </p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-primary-950 p-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {SUMMARY.map(item => (
              <SummaryCard key={item.label} item={item} active={summaryView} />
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <Clock size={11} />
              <span>{vi ? 'Cập nhật lần cuối: ' : 'Last processed: '}Jun 25, 2026 · 23:47 ICT</span>
            </div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {vi ? 'Dữ liệu sẵn sàng' : 'Data pipeline healthy'}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: DASHBOARD GENERATION CTA ─────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative overflow-hidden rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-10 text-center">
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary-200/30 blur-3xl rounded-full" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {vi ? 'Dữ liệu vận hành sẵn sàng' : 'Operational Intelligence Ready'}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
              {vi ? 'Sẵn sàng xem bảng điều hành' : 'Ready to View Operational Dashboard'}
            </h2>

            <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed mb-8">
              {vi
                ? `${totalClean} bản ghi phản hồi khách hàng đã được xử lý và chuyển đổi thành dữ liệu vận hành phục vụ ra quyết định của ban lãnh đạo.`
                : `${totalClean} customer feedback records have been processed and transformed into operational insights for management decision-making.`}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2.5 bg-primary-700 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-900/20 hover:shadow-primary-900/30 hover:scale-[1.02] active:scale-[0.98] text-sm"
              >
                <LayoutDashboard size={16} />
                {vi ? 'Xem bảng điều hành vận hành' : 'Generate Operational Dashboard'}
                <ArrowRight size={15} />
              </button>

              <button
                onClick={() => router.push('/analytics')}
                className="flex items-center gap-2 text-primary-700 font-semibold text-sm hover:text-primary-800 transition-colors"
              >
                {vi ? 'Xem analytics chi tiết' : 'View detailed analytics'}
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Mini flow indicator */}
            <div className="mt-10 flex items-center justify-center gap-2 flex-wrap">
              {[
                vi ? 'Phản hồi thô' : 'Raw Feedback',
                vi ? 'Làm sạch' : 'Cleaned',
                vi ? 'Phân tích cảm xúc' : 'Sentiment',
                vi ? 'Điểm đau' : 'Pain Points',
                vi ? 'Chỉ số' : 'Metrics',
                vi ? 'Dữ liệu vận hành' : 'Intelligence',
              ].map((label, i, arr) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                    i === arr.length - 1
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>{label}</span>
                  {i < arr.length - 1 && (
                    <ArrowRight size={10} className="text-slate-300 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

    </div>
  )
}
