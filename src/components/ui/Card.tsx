import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children:  ReactNode
  className?: string
  glass?:    boolean
  hover?:    boolean
  onClick?:  () => void
}

export default function Card({ children, className, glass, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl p-5',
        glass
          ? 'bg-white/70 backdrop-blur-md border border-white/30 shadow-card'
          : 'bg-white border border-gray-100 shadow-card',
        hover && 'cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5',
        className,
      )}
    >
      {children}
    </div>
  )
}
