// Pure builder: turns the current dataset (live or demo) into a compact text
// snapshot for the AI analyst prompt. Kept dependency-free so both chat pages
// and tests can use it.

export interface CtxReview {
  branchName?: string
  sentiment:   string
  rating?:     number | null
  text:        string
}

export interface CtxBranch {
  name:          string
  healthScore:   number
  avgRating:     number
  reviewCount:   number
  sentiment:     { positive: number; negative: number }
  topPainPoints: { label: string; count: number }[]
}

export interface CtxInput {
  mode:       'live' | 'demo'
  chainStats: { totalReviews: number; avgHealthScore: number; avgRating: number; positivePct: number; negativePct: number }
  branches:   CtxBranch[]
  reviews:    CtxReview[]
}

export const SAMPLE_SIZE = 40
const TEXT_MAX = 160

/** Evenly sample reviews across branch + sentiment so no single bucket dominates. */
function sampleReviews(reviews: CtxReview[], size: number): CtxReview[] {
  if (reviews.length <= size) return reviews
  const step = reviews.length / size
  const out: CtxReview[] = []
  for (let i = 0; i < size; i++) out.push(reviews[Math.floor(i * step)])
  return out
}

export function buildContext({ mode, chainStats, branches, reviews }: CtxInput): string {
  const lines: string[] = []

  lines.push(`Data mode: ${mode.toUpperCase()} (${mode === 'live' ? 'uploaded data' : 'sample/demo data'}).`)
  lines.push(
    `Chain: ${chainStats.totalReviews} reviews | avg health ${chainStats.avgHealthScore}/100 | ` +
    `avg rating ${chainStats.avgRating}★ | positive ${chainStats.positivePct}% | negative ${chainStats.negativePct}%.`,
  )

  lines.push('', 'Branches:')
  for (const b of branches) {
    const pains = b.topPainPoints.slice(0, 3).map(p => `${p.label}(${p.count})`).join(', ') || 'n/a'
    lines.push(
      `- ${b.name}: health ${b.healthScore}/100, rating ${b.avgRating}★, ${b.reviewCount} reviews, ` +
      `+${b.sentiment.positive}%/-${b.sentiment.negative}%, top issues: ${pains}`,
    )
  }

  const sample = sampleReviews(reviews, SAMPLE_SIZE)
  if (sample.length) {
    lines.push('', `Sample reviews (${sample.length} of ${reviews.length}):`)
    for (const r of sample) {
      const text = r.text.length > TEXT_MAX ? r.text.slice(0, TEXT_MAX) + '…' : r.text
      const rating = r.rating != null ? `${r.rating}★` : '-'
      const bn = (r.branchName ?? '?').slice(0, 40)
      lines.push(`- [${bn} | ${r.sentiment} | ${rating}] ${text}`)
    }
  }

  return lines.join('\n')
}
