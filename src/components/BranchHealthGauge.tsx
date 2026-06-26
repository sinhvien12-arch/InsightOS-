'use client'

import { healthColor } from '@/lib/utils'

interface Props {
  score:     number
  prevScore?: number
  size?:     'sm' | 'md' | 'lg'
}

export default function BranchHealthGauge({ score, prevScore, size = 'lg' }: Props) {
  const color   = healthColor(score)
  const diff    = prevScore !== undefined ? score - prevScore : null
  const radius  = size === 'sm' ? 40 : size === 'md' ? 55 : 72
  const stroke  = size === 'sm' ? 6  : size === 'md' ? 8  : 10
  const svgSize = (radius + stroke) * 2

  // Arc: 270-degree sweep (from 135° to 405°)
  const startAngle = 135
  const sweep      = 270
  const pct        = Math.min(100, Math.max(0, score)) / 100
  const endAngle   = startAngle + sweep * pct

  function polarToXY(cx: number, cy: number, r: number, angle: number) {
    const rad = (angle - 90) * (Math.PI / 180)
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  const cx = svgSize / 2
  const cy = svgSize / 2

  const start   = polarToXY(cx, cy, radius, startAngle)
  const end     = polarToXY(cx, cy, radius, endAngle)
  const bgEnd   = polarToXY(cx, cy, radius, startAngle + sweep)
  const large   = (sweep * pct) > 180 ? 1 : 0
  const bgLarge = sweep > 180 ? 1 : 0

  const arcPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`
  const bgPath  = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${bgLarge} 1 ${bgEnd.x} ${bgEnd.y}`

  const textSize = size === 'sm' ? 18 : size === 'md' ? 24 : 36
  const subSize  = size === 'sm' ? 9  : size === 'md' ? 11 : 13

  return (
    <div className="flex flex-col items-center">
      <svg width={svgSize} height={svgSize} className="overflow-visible">
        {/* Background track */}
        <path d={bgPath} fill="none" stroke="#e2e8f0" strokeWidth={stroke} strokeLinecap="round" />
        {/* Colored arc */}
        <path d={arcPath} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}55)` }} />
        {/* Score text */}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#0f172a"
          fontSize={textSize} fontWeight={700} fontFamily="'Plus Jakarta Sans', sans-serif">
          {score}
        </text>
        <text x={cx} y={cy + subSize + 2} textAnchor="middle" fill="#94a3b8"
          fontSize={subSize} fontWeight={500}>
          / 100
        </text>
      </svg>

      {diff !== null && (
        <div className={`text-sm font-semibold mt-1 ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {diff >= 0 ? '↑' : '↓'} {Math.abs(diff)} pts
          <span className="text-slate-400 font-normal text-xs ml-1">vs last month</span>
        </div>
      )}
    </div>
  )
}
