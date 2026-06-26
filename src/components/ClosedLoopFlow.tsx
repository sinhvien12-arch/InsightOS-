'use client'

import { AlertCircle, Brain, Zap, Wrench, BarChart2, Eye, TrendingUp, ChevronRight } from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { closedLoopSteps, closedLoopStats } from '@/data/closedLoop'

const ICONS = [AlertCircle, Brain, Zap, Wrench, BarChart2, Eye, TrendingUp]

const COLOR_MAP: Record<string, { bg: string; icon: string; badge: string; bar: string }> = {
  red:     { bg: 'bg-red-50',     icon: 'text-red-500',     badge: 'bg-red-100 text-red-700',     bar: 'bg-red-400'     },
  purple:  { bg: 'bg-purple-50',  icon: 'text-purple-500',  badge: 'bg-purple-100 text-purple-700', bar: 'bg-purple-400' },
  amber:   { bg: 'bg-amber-50',   icon: 'text-amber-500',   badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400'   },
  blue:    { bg: 'bg-blue-50',    icon: 'text-blue-500',    badge: 'bg-blue-100 text-blue-700',   bar: 'bg-blue-400'    },
  teal:    { bg: 'bg-teal-50',    icon: 'text-teal-500',    badge: 'bg-teal-100 text-teal-700',   bar: 'bg-teal-400'    },
  green:   { bg: 'bg-green-50',   icon: 'text-green-600',   badge: 'bg-green-100 text-green-700', bar: 'bg-green-400'   },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
}

interface Props {
  compact?: boolean
}

export default function ClosedLoopFlow({ compact = false }: Props) {
  const { t, lang } = useLang()
  const vi = lang === 'vi'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">{t('loop.title')}</h3>
          {!compact && (
            <p className="text-xs text-slate-500 mt-0.5">{t('loop.subtitle')}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-xl font-extrabold text-primary-700">{closedLoopStats.coveragePct}%</div>
          <div className="text-[10px] text-slate-400">{t('loop.coverage')}</div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
        {closedLoopSteps.map((step, i) => {
          const Icon = ICONS[i]
          const c = COLOR_MAP[step.color]
          const isLast = i === closedLoopSteps.length - 1
          const isPending = step.status === 'pending'

          return (
            <div key={step.key} className="flex items-center min-w-0">
              <div className={`flex-shrink-0 rounded-xl p-2.5 ${isPending ? 'bg-gray-50 opacity-50' : c.bg} min-w-[90px] text-center`}>
                <div className={`flex justify-center mb-1.5 ${isPending ? 'text-gray-300' : c.icon}`}>
                  <Icon size={compact ? 14 : 16} />
                </div>
                <div className={`text-[10px] font-semibold leading-tight text-slate-700 ${isPending ? 'text-gray-400' : ''}`}>
                  {vi ? step.labelVi : step.label}
                </div>
                <div className={`mt-1 text-[11px] font-extrabold ${isPending ? 'text-gray-300' : c.icon}`}>
                  {step.count}
                </div>
                <div className={`text-[9px] ${isPending ? 'text-gray-300' : 'text-slate-400'}`}>
                  {vi ? step.unitVi : step.unit}
                </div>
                {/* status indicator */}
                <div className="mt-1.5">
                  {step.status === 'complete' && (
                    <span className="inline-block text-[9px] font-semibold bg-green-100 text-green-700 rounded-full px-1.5 py-0.5">✓</span>
                  )}
                  {step.status === 'active' && (
                    <span className={`inline-block text-[9px] font-semibold ${c.badge} rounded-full px-1.5 py-0.5`}>{t('loop.active2')}</span>
                  )}
                  {step.status === 'pending' && (
                    <span className="inline-block text-[9px] text-gray-300 rounded-full px-1.5 py-0.5">—</span>
                  )}
                </div>
              </div>
              {!isLast && (
                <ChevronRight size={12} className="text-gray-300 flex-shrink-0 mx-0.5" />
              )}
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      {!compact && (
        <div className="mt-4 pt-3 border-t border-gray-50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-500">
              {closedLoopStats.stagesActive} {t('loop.stagesActive')} · {closedLoopStats.coveragePct}% {t('loop.coverage')}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">
              {closedLoopStats.actionsImproved} {t('loop.confirmed')} {t('loop.improvement')}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-400 via-blue-400 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${closedLoopStats.coveragePct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
