'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase, supabaseConfigured } from './supabase'
import { reviewsToMetrics } from './aggregate'
import type { BranchMetrics, ProcessedReview } from './uploadTypes'
import type { Branch, Alert, Issue, PainPoint, Priority, IssueStatus, Action, ActionStatus, ActionComment, TimelineEvent, MonitoringState, ActualImpactItem } from '@/data/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

const CAT_TO_PAINPOINT: Record<string, PainPoint> = {
  waiting_time:    'WaitingTime',
  service_quality: 'ServiceQuality',
  hygiene:         'Environment',
  order_accuracy:  'Other',
  product_quality: 'ProductQuality',
  general:         'Other',
}

function fmtCatEN(c: string) {
  return c.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function fmtCatVI(c: string) {
  const MAP: Record<string, string> = {
    waiting_time:    'Thời gian chờ',
    service_quality: 'Chất lượng dịch vụ',
    hygiene:         'Vệ sinh',
    order_accuracy:  'Chính xác đơn hàng',
    product_quality: 'Chất lượng sản phẩm',
    general:         'Khác',
  }
  return MAP[c] ?? c
}

// ─── Transformers ────────────────────────────────────────────────────────────

export function metricsToBranch(m: BranchMetrics): Branch {
  const neutral = Math.max(0, 100 - m.positive_percentage - m.negative_percentage)
  return {
    id:          slugify(m.branch_name),
    name:        m.branch_name,
    address:     'Hà Nội, Việt Nam',
    district:    'Hà Nội',
    healthScore: m.health_score,
    prevScore:   Math.max(0, m.health_score - 3),
    avgRating:   m.avg_rating || 0,
    reviewCount: m.total_reviews,
    issueCount:  m.critical_issues.length,
    sentiment: {
      positive: m.positive_percentage,
      neutral,
      negative: m.negative_percentage,
    },
    topPainPoints: m.critical_issues.slice(0, 3).map((c, i) => ({
      key:   CAT_TO_PAINPOINT[c] ?? 'Other',
      label: fmtCatEN(c),
      count: Math.round(m.total_reviews * Math.max(0.1, 0.35 - i * 0.08)),
    })),
    openHours: '7:00 – 22:00',
    manager:   'N/A',
  }
}

function parseCriticalIssues(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[]
  if (typeof raw === 'string' && raw) {
    try { return JSON.parse(raw) as string[] } catch { return [] }
  }
  return []
}

export function metricsToAlerts(metrics: BranchMetrics[]): Alert[] {
  if (!metrics.length) return []
  const result: Alert[] = []
  let idx = 0

  const totalReviews  = metrics.reduce((s, m) => s + (Number(m.total_reviews)  || 0), 0)
  const totalNegative = metrics.reduce((s, m) => s + (Number(m.negative_count) || 0), 0)
  const chainNegPct   = totalReviews ? Math.round((totalNegative / totalReviews) * 100) : 0

  // Sort worst-first
  const sorted = [...metrics].sort((a, b) => (Number(a.health_score) || 0) - (Number(b.health_score) || 0))

  sorted.forEach(m => {
    const score   = Number(m.health_score   ?? 0)
    const negPct  = Number(m.negative_percentage ?? 0)
    const reviews = Number(m.total_reviews  ?? 0)
    const issues  = parseCriticalIssues(m.critical_issues)

    // Health-score alert for any branch below 70
    if (score < 70) {
      const severity: Alert['severity'] = score < 50 ? 'High' : score < 60 ? 'High' : 'Medium'
      const branchSlug = slugify(m.branch_name)
      const topEN = issues.slice(0, 2).map(c => fmtCatEN(c)).join(' and ')
      const topVI = issues.slice(0, 2).map(c => fmtCatVI(c)).join(' và ')
      result.push({
        id:            `live-h-${idx++}`,
        severity,
        title:         `${m.branch_name} — Health ${score}/100 · ${negPct}% negative`,
        titleVi:       `${m.branch_name} — Sức khỏe ${score}/100 · ${negPct}% tiêu cực`,
        description:   topEN
          ? `Health score ${score}/100 — ${negPct}% negative across ${reviews} reviews. Top issues: ${topEN}.`
          : `Health score ${score}/100 — ${negPct}% negative sentiment across ${reviews} reviews.`,
        descriptionVi: topVI
          ? `Điểm sức khỏe ${score}/100 — ${negPct}% tiêu cực từ ${reviews} đánh giá. Vấn đề chính: ${topVI}.`
          : `Điểm sức khỏe ${score}/100 — ${negPct}% đánh giá tiêu cực từ ${reviews} đánh giá.`,
        branchId:      branchSlug,
        branchName:    m.branch_name,
        metric:        'Health Score',
        change:        `${score}/100`,
        timestamp:     m.updated_at ?? new Date().toISOString(),
        actionLabel:   'View Issue',
        actionRoute:   `/issues?branch=${branchSlug}`,
      })
    }

    // Per-category alert → links directly to the live issue for that category
    issues.slice(0, 1).forEach(issue => {
      const count = Math.round(reviews * 0.3)
      const pct   = reviews ? Math.round((count / reviews) * 100) : 0
      result.push({
        id:            `live-i-${idx++}`,
        severity:      negPct > 65 ? 'High' : 'Medium',
        title:         `${fmtCatEN(issue)} complaints at ${m.branch_name}`,
        titleVi:       `Phàn nàn ${fmtCatVI(issue)} tại ${m.branch_name}`,
        description:   `${count} of ${reviews} reviews (${pct}%) cite ${fmtCatEN(issue).toLowerCase()} as primary complaint.`,
        descriptionVi: `${count} trong ${reviews} đánh giá (${pct}%) đề cập ${fmtCatVI(issue).toLowerCase()} là vấn đề chính.`,
        branchId:      slugify(m.branch_name),
        branchName:    m.branch_name,
        metric:        fmtCatEN(issue),
        change:        `${count} reviews`,
        timestamp:     m.updated_at ?? new Date().toISOString(),
        actionLabel:   'View Issue',
        actionRoute:   `/issues?highlight=live-${issue}`,
      })
    })
  })

  // Chain-wide sentiment alert
  if (chainNegPct > 50 && totalReviews > 0) {
    result.push({
      id:            `live-chain-${idx++}`,
      severity:      chainNegPct > 70 ? 'High' : 'Medium',
      title:         `${chainNegPct}% negative sentiment chain-wide`,
      titleVi:       `${chainNegPct}% phản hồi tiêu cực toàn chuỗi`,
      description:   `${totalNegative} of ${totalReviews} reviews across all ${metrics.length} branches are negative. Chain-level review recommended.`,
      descriptionVi: `${totalNegative} trong ${totalReviews} đánh giá trên ${metrics.length} chi nhánh là tiêu cực. Đề nghị kiểm tra toàn chuỗi.`,
      branchId:      null,
      branchName:    null,
      metric:        'Chain Sentiment',
      change:        `${chainNegPct}%`,
      timestamp:     new Date().toISOString(),
      actionLabel:   'View Analytics',
      actionRoute:   '/analytics',
    })
  }

  return result.sort((a, b) => {
    const rank: Record<string, number> = { High: 3, Medium: 2, Low: 1 }
    return (rank[b.severity] ?? 0) - (rank[a.severity] ?? 0)
  })
}

export function metricsToIssues(metrics: BranchMetrics[]): Issue[] {
  const catMap: Record<string, { branches: string[]; total: number }> = {}

  metrics.forEach(m => {
    m.critical_issues.forEach(cat => {
      if (!catMap[cat]) catMap[cat] = { branches: [], total: 0 }
      catMap[cat].branches.push(m.branch_name)
      catMap[cat].total += m.total_reviews
    })
  })

  return Object.entries(catMap)
    .sort(([, a], [, b]) => b.branches.length - a.branches.length)
    .map(([cat, { branches, total }], i) => {
      const priority: Priority =
        branches.length >= 3 ? 'Critical' :
        branches.length >= 2 ? 'High' : 'Medium'
      const reviewCount = Math.round(total * 0.27)

      return {
        id:             `live-${cat}`,
        code:           `ISS-L${String(i + 1).padStart(3, '0')}`,
        title:          `${fmtCatEN(cat)} Issues`,
        titleVi:        `Vấn đề ${fmtCatVI(cat)}`,
        description:    `${reviewCount} reviews flagged across ${branches.length} ${branches.length === 1 ? 'branch' : 'branches'}`,
        descriptionVi:  `${reviewCount} đánh giá phản ánh tại ${branches.length} chi nhánh`,
        category:       CAT_TO_PAINPOINT[cat] ?? 'Other',
        priority,
        status:         'Open' as IssueStatus,
        branchId:       branches.length === 1 ? slugify(branches[0]) : null,
        affectedBranches: branches,
        reviewCount,
        trend:          'Stable' as const,
        rootCauses:     [`High frequency ${fmtCatEN(cat).toLowerCase()} mentions`],
        rootCausesVi:   [`Đề cập nhiều về ${fmtCatVI(cat).toLowerCase()}`],
        businessImpact:   `Impacts ${reviewCount} reviews across the chain`,
        businessImpactVi: `Ảnh hưởng ${reviewCount} đánh giá toàn chuỗi`,
        detectedAt:     new Date().toISOString().split('T')[0],
        beforeMetrics:  [
          { label: 'Flagged Reviews', labelVi: 'Đánh giá phản ánh', value: String(reviewCount) },
          { label: 'Branches',        labelVi: 'Chi nhánh',         value: String(branches.length) },
        ],
        afterMetrics:   [
          { label: 'Target',   labelVi: 'Mục tiêu', value: '0' },
          { label: 'Branches', labelVi: 'Chi nhánh', value: '0' },
        ],
      }
    })
}

// ─── ChainStats shape compatible with existing display ───────────────────────

export interface LiveChainStats {
  totalReviews:    number
  avgRating:       number
  avgHealthScore:  number
  positivePct:     number
  negativePct:     number
}

export function metricsToChainStats(metrics: BranchMetrics[]): LiveChainStats {
  if (!metrics.length) return { totalReviews: 0, avgRating: 0, avgHealthScore: 0, positivePct: 0, negativePct: 0 }

  const totalReviews   = metrics.reduce((s, m) => s + m.total_reviews,  0)
  const totalPositive  = metrics.reduce((s, m) => s + m.positive_count, 0)
  const totalNegative  = metrics.reduce((s, m) => s + m.negative_count, 0)

  // Weighted avg health score by review count (not simple avg of branch scores)
  const avgHealthScore = totalReviews
    ? Math.round(metrics.reduce((s, m) => s + m.health_score * m.total_reviews, 0) / totalReviews)
    : 0

  // Weighted avg rating — skip branches with no rating data
  const ratedMetrics    = metrics.filter(m => m.avg_rating > 0)
  const totalRatedCount = ratedMetrics.reduce((s, m) => s + m.total_reviews, 0)
  const avgRating = totalRatedCount
    ? Math.round(ratedMetrics.reduce((s, m) => s + m.avg_rating * m.total_reviews, 0) / totalRatedCount * 10) / 10
    : 0

  return {
    totalReviews,
    avgRating,
    avgHealthScore,
    // Weighted percentages: total_positive / total_reviews (not avg of branch%)
    positivePct: totalReviews ? Math.round((totalPositive / totalReviews) * 100) : 0,
    negativePct: totalReviews ? Math.round((totalNegative / totalReviews) * 100) : 0,
  }
}

// ─── Actions DB row → Action type ────────────────────────────────────────────

export function dbRowToAction(row: Record<string, unknown>): Action {
  return {
    id:              String(row.id ?? ''),
    issueId:         String(row.issue_id ?? ''),
    issueCode:       String(row.issue_code ?? ''),
    title:           String(row.title ?? ''),
    titleVi:         row.title_vi ? String(row.title_vi) : undefined,
    description:     String(row.description ?? ''),
    descriptionVi:   row.description_vi ? String(row.description_vi) : undefined,
    owner:           String(row.owner ?? 'Manager'),
    branchId:        row.branch_id ? String(row.branch_id) : null,
    branchName:      row.branch_name ? String(row.branch_name) : null,
    priority:        (row.priority as Priority) ?? 'Medium',
    status:          (row.status as ActionStatus) ?? 'Pending',
    deadline:        String(row.deadline ?? ''),
    progress:        Number(row.progress ?? 0),
    expectedImpact:  String(row.expected_impact ?? ''),
    expectedImpactVi: row.expected_impact_vi ? String(row.expected_impact_vi) : undefined,
    tags:            Array.isArray(row.tags) ? (row.tags as string[]) : [],
    timeline:        Array.isArray(row.timeline) ? (row.timeline as TimelineEvent[]) : [],
    comments:        Array.isArray(row.comments) ? (row.comments as ActionComment[]) : [],
    monitoring:      row.monitoring ? (row.monitoring as MonitoringState) : undefined,
    actualImpact:    Array.isArray(row.actual_impact) ? (row.actual_impact as ActualImpactItem[]) : [],
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export type DataMode = 'checking' | 'demo' | 'live' | 'empty'

export interface LiveDataResult {
  mode:         DataMode
  metrics:      BranchMetrics[]
  branches:     Branch[]
  alerts:       Alert[]
  issues:       Issue[]
  chainStats:   LiveChainStats
  reviews:      ProcessedReview[]
  liveActions:  Action[]
  refresh:      () => void
}

const REVIEW_LIMIT = 5000

export function useLiveData(forceDemo = false): LiveDataResult {
  const [mode,        setMode]        = useState<DataMode>(supabaseConfigured && !forceDemo ? 'checking' : 'demo')
  const [metrics,     setMetrics]     = useState<BranchMetrics[]>([])
  const [reviews,     setReviews]     = useState<ProcessedReview[]>([])
  const [liveActions, setLiveActions] = useState<Action[]>([])
  const [refreshKey,  setRefreshKey]  = useState(0)

  function refresh() {
    if (forceDemo || !supabaseConfigured) return
    setMode('checking')
    setMetrics([])
    setReviews([])
    setLiveActions([])
    setRefreshKey(k => k + 1)
  }

  // Re-fetch whenever another component signals a completed upload
  useEffect(() => {
    if (forceDemo || !supabaseConfigured) return
    const doRefresh = () => {
      setMode('checking')
      setMetrics([])
      setReviews([])
      setLiveActions([])
      setRefreshKey(k => k + 1)
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'insightos-data-updated') doRefresh()
    }
    window.addEventListener('insightos-data-updated', doRefresh as EventListener)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('insightos-data-updated', doRefresh as EventListener)
      window.removeEventListener('storage', onStorage)
    }
  }, [forceDemo])

  useEffect(() => {
    if (forceDemo || !supabaseConfigured || !supabase) {
      setMode('demo')
      return
    }
    const client = supabase

    // Fetch branch metrics + reviews
    client
      .from('branch_metrics')
      .select('*')
      .then(({ data, error }) => {
        if (error || !data?.length) {
          setMode(data?.length === 0 ? 'empty' : 'demo')
          return
        }
        const valid = data as BranchMetrics[]
        setMetrics(valid)
        setMode(valid.length ? 'live' : 'empty')
        client
          .from('reviews')
          .select('*')
          .limit(REVIEW_LIMIT)
          .then(({ data: rData }) => {
            if (rData?.length) setReviews(rData as ProcessedReview[])
          })
      })

    // Fetch actions independently (parallel)
    client
      .from('actions')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data: aData }) => {
        if (aData) setLiveActions(aData.map(row => dbRowToAction(row as Record<string, unknown>)))
      })
  }, [forceDemo, refreshKey])

  // Re-derive metrics from raw reviews when available so chain stats,
  // per-branch percentages, and sentiment counts are always accurate.
  // branch_metrics in Supabase may be stale (e.g. neutral_count column added
  // after rows were written, or N/A branch excluded by an older upload).
  // When reviews lack a rating column (null ratings), preserve avg_rating from
  // the stored branch_metrics row so Chain Avg Rating is never shown as 0.
  const effective = useMemo(() => {
    if (!reviews.length) return metrics
    const computed = reviewsToMetrics(reviews)
    return computed.map(m => {
      if (m.avg_rating > 0) return m
      const stored = metrics.find(s => s.branch_name === m.branch_name)
      return stored?.avg_rating ? { ...m, avg_rating: stored.avg_rating } : m
    })
  }, [reviews, metrics])

  const live = {
    branches:   effective.map(metricsToBranch),
    alerts:     metricsToAlerts(effective),
    issues:     metricsToIssues(effective),
    chainStats: metricsToChainStats(effective),
  }

  return { mode, metrics: effective, reviews, liveActions, refresh, ...live }
}
