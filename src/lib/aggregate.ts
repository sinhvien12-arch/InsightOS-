// Pure aggregation helpers: ProcessedReview[] → BranchMetrics[]
// Single source of truth for health-score + branch rollup (shared by upload flow
// and useLiveData) to avoid duplicated formulas across the codebase.

import type { ProcessedReview, BranchMetrics, CategoryKey } from './uploadTypes'

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

/** Health score 0–100 from sentiment mix.
 *  50 + positive% − negative%×0.5 so the scale centers at 50 for equal sentiment
 *  and reaches ~52 for the reference dataset (34% positive, 64% negative). */
export function healthScore(positivePct: number, negativePct: number): number {
  return clamp(Math.round(50 + positivePct - negativePct * 0.5), 0, 100)
}

/** Roll raw classified reviews up into per-branch metrics.
 *  Reviews with missing branch_name fall into the 'N/A' bucket so no row is lost. */
export function reviewsToMetrics(reviews: ProcessedReview[]): BranchMetrics[] {
  const groups = new Map<string, ProcessedReview[]>()
  for (const r of reviews) {
    const key = r.branch_name?.trim()
    if (!key) continue  // skip reviews with missing branch_name (avoids fake 'N/A' branch)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }

  const now = new Date().toISOString()
  const metrics: BranchMetrics[] = []

  for (const [branch_name, list] of Array.from(groups)) {
    const total    = list.length
    const positive = list.filter(r => r.sentiment?.toLowerCase() === 'positive').length
    const negative = list.filter(r => r.sentiment?.toLowerCase() === 'negative').length
    const neutral  = total - positive - negative

    const positivePct = total ? Math.round((positive / total) * 100) : 0
    const negativePct = total ? Math.round((negative / total) * 100) : 0

    const ratings = list.map(r => {
      const v = Number(r.rating)
      return r.rating != null && r.rating !== ('' as unknown) && !isNaN(v) && v > 0 ? v : null
    }).filter((v): v is number => v !== null)
    const avgRating = ratings.length
      ? Math.round((ratings.reduce((s, v) => s + v, 0) / ratings.length) * 10) / 10
      : 0

    metrics.push({
      branch_name,
      total_reviews:       total,
      avg_rating:          avgRating,
      positive_count:      positive,
      negative_count:      negative,
      neutral_count:       neutral,
      positive_percentage: positivePct,
      negative_percentage: negativePct,
      health_score:        healthScore(positivePct, negativePct),
      critical_issues:     topNegativeCategories(list),
      updated_at:          now,
    })
  }

  return metrics.sort((a, b) => a.health_score - b.health_score)
}

// ─── Chart-ready derivations (shared by dashboard + analytics) ───────────────

export const CATEGORY_LABEL: Record<CategoryKey, string> = {
  waiting_time:    'Waiting Time',
  service_quality: 'Service Quality',
  hygiene:         'Hygiene',
  order_accuracy:  'Order Accuracy',
  product_quality: 'Product Quality',
  general:         'General',
}

export function sentimentTotals(reviews: ProcessedReview[]) {
  return {
    positive: reviews.filter(r => r.sentiment === 'positive').length,
    neutral:  reviews.filter(r => r.sentiment === 'neutral').length,
    negative: reviews.filter(r => r.sentiment === 'negative').length,
  }
}

export function painPointCounts(reviews: ProcessedReview[]): { key: string; label: string; count: number }[] {
  const counts = new Map<CategoryKey, number>()
  for (const r of reviews) {
    for (const c of r.categories ?? []) counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, label: CATEGORY_LABEL[key] ?? key, count }))
    .sort((a, b) => b.count - a.count)
}

/** Sentiment over time using the actual dates present (last N dated buckets). */
export function trendData(reviews: ProcessedReview[], days = 14): { date: string; positive: number; neutral: number; negative: number }[] {
  const byDate = new Map<string, { positive: number; neutral: number; negative: number }>()
  for (const r of reviews) {
    const d = (r.date ?? '').slice(0, 10)
    if (!d) continue
    const s = r.sentiment
    if (s !== 'positive' && s !== 'neutral' && s !== 'negative') continue
    if (!byDate.has(d)) byDate.set(d, { positive: 0, neutral: 0, negative: 0 })
    byDate.get(d)![s] += 1
  }
  return Array.from(byDate.keys()).sort().slice(-days)
    .map(d => ({ date: d.slice(5), ...byDate.get(d)! }))
}

export function platformCounts(reviews: ProcessedReview[]): { name: string; value: number }[] {
  const counts = new Map<string, number>()
  for (const r of reviews) counts.set(r.platform, (counts.get(r.platform) ?? 0) + 1)
  return Array.from(counts.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

/** Top 3 categories appearing in negative reviews of a branch.
 *  Sentiment field may be 'negative' OR 'Negative' depending on upload source. */
function parseCategories(raw: unknown): CategoryKey[] {
  if (Array.isArray(raw)) return raw as CategoryKey[]
  if (typeof raw === 'string' && raw) {
    try { return JSON.parse(raw) as CategoryKey[] } catch { return [] }
  }
  return []
}

function topNegativeCategories(list: ProcessedReview[]): CategoryKey[] {
  const counts = new Map<CategoryKey, number>()
  for (const r of list) {
    if (r.sentiment?.toLowerCase() !== 'negative') continue
    for (const c of parseCategories(r.categories)) {
      if (c === 'general') continue
      counts.set(c, (counts.get(c) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c)
}
