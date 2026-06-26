'use client'

import { motion } from 'framer-motion'
import { Brain, TrendingUp, Shield, Zap, Target, BarChart3, Coffee, ArrowRight } from 'lucide-react'
import { useLang } from '@/lib/LangContext'

const fade    = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.1 } } }

export default function AboutPage() {
  const { lang, t } = useLang()
  const vi = lang === 'vi'

  const benefits = [
    {
      icon: TrendingUp,
      title: vi ? 'Cải thiện điểm sức khỏe chuỗi' : 'Improve Chain Health Score',
      desc: vi
        ? 'Từ 54 lên 70+ trong 90 ngày thông qua hành động có mục tiêu dựa trên dữ liệu.'
        : 'From 54 to 70+ within 90 days through targeted, data-driven actions.',
      stat: '+12 pts',
    },
    {
      icon: Shield,
      title: vi ? 'Phát hiện vấn đề sớm hơn' : 'Detect Issues Earlier',
      desc: vi
        ? 'Phát hiện sụt giảm cảm xúc trong 24 giờ thay vì chờ báo cáo hàng tuần.'
        : 'Detect sentiment drops within 24 hours instead of waiting for weekly reports.',
      stat: '24h',
    },
    {
      icon: Zap,
      title: vi ? 'Quyết định nhanh hơn' : 'Faster Decision-Making',
      desc: vi
        ? 'Khuyến nghị AI sẵn sàng ngay lập tức — không mất hàng giờ phân tích bảng tính.'
        : 'AI recommendations ready instantly — no hours spent analyzing spreadsheets.',
      stat: '10×',
    },
    {
      icon: Target,
      title: vi ? 'Hành động có mục tiêu' : 'Targeted Actions',
      desc: vi
        ? 'Mỗi khuyến nghị gắn với chi nhánh cụ thể, tác động dự kiến và nỗ lực thực hiện.'
        : 'Each recommendation tied to a specific branch, expected impact, and implementation effort.',
      stat: '100%',
    },
  ]

  const roadmap = [
    { phase: 'Phase 1', label: vi ? 'Hiện tại — Proof of Concept' : 'Now — Proof of Concept', done: true,
      items: ['Secondary data aggregation', 'Sentiment analysis', 'Branch health scoring', 'AI recommendations', 'Scenario simulation'] },
    { phase: 'Phase 2', label: vi ? 'Q3 2026 — Live Data Integration' : 'Q3 2026 — Live Data Integration', done: false,
      items: ['Real-time API connections (GrabFood, Google, Facebook)', 'Automated daily sync', 'Push notification alerts', 'Multi-user role access'] },
    { phase: 'Phase 3', label: vi ? 'Q1 2027 — Predictive Intelligence' : 'Q1 2027 — Predictive Intelligence', done: false,
      items: ['Predictive demand forecasting', 'Churn risk scoring per customer segment', 'Automated intervention triggers', 'Integration with POS & ERP'] },
    { phase: 'Phase 4', label: vi ? 'Q3 2027 — Scale & Expand' : 'Q3 2027 — Scale & Expand', done: false,
      items: ['Multi-brand support', 'Competitor benchmarking', 'Automated report distribution', 'Executive mobile dashboard'] },
  ]

  const stack = [
    { name: 'Next.js 14', role: 'App Framework', color: 'bg-slate-900' },
    { name: 'TypeScript', role: 'Type Safety', color: 'bg-blue-600' },
    { name: 'Firebase Auth', role: 'Authentication', color: 'bg-amber-500' },
    { name: 'Tailwind CSS', role: 'UI Styling', color: 'bg-teal-600' },
    { name: 'Recharts', role: 'Data Visualization', color: 'bg-emerald-600' },
    { name: 'Framer Motion', role: 'Animations', color: 'bg-purple-600' },
  ]

  const dataRows = [
    { source: 'Google Reviews',    type: vi ? 'Điểm sao + văn bản' : 'Star ratings + text', coverage: vi ? 'Tất cả chi nhánh'     : 'All branches',          status: '✓ Connected' },
    { source: 'ShopeeFood Reviews',type: vi ? 'Điểm sao + văn bản' : 'Star ratings + text', coverage: vi ? 'Đơn giao hàng'        : 'Delivery orders',       status: '✓ Connected' },
    { source: 'GrabFood Reviews',  type: vi ? 'Điểm sao + văn bản' : 'Star ratings + text', coverage: vi ? 'Đơn giao hàng'        : 'Delivery orders',       status: '✓ Connected' },
    { source: 'TikTok Comments',   type: vi ? 'Văn bản + cảm xúc'  : 'Text + sentiment',   coverage: vi ? 'Nội dung thương hiệu' : 'Brand content',         status: '✓ Connected' },
    { source: 'Facebook Comments', type: vi ? 'Văn bản + tương tác': 'Text + reactions',   coverage: vi ? 'Trang thương hiệu'    : 'Brand page + branches', status: '○ Phase 2'   },
    { source: 'App Store Reviews', type: vi ? 'Điểm sao + văn bản' : 'Star ratings + text', coverage: vi ? 'Ứng dụng di động'     : 'Mobile app',            status: '○ Phase 2'   },
    { source: 'Threads',           type: vi ? 'Đề cập văn bản'     : 'Text mentions',      coverage: vi ? 'Đề cập thương hiệu'  : 'Brand mentions',        status: '○ Phase 2'   },
  ]

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto space-y-10"
    >
      {/* Hero */}
      <motion.div variants={fade} className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 rounded-3xl p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Coffee size={24} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-primary-200">Phê La</div>
              <div className="text-2xl font-extrabold">InsightOS</div>
            </div>
          </div>
          <p className="text-primary-100 text-lg font-medium max-w-2xl leading-relaxed">
            {vi
              ? 'Nền tảng Thông minh Vận hành AI — chuyển hóa phản hồi khách hàng rời rạc thành quyết định vận hành có thể hành động.'
              : 'An AI-Powered Operations Intelligence Platform that transforms fragmented customer feedback into actionable operational decisions.'}
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            {['AI-Powered', 'Evidence-Based', 'Real-time Monitoring', 'Decision Support'].map(tag => (
              <span key={tag} className="text-xs font-semibold bg-white/10 border border-white/20 rounded-full px-3 py-1">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="absolute right-8 bottom-8 opacity-10">
          <BarChart3 size={120} />
        </div>
      </motion.div>

      {/* What is InsightOS */}
      <motion.div variants={fade} className="bg-white rounded-2xl border border-gray-100 shadow-card p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          {t('about.whatIs')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-slate-600 leading-relaxed">
              {vi
                ? 'InsightOS là một Hệ thống Hỗ trợ Quyết định (DSS) được thiết kế riêng cho các chuỗi cà phê Việt Nam như Phê La. Nền tảng này tổng hợp phản hồi khách hàng từ nhiều nguồn, phát hiện xu hướng cảm xúc, xác định điểm đau vận hành và tạo ra các khuyến nghị có thể hành động.'
                : 'InsightOS is a Decision Support System (DSS) designed specifically for Vietnamese coffee chains like Phê La. It aggregates customer feedback from multiple sources, detects sentiment trends, identifies operational pain points, and generates actionable recommendations.'}
            </p>
            <p className="text-slate-600 leading-relaxed">
              {vi
                ? 'Thay vì đưa ra quyết định dựa trên cảm tính hoặc báo cáo hàng tuần chậm trễ, các nhà quản lý có thể thấy ngay lập tức điều gì đang xảy ra tại mỗi chi nhánh và tại sao — và nhận được hướng dẫn cụ thể về cần làm gì tiếp theo.'
                : 'Instead of making decisions based on intuition or delayed weekly reports, managers can see instantly what is happening at each branch and why — and receive specific guidance on what to do next.'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-3">
              {t('about.dataFlow')}
            </h3>
            <div className="space-y-2">
              {[
                { step: '01', label: vi ? 'Thu thập dữ liệu' : 'Data Collection', sub: 'Google, Facebook, TikTok, GrabFood, ShopeeFood' },
                { step: '02', label: vi ? 'Phân tích cảm xúc' : 'Sentiment Analysis', sub: vi ? 'Tích cực / Trung tính / Tiêu cực' : 'Positive / Neutral / Negative' },
                { step: '03', label: vi ? 'Tính điểm sức khỏe' : 'Health Scoring', sub: vi ? 'Công thức: Rating × 40 + Positive% × 0.4 − Negative% × 0.2' : 'Formula: Rating × 40 + Positive% × 0.4 − Negative% × 0.2' },
                { step: '04', label: vi ? 'Phát hiện điểm đau' : 'Pain Point Detection', sub: vi ? 'Thời gian chờ, Chất lượng dịch vụ, Không gian…' : 'Wait time, Service quality, Environment…' },
                { step: '05', label: vi ? 'Tạo khuyến nghị' : 'AI Recommendations', sub: vi ? 'Hành động ưu tiên với tác động dự kiến' : 'Prioritized actions with expected impact' },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {s.step}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{s.label}</div>
                    <div className="text-[10px] text-slate-500">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Business Benefits */}
      <motion.div variants={fade}>
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          {t('about.benefits')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {benefits.map((b, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <b.icon size={20} className="text-primary-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-slate-800">{b.title}</h3>
                  <span className="text-lg font-extrabold text-primary-700">{b.stat}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Roadmap */}
      <motion.div variants={fade} className="bg-white rounded-2xl border border-gray-100 shadow-card p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          {t('about.roadmap')}
        </h2>
        <div className="space-y-4">
          {roadmap.map((phase, i) => (
            <div key={i} className={`rounded-xl border p-5 ${phase.done ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${phase.done ? 'bg-primary-700' : 'bg-gray-200'}`}>
                  {phase.done
                    ? <span className="text-white text-xs font-bold">✓</span>
                    : <ArrowRight size={10} className="text-gray-500" />
                  }
                </div>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${phase.done ? 'text-primary-700' : 'text-slate-400'}`}>{phase.phase}</span>
                  <span className="text-xs text-slate-500 ml-2">{phase.label}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 ml-9">
                {phase.items.map(item => (
                  <span key={item} className={`text-xs px-2.5 py-1 rounded-full font-medium ${phase.done ? 'bg-primary-100 text-primary-700' : 'bg-white border border-gray-200 text-slate-500'}`}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tech Stack */}
      <motion.div variants={fade} className="bg-white rounded-2xl border border-gray-100 shadow-card p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          {t('about.techStack')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stack.map(s => (
            <div key={s.name} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white text-xs font-bold">{s.name[0]}</span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">{s.name}</div>
                <div className="text-[10px] text-slate-500">{s.role}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>{vi ? 'Lưu ý về dữ liệu: ' : 'Data Note: '}</strong>
            {vi
              ? 'Đây là proof-of-concept mô phỏng môi trường thông minh khách hàng trực tiếp bằng dữ liệu thứ cấp công khai. Trong triển khai thực tế, dữ liệu sẽ được đồng bộ hóa theo thời gian thực từ Google, Facebook, TikTok, GrabFood và ShopeeFood thông qua API chính thức.'
              : 'This is a proof-of-concept simulating a live customer intelligence environment using publicly available secondary data. In a real deployment, data would sync in real-time from Google, Facebook, TikTok, GrabFood, and ShopeeFood via official APIs.'}
          </p>
        </div>
      </motion.div>

      {/* Data Strategy */}
      <motion.div variants={fade} className="bg-white rounded-2xl border border-gray-100 shadow-card p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          {t('about.dataStrategy')}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400">{t('about.colSource')}</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400">{t('about.colType')}</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400">{t('about.colCoverage')}</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400">{t('about.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {dataRows.map(row => (
                <tr key={row.source} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-xs font-semibold text-slate-700">{row.source}</td>
                  <td className="py-2.5 px-3 text-xs text-slate-500">{row.type}</td>
                  <td className="py-2.5 px-3 text-xs text-slate-500">{row.coverage}</td>
                  <td className={`py-2.5 px-3 text-xs font-semibold ${row.status.startsWith('✓') ? 'text-emerald-600' : 'text-slate-400'}`}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Credits */}
      <motion.div variants={fade} className="text-center py-6 text-xs text-slate-400 space-y-1">
        <div className="font-bold text-slate-600">Phê La InsightOS v1.0</div>
        <div>Built as a Digital Transformation proof-of-concept · June 2026</div>
        <div>HSB University · Group 12</div>
      </motion.div>
    </motion.div>
  )
}
