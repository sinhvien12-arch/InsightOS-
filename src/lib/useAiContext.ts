'use client'

import { useMemo } from 'react'
import { useLiveData } from './useLiveData'
import { buildContext, type CtxBranch, type CtxReview } from './aiContext'
import { branches as demoBranches, chainStats as demoChainStats, getBranch } from '@/data/branches'
import { reviews as demoReviews } from '@/data/reviews'
import type { Branch } from '@/data/types'
import type { BranchMetrics } from './uploadTypes'

const toCtxBranch = (b: Branch): CtxBranch => ({
  name:          b.name,
  healthScore:   b.healthScore,
  avgRating:     b.avgRating,
  reviewCount:   b.reviewCount,
  sentiment:     { positive: b.sentiment.positive, negative: b.sentiment.negative },
  topPainPoints: b.topPainPoints.map(p => ({ label: p.label, count: p.count })),
})

export interface AiContextResult {
  context:       string
  mode:          'live' | 'demo'
  chainStats:    { totalReviews: number; avgHealthScore: number; avgRating: number; positivePct: number; negativePct: number }
  criticalCount: number
  topIssueLabel: string
  metrics:       BranchMetrics[]
  liveBranches:  Branch[]
}

/** Builds the AI data-context string + quick stats from live (Supabase) or demo data. */
export function useAiContext(): AiContextResult {
  const { mode, metrics, branches: liveBranches, chainStats: liveChain, reviews: liveReviews } = useLiveData()
  const isLive = mode === 'live'

  return useMemo(() => {
    const srcBranches = isLive ? liveBranches : demoBranches
    const cs = isLive ? liveChain : demoChainStats
    const chainStats = {
      totalReviews:   cs.totalReviews,
      avgHealthScore: cs.avgHealthScore,
      avgRating:      cs.avgRating,
      positivePct:    cs.positivePct,
      negativePct:    cs.negativePct,
    }
    const reviews: CtxReview[] = isLive
      ? liveReviews.map(r => ({ branchName: r.branch_name, sentiment: r.sentiment, rating: r.rating, text: r.review_text }))
      : demoReviews.map(r => ({ branchName: getBranch(r.branchId)?.name, sentiment: r.sentiment.toLowerCase(), rating: r.rating, text: r.reviewText }))

    const ctxMode: 'live' | 'demo' = isLive ? 'live' : 'demo'
    const context = buildContext({ mode: ctxMode, chainStats, branches: srcBranches.map(toCtxBranch), reviews })

    const criticalCount = srcBranches.filter(b => b.healthScore < 50).length
    const painTotals = new Map<string, number>()
    for (const b of srcBranches) for (const p of b.topPainPoints) painTotals.set(p.label, (painTotals.get(p.label) ?? 0) + p.count)
    const topIssueLabel = Array.from(painTotals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

    return { context, mode: ctxMode, chainStats, criticalCount, topIssueLabel, metrics, liveBranches }
    // Re-derive when the live dataset's content shifts (not just row count).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, liveReviews.length, liveChain.totalReviews, liveChain.avgHealthScore, liveChain.positivePct, liveChain.negativePct])
}
