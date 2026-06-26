'use client'

import { ReactNode, useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label:      string
  value:      string | number
  sub?:       string
  icon?:      ReactNode
  trend?:     number       // positive = up, negative = down
  trendLabel?:string
  accent?:    boolean
  className?: string
}

export default function StatCard({ label, value, sub, icon, trend, trendLabel, accent, className }: StatCardProps) {
  const [displayed, setDisplayed] = useState(0)
  const isNumeric = typeof value === 'number'

  useEffect(() => {
    if (!isNumeric) return
    const target  = value as number
    const dur     = 1000
    const steps   = 40
    const inc     = target / steps
    let current   = 0
    const timer   = setInterval(() => {
      current += inc
      if (current >= target) { setDisplayed(target); clearInterval(timer) }
      else setDisplayed(Math.round(current))
    }, dur / steps)
    return () => clearInterval(timer)
  }, [value, isNumeric])

  const TrendIcon = trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend === undefined ? '' : trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-slate-400'

  return (
    <div className={cn(
      'rounded-2xl p-5 border',
      accent
        ? 'bg-primary-700 text-white border-primary-600'
        : 'bg-white border-gray-100 shadow-card',
      className,
    )}>
      <div className="flex items-start justify-between mb-3">
        <span className={cn('text-xs font-medium uppercase tracking-wider', accent ? 'text-primary-200' : 'text-slate-400')}>
          {label}
        </span>
        {icon && (
          <span className={cn('p-2 rounded-xl', accent ? 'bg-white/10' : 'bg-primary-50')}>
            {icon}
          </span>
        )}
      </div>

      <div className={cn('text-3xl font-bold mb-1', accent ? 'text-white' : 'text-slate-900')}>
        {isNumeric ? displayed : value}
      </div>

      {(sub || trend !== undefined) && (
        <div className="flex items-center gap-2 mt-1">
          {trend !== undefined && TrendIcon && (
            <span className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
              <TrendIcon size={12} />
              {Math.abs(trend)}%
            </span>
          )}
          {(trendLabel || sub) && (
            <span className={cn('text-xs', accent ? 'text-primary-200' : 'text-slate-400')}>
              {trendLabel ?? sub}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
