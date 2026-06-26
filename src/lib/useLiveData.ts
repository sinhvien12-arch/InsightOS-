'use client'

import { useState, useEffect } from 'react'
import { supabase, supabaseConfigured } from './supabase'
import type { BranchMetrics, ProcessedReview } from './uploadTypes'
import type { Branch, Alert, Issue, PainPoint, Priority, IssueStatus } from '@/data/types'

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
    address:     'Imported from upload',
    district:    'N/A',
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

export function metricsToAlerts(metrics: BranchMetrics[]): Alert[] {
  const result: Alert[] = []
  let idx = 0

  metrics.forEach(m => {
    if (m.health_score < 60) {
      result.push({
        id:             `live-h-${idx++}`,
        severity:       m.health_score < 50 ? 'High' : 'Medium',
        title:          `Low health score at ${m.branch_name}`,
        titleVi:        `Điểm sức khỏe thấp tại ${m.branch_name}`,
        description:    `Health score ${m.health_score}/100 — ${m.negative_percentage}% negative reviews`,
        descriptionVi:  `Điểm sức khỏe ${m.health_score}/100 — ${m.negative_percentage}% đánh giá tiêu cực`,
        branchId:       slugify(m.branch_name),
        branchName:     m.branch_name,
        metric:         'Health Score',
        change:         `${m.health_score}/100`,
        timestamp:      m.updated_at ?? new Date().toISOString(),
        actionLabel:    'View Branch',
        actionRoute:    '/branches',
      })
    }

    m.critical_issues.slice(0, 2).forEach(issue => {
      result.push({
        id:             `live-i-${idx++}`,
        severity:       m.negative_percentage > 40 ? 'High' : 'Medium',
        title:          `${fmtCatEN(issue)} issues at ${m.branch_name}`,
        titleVi:        `Vấn đề ${fmtCatVI(issue)} tại ${m.branch_name}`,
        description:    `${Math.round(m.total_reviews * 0.28)} reviews mention ${fmtCatEN(issue).toLowerCase()}`,
        descriptionVi:  `${Math.round(m.total_reviews * 0.28)} đánh giá đề cập ${fmtCatVI(issue).toLowerCase()}`,
        branchId:       slugify(m.branch_name),
        branchName:     m.branch_name,
        metric:         fmtCatEN(issue),
        change:         `+${Math.round(m.total_reviews * 0.28)}`,
        timestamp:      m.updated_at ?? new Date().toISOString(),
        actionLabel:    'View Issues',
        actionRoute:    '/issues',
      })
    })
  })

  return result.sort((a, b) => {
    const rank = { High: 3, Medium: 2, Low: 1 }
    return rank[b.severity] - rank[a.severity]
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
  refresh:      () => void
}

const REVIEW_LIMIT = 5000

export function useLiveData(forceDemo = false): LiveDataResult {
  const [mode,       setMode]       = useState<DataMode>(supabaseConfigured && !forceDemo ? 'checking' : 'demo')
  const [metrics,    setMetrics]    = useState<BranchMetrics[]>([])
  const [reviews,    setReviews]    = useState<ProcessedReview[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  function refresh() {
    if (forceDemo || !supabaseConfigured) return
    setMode('checking')
    setMetrics([])
    setReviews([])
    setRefreshKey(k => k + 1)
  }

  useEffect(() => {
    if (forceDemo || !supabaseConfigured || !supabase) {
      setMode('demo')
      return
    }
    const client = supabase
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
  }, [forceDemo, refreshKey])

  const live = {
    branches:   metrics.map(metricsToBranch),
    alerts:     metricsToAlerts(metrics),
    issues:     metricsToIssues(metrics),
    chainStats: metricsToChainStats(metrics),
  }

  return { mode, metrics, reviews, refresh, ...live }
}
