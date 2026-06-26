'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Coffee, ArrowLeft, AlertTriangle, TrendingUp, TrendingDown,
  Minus, BarChart3, CircleDot, Activity, Star,
  LayoutDashboard, Cpu, Zap, MapPin, Brain, FlaskConical,
  FileText, BookOpen, Info, UploadCloud, Lock,
} from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { branches, chainStats } from '@/data/branches'
import { issues, issueStats } from '@/data/issues'
import { alerts } from '@/data/alerts'
import { priorityFromHealth, priorityColor } from '@/lib/utils'
const PRIORITY_BADGE: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700 border border-red-200',
  High:     'bg-orange-100 text-orange-700 border border-orange-200',
  Medium:   'bg-amber-100 text-amber-700 border border-amber-200',
  Low:      'bg-slate-100 text-slate-600 border border-slate-200',
}

const LOCKED_NAV = [
  { label: 'Command Center',   labelVI: 'Trung tâm chỉ huy', Icon: LayoutDashboard },
  { label: 'Feedback Engine',  labelVI: 'Phân tích phản hồi', Icon: Cpu },
  { label: 'Alerts',           labelVI: 'Cảnh báo',          Icon: AlertTriangle },
  { label: 'Issues',           labelVI: 'Vấn đề',            Icon: CircleDot },
  { label: 'Actions',          labelVI: 'Hành động',         Icon: Zap },
  { label: 'Upload Data',      labelVI: 'Tải dữ liệu',       Icon: UploadCloud },
  { label: 'Branches',         labelVI: 'Chi nhánh',         Icon: MapPin },
  { label: 'Insight Engine',   labelVI: 'Insight Engine',    Icon: Brain },
  { label: 'Simulator',        labelVI: 'Mô phỏng',          Icon: FlaskConical },
  { label: 'Analytics',        labelVI: 'Phân tích',         Icon: BarChart3 },
  { label: 'Reports',          labelVI: 'Báo cáo',           Icon: FileText },
  { label: 'Research',         labelVI: 'Nghiên cứu',        Icon: BookOpen },
  { label: 'About',            labelVI: 'Giới thiệu',        Icon: Info },
]

