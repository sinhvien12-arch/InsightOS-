export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60)   return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)   return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function sentimentColor(s: string): string {
  if (s === 'Positive') return 'text-emerald-600'
  if (s === 'Negative') return 'text-red-500'
  return 'text-slate-400'
}

export function healthColor(score: number): string {
  if (score >= 75) return '#10b981'
  if (score >= 55) return '#f59e0b'
  return '#ef4444'
}

export function starDisplay(rating: number | null): string {
  if (rating === null) return '—'
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

export function priorityFromHealth(score: number): 'Critical' | 'High' | 'Medium' | 'Low' {
  if (score < 60) return 'Critical'
  if (score < 75) return 'High'
  if (score < 88) return 'Medium'
  return 'Low'
}

export function priorityColor(p: string): string {
  if (p === 'Critical') return 'text-red-700 bg-red-50 border-red-200'
  if (p === 'High')     return 'text-orange-700 bg-orange-50 border-orange-200'
  if (p === 'Medium')   return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-emerald-700 bg-emerald-50 border-emerald-200'
}

export function recommendationForPainPoint(painPoint: string): string {
  const map: Record<string, string> = {
    WaitingTime:     'Add one barista during peak hours.',
    ServiceQuality:  'Staff retraining and service audit.',
    ProductQuality:  'Increase inventory planning and quality checks.',
    Delivery:        'Activate real-time order tracking notifications.',
    Environment:     'Improve seating arrangement and store layout.',
    Pricing:         'Review promotions and value bundles.',
    Seating:         'Reconfigure floor plan to increase seating capacity.',
    Other:           'Conduct branch operations review.',
  }
  return map[painPoint] ?? 'Conduct operations review.'
}

export function expectedImprovementFromPriority(priority: string): string {
  const map: Record<string, string> = {
    Critical: '+15 satisfaction points',
    High:     '+10 satisfaction points',
    Medium:   '+6 satisfaction points',
    Low:      '+3 satisfaction points',
  }
  return map[priority] ?? '+5 satisfaction points'
}
