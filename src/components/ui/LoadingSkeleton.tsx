import { cn } from '@/lib/utils'

interface SkeletonProps { className?: string }

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse bg-gray-200 rounded-xl', className)} />
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}