export default function DemoPage() {
  const { lang, toggle } = useLang()
  const router = useRouter()
  const [sidebarClicked, setSidebarClicked] = useState(false)

  const vi = lang === 'vi'

  function handleSidebarClick() {
    setSidebarClicked(true)
    setTimeout(() => setSidebarClicked(false), 1200)
  }

  const openIssues = issues.filter(i => i.status === 'Open' || i.status === 'In Progress')
  const highAlerts = alerts.filter(a => a.severity === 'High')

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">

      {/* ── LOCKED SIDEBAR ─────────────────────────────────────────────────── */}
      <aside className={`hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 flex-shrink-0 relative select-none transition-all duration-300 ${sidebarClicked ? 'blur-sm' : ''}`}>
        {/* Full-sidebar lock overlay — captures clicks and triggers blur */}
        <div
          className="absolute inset-0 z-10 cursor-not-allowed"
          onClick={handleSidebarClick}
          title={vi ? 'Đăng nhập để mở khóa' : 'Sign in to unlock'}
        />

        {/* Click feedback toast */}
        {sidebarClicked && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="bg-slate-800/90 backdrop-blur-sm text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
              <Lock size={12} className="text-amber-400" />
              {vi ? 'Đăng nhập để mở khóa' : 'Sign in to unlock'}
            </div>
          </div>
        )}

        {/* Brand */}
        <div className="px-4 pt-5 pb-4 border-b border-gray-50 opacity-40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-700 flex items-center justify-center">
              <Coffee size={14} className="text-white" />
            </div>
            <span className="font-bold text-slate-800 text-sm">Phê La InsightOS</span>
          </div>
        </div>

        {/* Lock badge */}
        <div className="px-4 py-2.5 flex items-center gap-2 bg-amber-50 border-b border-amber-100">
          <Lock size={12} className="text-amber-600 flex-shrink-0" />
          <span className="text-[11px] font-bold text-amber-700">
            {vi ? 'CHẾ ĐỘ DEMO — KHÓA' : 'DEMO MODE — LOCKED'}
          </span>
        </div>

        {/* Nav items — greyed out */}
        <div className="flex-1 overflow-y-auto py-3 opacity-40">
          <div className="px-3 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2">
              {vi ? 'Vận hành' : 'Operations'}
            </span>
          </div>
          <div className="space-y-0.5 px-2">
            {LOCKED_NAV.map(({ label, labelVI, Icon }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400"
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{vi ? labelVI : label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar footer note */}
        <div className="p-4 border-t border-gray-50 opacity-40">
          <p className="text-[10px] text-slate-400 text-center">
            {vi ? 'Đăng nhập để mở khóa' : 'Sign in to unlock all features'}
          </p>
        </div>
      </aside>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
          <div className="px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
              >
                <ArrowLeft size={15} />
                <span className="hidden sm:inline">{vi ? 'Trang chủ' : 'Home'}</span>
              </button>
              <span className="text-gray-200 hidden sm:inline">|</span>
              <div className="flex items-center gap-2 lg:hidden">
                <div className="w-6 h-6 rounded-lg bg-primary-700 flex items-center justify-center">
                  <Coffee size={11} className="text-white" />
                </div>
                <span className="font-bold text-slate-800 text-sm">InsightOS</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={toggle} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors hidden sm:block">
                {vi ? 'EN' : 'VI'}
              </button>
            </div>
          </div>

          {/* Demo banner */}
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 text-center">
            <p className="text-xs text-amber-800 font-medium">
              <span className="font-bold">
                {vi ? '🔒 Chế độ Demo —' : '🔒 Demo Mode —'}
              </span>{' '}
              {vi
                ? '504 đánh giá mẫu · Nhấn "Trang chủ" để quay lại và đăng nhập'
                : '504 sample reviews · Click "Back to Home" to return and sign in'}
            </p>
          </div>
        </header>

        {/* Dashboard content */}
        <main className="flex-1 px-5 py-6 space-y-5 max-w-5xl mx-auto w-full">

          {/* KPI Strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: vi ? 'Tổng đánh giá' : 'Total Reviews',   val: chainStats.totalReviews,           color: 'text-slate-800' },
              { label: vi ? 'Điểm sức khỏe' : 'Chain Health',    val: `${chainStats.avgHealthScore}/100`, color: 'text-amber-600' },
              { label: vi ? 'Tích cực' : 'Positive',             val: `${chainStats.positivePct}%`,       color: 'text-emerald-600' },
              { label: vi ? 'Tiêu cực' : 'Negative',             val: `${chainStats.negativePct}%`,       color: 'text-red-500' },
            ].map((k, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <div className="text-xs text-slate-400 font-medium mb-1">{k.label}</div>
                <div className={`text-3xl font-extrabold ${k.color}`}>{k.val}</div>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Branch Rankings */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                <BarChart3 size={16} className="text-primary-600" />
                <h2 className="font-bold text-slate-800 text-sm">
                  {vi ? 'Hiệu suất chi nhánh' : 'Branch Performance'}
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {[...branches].sort((a, b) => b.healthScore - a.healthScore).map((b, i) => {
                  const p = priorityFromHealth(b.healthScore)
                  return (
                    <div key={b.id} className="px-5 py-3.5 flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-300 w-4">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">
                          {b.name.replace('Phê La ', '')}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {b.reviewCount} {vi ? 'đánh giá' : 'reviews'} · {b.avgRating}★
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-extrabold text-slate-800">{b.healthScore}</div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block ${priorityColor(p)}`}>{p}</span>
                      </div>
                      <div className="w-14 hidden sm:block">
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${b.healthScore >= 70 ? 'bg-emerald-400' : b.healthScore >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${b.healthScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Open Issues */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CircleDot size={16} className="text-red-500" />
                  <h2 className="font-bold text-slate-800 text-sm">
                    {vi ? 'Vấn đề đang mở' : 'Open Issues'}
                  </h2>
                </div>
                <span className="text-xs bg-red-50 text-red-600 border border-red-100 font-bold px-2 py-0.5 rounded-full">
                  {issueStats.critical} {vi ? 'nghiêm trọng' : 'critical'}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {openIssues.slice(0, 5).map(issue => (
                  <div key={issue.id} className="px-5 py-3.5 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[issue.priority]}`}>
                          {issue.priority === 'Critical' && <AlertTriangle size={9} className="inline mr-0.5" />}
                          {issue.priority}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{issue.code}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                        {vi ? (issue.titleVi ?? issue.title) : issue.title}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-slate-700">{issue.reviewCount}</div>
                      <div className={`flex items-center justify-end gap-0.5 text-[10px] mt-0.5 ${
                        issue.trend === 'Rising' ? 'text-red-500' : issue.trend === 'Falling' ? 'text-emerald-500' : 'text-slate-400'
                      }`}>
                        {issue.trend === 'Rising'  && <TrendingUp size={10} />}
                        {issue.trend === 'Falling' && <TrendingDown size={10} />}
                        {issue.trend === 'Stable'  && <Minus size={10} />}
                        {issue.trend}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Activity size={16} className="text-orange-500" />
              <h2 className="font-bold text-slate-800 text-sm">
                {vi ? 'Cảnh báo nghiêm trọng' : 'High Severity Alerts'}
              </h2>
              <span className="text-xs bg-orange-50 text-orange-600 border border-orange-100 font-bold px-2 py-0.5 rounded-full ml-auto">
                {highAlerts.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-50">
              {highAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="px-5 py-4">
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                    {alert.severity}
                  </span>
                  <p className="text-sm font-semibold text-slate-800 line-clamp-2 mt-2">
                    {vi ? (alert.titleVi ?? alert.title) : alert.title}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {vi ? (alert.descriptionVi ?? alert.description) : alert.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Sentiment bars */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} className="text-amber-500" />
              <h2 className="font-bold text-slate-800 text-sm">
                {vi ? 'Phân tích cảm xúc theo chi nhánh' : 'Sentiment by Branch'}
              </h2>
            </div>
            <div className="space-y-3">
              {branches.map(b => (
                <div key={b.id} className="flex items-center gap-3">
                  <div className="w-28 text-xs font-medium text-slate-600 truncate flex-shrink-0">
                    {b.name.replace('Phê La ', '')}
                  </div>
                  <div className="flex-1 flex h-4 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full" style={{ width: `${b.sentiment.positive}%` }} />
                    <div className="bg-slate-200 h-full" style={{ width: `${b.sentiment.neutral}%` }} />
                    <div className="bg-red-400 h-full"     style={{ width: `${b.sentiment.negative}%` }} />
                  </div>
                  <div className="text-xs text-slate-400 w-20 text-right flex-shrink-0">
                    <span className="text-emerald-600 font-semibold">{b.sentiment.positive}%</span>
                    {' / '}
                    <span className="text-red-500 font-semibold">{b.sentiment.negative}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
              {[
                { color: 'bg-emerald-400', label: vi ? 'Tích cực' : 'Positive' },
                { color: 'bg-slate-200',   label: vi ? 'Trung tính' : 'Neutral' },
                { color: 'bg-red-400',     label: vi ? 'Tiêu cực' : 'Negative' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className={`w-3 h-3 rounded-full ${s.color}`} />
                  {s.label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Info note */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3"
          >
            <Lock size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <span className="font-bold">
                {vi ? 'Chế độ Demo · ' : 'Demo Mode · '}
              </span>
              {vi
                ? 'Bạn đang xem dữ liệu mẫu với 504 đánh giá. Nhấn nút "Trang chủ" ở phía trên để quay lại và đăng nhập bằng tài khoản HSB.'
                : 'You are viewing sample data with 504 reviews. Click the "Back to Home" button above to return and sign in with your HSB account.'}
            </div>
          </motion.div>

          <p className="text-center text-xs text-slate-300 pb-6">
            © 2026 Phê La InsightOS · HSB Group 12 · Rule-based analysis · not machine learning
          </p>
        </main>
      </div>
    </div>
  )
}
