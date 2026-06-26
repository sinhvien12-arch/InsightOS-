'use client'

import { motion } from 'framer-motion'
import { FileText, Download, AlertTriangle, TrendingDown, Zap, Star, BarChart3 } from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { useLiveData } from '@/lib/useLiveData'
import { branches as demoBranches, chainStats as demoChainStats } from '@/data/branches'
import { issueStats as demoIssueStats } from '@/data/issues'
import { actionStats } from '@/data/actions'
import ClosedLoopFlow from '@/components/ClosedLoopFlow'

const fade    = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.08 } } }

const HEALTH_COLOR = (s: number) =>
  s >= 70 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
  s >= 50 ? 'text-amber-700 bg-amber-50 border-amber-200' :
  'text-red-700 bg-red-50 border-red-200'

export default function ReportsPage() {
  const { lang, t } = useLang()
  const vi = lang === 'vi'

  const { mode, branches: liveBranches, chainStats: liveChain, issues: liveIssues } = useLiveData()
  const isLive = mode === 'live'

  const branches   = isLive ? liveBranches  : demoBranches
  const chain      = isLive ? liveChain     : demoChainStats

  // Derive issue stats from live data
  const issueStats = isLive ? {
    critical:   liveIssues.filter(i => i.priority === 'Critical').length,
    open:       liveIssues.filter(i => i.status === 'Open').length,
    inProgress: liveIssues.filter(i => i.status === 'In Progress').length,
    monitoring: liveIssues.filter(i => i.status === 'Monitoring').length,
    resolved:   liveIssues.filter(i => i.status === 'Resolved').length,
  } : demoIssueStats

  // Critical branches for the alert summary
  const criticalBranches = [...branches]
    .filter(b => b.healthScore < 50)
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 3)

  const today     = new Date()
  const dateStr   = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const dateStrVi = today.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div variants={fade} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <FileText size={20} className="text-primary-600" />
            <h1 className="text-2xl font-bold text-slate-900">{t('reports.execTitle')}</h1>
          </div>
          <p className="text-slate-500 text-sm">
            {t('reports.execSub')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border ${
            isLive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {isLive ? (vi ? 'Dữ liệu trực tiếp' : 'Live data') : (vi ? 'Dữ liệu mẫu' : 'Demo data')}
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-600 transition-colors"
          >
            <Download size={15} />
            {t('reports.export')}
          </button>
        </div>
      </motion.div>

      {/* Executive Summary Card */}
      <motion.div variants={fade} className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="bg-gradient-to-r from-primary-900 to-primary-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{t('reports.executive')}</h2>
              <p className="text-white/60 text-xs mt-0.5">{vi ? `Phê La Coffee Chain · ${dateStrVi}` : `Phê La Coffee Chain · ${dateStr}`}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold">{chain.avgHealthScore}</div>
              <div className="text-white/60 text-xs">{t('reports.chainScoreLabel')}</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Alert summary — dynamic critical branches */}
          {criticalBranches.length > 0 && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-red-700 mb-1">
                  {vi
                    ? `${criticalBranches.length} chi nhánh ở trạng thái nghiêm trọng`
                    : `${criticalBranches.length} branch${criticalBranches.length > 1 ? 'es' : ''} in Critical status`}
                </h3>
                <p className="text-xs text-red-600">
                  {criticalBranches.map(b => `${b.name.replace('Phê La ', '')} (${b.healthScore}/100)`).join(', ')}
                  {' · '}
                  {chain.negativePct}% {vi ? 'phản hồi tiêu cực trên toàn chuỗi' : 'negative feedback chain-wide'}
                </p>
              </div>
            </div>
          )}

          {/* Key metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: t('dash.totalReviews'), value: chain.totalReviews,  icon: BarChart3, color: 'text-primary-600' },
              { label: t('dash.avgRating'),    value: `${chain.avgRating}★`, icon: Star,    color: 'text-amber-500' },
              { label: t('negative'),          value: `${chain.negativePct}%`, icon: TrendingDown, color: 'text-red-500' },
              { label: vi ? 'Hành động đang mở' : 'Active Actions', value: actionStats.pending + actionStats.inProgress, icon: Zap, color: 'text-amber-500' },
            ].map((m, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                <m.icon size={16} className={`${m.color} mx-auto mb-1.5`} />
                <div className="text-xl font-extrabold text-slate-800">{m.value}</div>
                <div className="text-[10px] text-slate-500 font-medium">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Branch Status Report */}
      <motion.div variants={fade} className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
        <h2 className="text-base font-bold text-slate-800 mb-4">{t('reports.branchStatus')}</h2>
        <div className="space-y-3">
          {[...branches].sort((a, b) => a.healthScore - b.healthScore).map(branch => (
            <div key={branch.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className={`w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center flex-shrink-0 ${HEALTH_COLOR(branch.healthScore)}`}>
                <div className="text-lg font-extrabold leading-none">{branch.healthScore}</div>
                <div className="text-[9px] font-semibold">/100</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-800">{branch.name.replace('Phê La ', '')}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {branch.avgRating}★ · {branch.sentiment.negative}% {vi ? 'tiêu cực' : 'negative'} · {branch.reviewCount} {t('reports.reviewsLabel')}
                </div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${branch.healthScore >= 70 ? 'bg-emerald-500' : branch.healthScore >= 50 ? 'bg-amber-400' : 'bg-red-500'}`}
                    style={{ width: `${branch.healthScore}%` }}
                  />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-xs font-bold ${branch.healthScore > branch.prevScore ? 'text-emerald-600' : 'text-red-500'}`}>
                  {branch.healthScore > branch.prevScore ? '↑' : '↓'} {Math.abs(branch.healthScore - branch.prevScore)} pts
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{t('reports.prevMonth')}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Issues & Actions Summary */}
      <motion.div variants={fade} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h2 className="text-base font-bold text-slate-800 mb-4">{t('reports.issueStatus')}</h2>
          <div className="space-y-2.5">
            {[
              { label: t('critical'),          value: issueStats.critical,    color: 'bg-red-500' },
              { label: t('issues.open'),       value: issueStats.open,        color: 'bg-orange-400' },
              { label: t('issues.inProgress'), value: issueStats.inProgress,  color: 'bg-blue-500' },
              { label: t('issues.monitoring'), value: issueStats.monitoring,  color: 'bg-amber-400' },
              { label: t('issues.resolved'),   value: issueStats.resolved,    color: 'bg-emerald-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <div className="flex-1 text-sm text-slate-600">{item.label}</div>
                <div className="text-sm font-bold text-slate-800">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h2 className="text-base font-bold text-slate-800 mb-4">{t('reports.actionStatus')}</h2>
          <div className="space-y-2.5">
            {[
              { label: vi ? 'Chờ xử lý' : 'Pending',     value: actionStats.pending,    color: 'bg-slate-400' },
              { label: t('issues.inProgress'),             value: actionStats.inProgress, color: 'bg-blue-500' },
              { label: t('issues.monitoring'),             value: actionStats.monitoring, color: 'bg-amber-400' },
              { label: vi ? 'Hoàn thành' : 'Done',        value: actionStats.done,       color: 'bg-emerald-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <div className="flex-1 text-sm text-slate-600">{item.label}</div>
                <div className="text-sm font-bold text-slate-800">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-slate-500 mb-2">{t('reports.completionRate')}</div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.round((actionStats.done / actionStats.total) * 100)}%` }}
              />
            </div>
            <div className="text-xs font-bold text-emerald-600 mt-1">
              {Math.round((actionStats.done / actionStats.total) * 100)}% {t('reports.complete')}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Closed Loop Flow */}
      <motion.div variants={fade}>
        <ClosedLoopFlow />
      </motion.div>

      {/* Top recommendations */}
      <motion.div variants={fade} className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
        <h2 className="text-base font-bold text-slate-800 mb-4">
          {t('reports.topRecs')}
        </h2>
        <div className="space-y-3">
          {isLive && criticalBranches.length > 0
            ? criticalBranches.map((b, i) => (
                <div key={b.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 mt-0.5 ${i === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {i === 0 ? (vi ? 'Nghiêm trọng' : 'Critical') : (vi ? 'Cao' : 'High')}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-slate-800 mb-0.5">
                      {vi ? `Kiểm tra khẩn cấp tại ${b.name}` : `Emergency audit at ${b.name}`}
                    </div>
                    <div className="text-xs text-slate-500">
                      {vi
                        ? `Điểm sức khỏe ${b.healthScore}/100 · ${b.sentiment.negative}% đánh giá tiêu cực · ${b.reviewCount} đánh giá`
                        : `Health score ${b.healthScore}/100 · ${b.sentiment.negative}% negative reviews · ${b.reviewCount} reviews`}
                    </div>
                  </div>
                </div>
              ))
            : [
                { priority: vi ? 'Nghiêm trọng' : 'Critical', color: 'bg-red-100 text-red-700',
                  title: vi ? 'Kiểm tra khẩn cấp dịch vụ tại Thanh Thái' : 'Thanh Thái Emergency Service Audit',
                  desc: vi ? 'Kiểm tra 2 ngày + đào tạo lại nhân viên. Mục tiêu: sức khỏe 43 → 60 trong 30 ngày.' : '2-day audit + staff retraining. Target: health 43 → 60 within 30 days.' },
                { priority: vi ? 'Nghiêm trọng' : 'Critical', color: 'bg-red-100 text-red-700',
                  title: vi ? 'Thêm barista ca cao điểm tại TQH & Thanh Thái' : 'Add Peak-Hour Barista at TQH & Thanh Thái',
                  desc: vi ? '1 barista bổ sung 11:30am–1:30pm & 5:30–7:30pm. Giảm 40% phàn nàn thời gian chờ.' : '1 extra barista 11:30am–1:30pm & 5:30–7:30pm. Reduce wait complaints by 40%.' },
                { priority: vi ? 'Cao' : 'High', color: 'bg-orange-100 text-orange-700',
                  title: vi ? 'Giao thức ca tối toàn chuỗi' : 'Chain-wide Evening Shift Protocol',
                  desc: vi ? 'Bảng kiểm tra ca tối chuẩn hóa. Thí điểm tại NT & LVL, sau đó triển khai toàn chuỗi.' : 'Standardized evening ops checklist. Pilot at NT & LVL, then chain-wide.' },
              ].map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 mt-0.5 ${rec.color}`}>{rec.priority}</span>
                  <div>
                    <div className="text-sm font-bold text-slate-800 mb-0.5">{rec.title}</div>
                    <div className="text-xs text-slate-500">{rec.desc}</div>
                  </div>
                </div>
              ))
          }
        </div>
      </motion.div>

      {/* Footer note */}
      <motion.div variants={fade} className="text-center pb-4">
        <p className="text-xs text-slate-400">
          {vi
            ? `Báo cáo được tạo bởi Phê La InsightOS · Dựa trên ${chain.totalReviews} đánh giá khách hàng · ${dateStrVi}`
            : `Report generated by Phê La InsightOS · Based on ${chain.totalReviews} customer reviews · ${dateStr}`}
        </p>
      </motion.div>
    </motion.div>
  )
}
