import { cn } from '@/lib/utils'

type Variant = 'high' | 'medium' | 'low' | 'positive' | 'neutral' | 'negative' | 'default'

interface BadgeProps {
  variant?:  Variant
  children:  React.ReactNode
  className?: string
  dot?:      boolean
}

const STYLES: Record<Variant, string> = {
  high:     'bg-red-50   text-red-700   border-red-200',
  medium:   'bg-amber-50 text-amber-700 border-amber-200',
  low:      'bg-green-50 text-green-700 border-green-200',
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  neutral:  'bg-slate-50  text-slate-600  border-slate-200',
  negative: 'bg-red-50   text-red-700   border-red-200',
  default:  'bg-gray-50  text-gray-600  border-gray-200',
}

const DOT_STYLES: Record<Variant, string> = {
  high:     'bg-red-500',
  medium:   'bg-amber-500',
  low:      'bg-green-500',
  positive: 'bg-emerald-500',
  neutral:  'bg-slate-400',
  negative: 'bg-red-500',
  default:  'bg-gray-400',
}

export default function Badge({ variant = 'default', children, className, dot }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      STYLES[variant],
      className,
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', DOT_STYLES[variant])} />}
      {children}
    </span>
  )
}
