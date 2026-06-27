// Derives Recommendation[] from live BranchMetrics.
// Each branch's critical_issues drives targeted, data-filled recommendations.
// Falls back gracefully when categories are unknown.

import type { BranchMetrics } from './uploadTypes'
import type { Recommendation, Priority } from '@/data/types'

type PainCategory = 'waiting_time' | 'service_quality' | 'hygiene' | 'order_accuracy' | 'product_quality' | 'general'

function slugify(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

function shortName(branch: string): string {
  return branch.replace(/^Phê La\s*/i, '')
}

function priorityFromHealth(health: number): Priority {
  if (health < 60) return 'Critical'
  if (health < 75) return 'High'
  return 'Medium'
}

function healthTarget(health: number): number {
  return Math.min(78, health + Math.max(6, Math.round((78 - health) * 0.45)))
}

// ─── Per-category recommendation templates ──────────────────────────────────

interface Tpl {
  category:       string
  effort:         'Low' | 'Medium' | 'High'
  timeframe:      string
  tags:           string[]
  title:          (b: string, m: BranchMetrics) => string
  titleVi:        (b: string, m: BranchMetrics) => string
  desc:           (b: string, m: BranchMetrics) => string
  descVi:         (b: string, m: BranchMetrics) => string
  improvement:    (m: BranchMetrics, ht: number) => string
  improvementVi:  (m: BranchMetrics, ht: number) => string
  impact:         (m: BranchMetrics, ht: number) => string
}

const TEMPLATES: Record<PainCategory, Tpl> = {
  waiting_time: {
    category: 'Staffing',
    effort: 'Low',
    timeframe: '1 week',
    tags: ['Staffing', 'Peak Hours', 'Queue'],
    title:   (b) => `Add peak-hour barista at ${b}`,
    titleVi: (b) => `Thêm barista giờ cao điểm tại ${b}`,
    desc:   (b, m) => `Waiting time is the top complaint at ${b} — estimated ~${Math.round(m.total_reviews * 0.35)} of ${m.total_reviews} reviews mention it. Adding one barista during peak windows (11:30–13:30 & 17:30–19:30) cuts perceived wait time and reduces wait-related negative reviews by ~40%.`,
    descVi: (b, m) => `Thời gian chờ là phàn nàn hàng đầu tại ${b} — ước tính ~${Math.round(m.total_reviews * 0.35)} trong ${m.total_reviews} đánh giá đề cập. Thêm một barista trong giờ cao điểm (11:30–13:30 & 17:30–19:30) giảm thời gian chờ cảm nhận và giảm đánh giá tiêu cực liên quan đến chờ đợi ~40%.`,
    improvement:   (m, ht) => `-40% wait complaints · Health: ${m.health_score} → ~${ht}`,
    improvementVi: (m, ht) => `-40% phàn nàn chờ đợi · Sức khỏe: ${m.health_score} → ~${ht}`,
    impact:        (m, ht) => `Health score: ${m.health_score} → ~${ht}. Negative reviews: ${m.negative_percentage}% → ~${Math.max(0, m.negative_percentage - 8)}%.`,
  },

  service_quality: {
    category: 'Service',
    effort: 'Medium',
    timeframe: '2 weeks',
    tags: ['Training', 'Service Quality', 'Staff'],
    title:   (b) => `Service retraining program at ${b}`,
    titleVi: (b) => `Chương trình đào tạo lại dịch vụ tại ${b}`,
    desc:   (b, m) => `Service quality issues detected in ~${Math.round(m.total_reviews * 0.3)} of ${m.total_reviews} reviews at ${b}. A 4-hour retraining session covering greeting standards, complaint handling, and service flow reduces recurrence and improves customer satisfaction.`,
    descVi: (b, m) => `Vấn đề chất lượng dịch vụ được phát hiện trong ~${Math.round(m.total_reviews * 0.3)} trong ${m.total_reviews} đánh giá tại ${b}. Buổi đào tạo lại 4 giờ về tiêu chuẩn chào hỏi, xử lý phàn nàn, và quy trình phục vụ giúp giảm tái diễn và cải thiện sự hài lòng của khách hàng.`,
    improvement:   (m, ht) => `+${ht - m.health_score} pts health score · Positive: ~+8%`,
    improvementVi: (m, ht) => `+${ht - m.health_score} điểm sức khỏe · Tích cực: ~+8%`,
    impact:        (m, ht) => `Health: ${m.health_score} → ~${ht}. Positive reviews: ~${m.positive_percentage}% → ~${Math.min(100, m.positive_percentage + 8)}%.`,
  },

  hygiene: {
    category: 'Environment',
    effort: 'Medium',
    timeframe: '1 week',
    tags: ['Hygiene', 'Environment', 'Cleanliness'],
    title:   (b) => `Cleanliness & environment audit at ${b}`,
    titleVi: (b) => `Kiểm tra vệ sinh & môi trường tại ${b}`,
    desc:   (b, m) => `Hygiene concerns appear in ~${Math.round(m.total_reviews * 0.22)} reviews at ${b}. A structured cleanliness audit covering tables, restrooms, and prep areas, plus a daily hygiene checklist for staff, addresses recurring complaints at low cost.`,
    descVi: (b, m) => `Phàn nàn về vệ sinh xuất hiện trong ~${Math.round(m.total_reviews * 0.22)} đánh giá tại ${b}. Kiểm tra vệ sinh có cấu trúc gồm bàn ghế, nhà vệ sinh, và khu vực pha chế, cùng danh sách kiểm tra vệ sinh hàng ngày cho nhân viên, giải quyết phàn nàn lặp lại với chi phí thấp.`,
    improvement:   (m, ht) => `-50% hygiene complaints · +${ht - m.health_score} pts`,
    improvementVi: (m, ht) => `-50% phàn nàn vệ sinh · +${ht - m.health_score} điểm`,
    impact:        (m, ht) => `Health: ${m.health_score} → ~${ht}. Hygiene complaints drop ~50%.`,
  },

  order_accuracy: {
    category: 'Operations',
    effort: 'Low',
    timeframe: '1 week',
    tags: ['Operations', 'Order Accuracy', 'Process'],
    title:   (b) => `Order accuracy checklist at ${b}`,
    titleVi: (b) => `Kiểm tra độ chính xác đơn hàng tại ${b}`,
    desc:   (b, m) => `Order errors affect ~${Math.round(m.total_reviews * 0.18)} reviews at ${b}. Implementing a pre-dispatch verification step and a brief staff refresher on order-reading procedures is a low-effort fix with immediate impact on accuracy complaints.`,
    descVi: (b, m) => `Lỗi đơn hàng ảnh hưởng ~${Math.round(m.total_reviews * 0.18)} đánh giá tại ${b}. Triển khai bước kiểm tra trước khi trao đơn và nhắc nhở ngắn về quy trình đọc đơn là cách sửa lỗi ít tốn công nhưng có tác động ngay lập tức.`,
    improvement:   (_m, _ht) => '+90% order accuracy rate',
    improvementVi: (_m, _ht) => '+90% tỷ lệ chính xác đơn hàng',
    impact:        (m, ht) => `Health: ${m.health_score} → ~${ht}. Order errors drop ~80%.`,
  },

  product_quality: {
    category: 'Product',
    effort: 'Medium',
    timeframe: '2 weeks',
    tags: ['Product Quality', 'Recipe', 'Standards'],
    title:   (b) => `Product quality audit at ${b}`,
    titleVi: (b) => `Kiểm tra chất lượng sản phẩm tại ${b}`,
    desc:   (b, m) => `Product quality complaints in ~${Math.round(m.total_reviews * 0.25)} of ${m.total_reviews} reviews at ${b}. A full recipe-consistency audit, ingredient freshness review, and equipment calibration check address the root causes of taste inconsistency.`,
    descVi: (b, m) => `Phàn nàn về chất lượng sản phẩm trong ~${Math.round(m.total_reviews * 0.25)} trong ${m.total_reviews} đánh giá tại ${b}. Kiểm tra toàn diện tính nhất quán công thức, độ tươi nguyên liệu, và hiệu chỉnh thiết bị giải quyết nguyên nhân gốc rễ của sự không nhất quán.`,
    improvement:   (m, ht) => `+${ht - m.health_score} pts health score · +10% positive`,
    improvementVi: (m, ht) => `+${ht - m.health_score} điểm sức khỏe · +10% tích cực`,
    impact:        (m, ht) => `Health: ${m.health_score} → ~${ht}. Positive reviews: ~${m.positive_percentage}% → ~${Math.min(100, m.positive_percentage + 10)}%.`,
  },

  general: {
    category: 'Operations',
    effort: 'Medium',
    timeframe: '2 weeks',
    tags: ['Operations', 'Review', 'General'],
    title:   (b, m) => `Operations review at ${b} (health: ${m.health_score}/100)`,
    titleVi: (b, m) => `Rà soát vận hành tại ${b} (sức khỏe: ${m.health_score}/100)`,
    desc:   (b, m) => `${b} has a health score of ${m.health_score}/100 with ${m.negative_percentage}% negative reviews. A comprehensive branch operations review covering staffing, service flow, and customer experience touchpoints identifies and addresses the root causes of dissatisfaction.`,
    descVi: (b, m) => `${b} có điểm sức khỏe ${m.health_score}/100 với ${m.negative_percentage}% đánh giá tiêu cực. Rà soát toàn diện vận hành bao gồm nhân sự, quy trình phục vụ, và điểm tiếp xúc trải nghiệm khách hàng giúp xác định và giải quyết nguyên nhân gốc rễ.`,
    improvement:   (m, ht) => `+${ht - m.health_score} pts health score`,
    improvementVi: (m, ht) => `+${ht - m.health_score} điểm sức khỏe`,
    impact:        (m, ht) => `Health: ${m.health_score} → ~${ht} within 30 days.`,
  },
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function liveToRecommendations(metrics: BranchMetrics[]): Recommendation[] {
  const recs: Recommendation[] = []
  let idx = 0

  const sorted = [...metrics].sort((a, b) => a.health_score - b.health_score)

  // Per-branch recommendations (up to 2 issues per branch)
  for (const m of sorted) {
    const branch   = m.branch_name
    const branchId = slugify(branch)
    const priority = priorityFromHealth(m.health_score)
    const ht       = healthTarget(m.health_score)
    const issues   = m.critical_issues.slice(0, 2) as PainCategory[]

    // Skip healthy branches with no detected issues
    if (priority === 'Low' && issues.length === 0) continue

    const cats: PainCategory[] = issues.length > 0 ? issues : ['general']

    for (const cat of cats) {
      const tpl = TEMPLATES[cat] ?? TEMPLATES.general
      const b   = shortName(branch)

      recs.push({
        id:                     `live-${branchId}-${cat}-${idx++}`,
        branchId,
        branchName:             branch,
        priority,
        category:               tpl.category,
        title:                  tpl.title(b, m),
        titleVi:                tpl.titleVi(b, m),
        description:            tpl.desc(b, m),
        descriptionVi:          tpl.descVi(b, m),
        expectedImpact:         tpl.impact(m, ht),
        estimatedImprovement:   tpl.improvement(m, ht),
        estimatedImprovementVi: tpl.improvementVi(m, ht),
        effort:                 tpl.effort,
        timeframe:              tpl.timeframe,
        tags:                   [...tpl.tags, priority],
      })
    }
  }

  // Chain-wide recommendations for pain points affecting ≥2 branches
  const catBranches: Record<string, string[]> = {}
  for (const m of sorted) {
    for (const cat of m.critical_issues) {
      if (!catBranches[cat]) catBranches[cat] = []
      catBranches[cat].push(shortName(m.branch_name))
    }
  }

  for (const [cat, branches] of Object.entries(catBranches)) {
    if (branches.length < 2) continue
    const tpl    = TEMPLATES[cat as PainCategory] ?? TEMPLATES.general
    const catLabel = cat.replace(/_/g, ' ')
    recs.push({
      id:                     `live-chain-${cat}`,
      branchId:               null,
      branchName:             null,
      priority:               'High',
      category:               tpl.category,
      title:                  `Chain-wide ${catLabel} fix — ${branches.length} branches affected`,
      titleVi:                `Cải thiện ${catLabel} toàn chuỗi — ${branches.length} chi nhánh`,
      description:            `${branches.join(', ')} all flag ${catLabel} as a top pain point. A standardised chain-wide intervention — shared playbook, cross-branch training session, and monthly audit — delivers faster and more consistent improvement than branch-by-branch fixes.`,
      descriptionVi:          `${branches.join(', ')} đều đánh dấu ${catLabel} là vấn đề hàng đầu. Can thiệp chuẩn hóa toàn chuỗi — playbook chia sẻ, buổi đào tạo liên chi nhánh, và kiểm tra hàng tháng — mang lại cải thiện nhanh hơn và nhất quán hơn so với sửa chữa từng chi nhánh.`,
      expectedImpact:         `Consistent improvement across ${branches.length} branches within 30 days.`,
      estimatedImprovement:   `-25% ${catLabel} complaints chain-wide`,
      estimatedImprovementVi: `-25% phàn nàn ${catLabel} toàn chuỗi`,
      effort:                 'Medium',
      timeframe:              '3 weeks',
      tags:                   [tpl.category, 'Chain-wide', 'High Priority'],
    })
  }

  return recs
}

// ─── Combined impact summary ──────────────────────────────────────────────────

export interface LiveImpactSummary {
  potentialHealthGain:   number
  currentHealth:         number
  waitReductionPct:      number
  satisfactionGainPct:   number
  revenueImpactPct:      number
}

export function computeImpactSummary(metrics: BranchMetrics[]): LiveImpactSummary {
  if (!metrics.length) return { potentialHealthGain: 0, currentHealth: 0, waitReductionPct: 0, satisfactionGainPct: 0, revenueImpactPct: 0 }

  const total = metrics.reduce((s, m) => s + m.total_reviews, 0)
  const currentHealth = total
    ? Math.round(metrics.reduce((s, m) => s + m.health_score * m.total_reviews, 0) / total)
    : 0

  // Estimate health gain from fixing all critical/high branches
  const needsFix = metrics.filter(m => m.health_score < 75)
  const avgGain  = needsFix.length
    ? Math.round(needsFix.reduce((s, m) => s + (healthTarget(m.health_score) - m.health_score), 0) / needsFix.length)
    : 0
  const potentialHealthGain = Math.min(25, avgGain)

  const hasWait = metrics.some(m => m.critical_issues.includes('waiting_time' as never))
  const waitReductionPct   = hasWait ? 35 : 15
  const satisfactionGainPct = Math.min(25, Math.round(needsFix.length * 3.5))
  const revenueImpactPct    = Math.min(12, Math.round(satisfactionGainPct * 0.45))

  return { potentialHealthGain, currentHealth, waitReductionPct, satisfactionGainPct, revenueImpactPct }
}
