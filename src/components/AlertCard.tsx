'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { useLang } from '@/lib/LangContext'
import type { Alert } from '@/data/types'

const SEVERITY_VI: Record<string, string> = { High: 'Nghiêm trọng', Medium: 'Trung bình', Low: 'Thấp' }
const ACTION_LABEL_VI: Record<string, string> = {
  'View Issue': 'Xem vấn đề', 'View Actions': 'Xem hành động',
  'Investigate': 'Điều tra', 'View Branch': 'Xem chi nhánh',
}

interface Props { alert: Alert; index?: number }

const SEVERITY_STYLES = {
  High:   { bg: 'bg-red-50 border-red-200',   icon: AlertTriangle, iconColor: 'text-red-500',    badge: 'bg-red-100 text-red-700' },
  Medium: { bg: 'bg-amber-50 border-amber-200', icon: AlertCircle,   iconColor: 'text-amber-500',  badge: 'bg-amber-100 text-amber-700' },
  Low:    { bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle, iconColor: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
}

export default function AlertCard({ alert }: Props) {
  const router  = useRouter()
  const { lang } = useLang()
  const vi      = lang === 'vi'
  const styles  = SEVERITY_STYLES[alert.severity]
  const Icon    = styles.icon

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border ${styles.bg} transition-all`}>
      <div className="flex-shrink-0 mt-0.5">
        <Icon size={18} className={styles.iconColor} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles.badge}`}>
            {vi ? SEVERITY_VI[alert.severity] : alert.severity}
          </span>
          {alert.branchName && (
            <span className="text-[10px] text-slate-500 font-medium bg-white/60 px-2 py-0.5 rounded-full border border-white/50">
              {alert.branchName}
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-slate-800 mb-0.5">{vi ? (alert.titleVi ?? alert.title) : alert.title}</p>
        <p className="text-xs text-slate-500 leading-relaxed mb-2">{vi ? (alert.descriptionVi ?? alert.description) : alert.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">{timeAgo(alert.timestamp)}</span>
          <button
            onClick={() => router.push(alert.actionRoute)}
            className="flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-600 transition-colors"
          >
            {vi ? (ACTION_LABEL_VI[alert.actionLabel] ?? alert.actionLabel) : alert.actionLabel}
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
