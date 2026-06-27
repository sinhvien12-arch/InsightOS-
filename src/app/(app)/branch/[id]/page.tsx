'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Star, Clock, User, ChevronDown } from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { getBranch } from '@/data/branches'
import { getReviewsForBranch } from '@/data/reviews'
import { recommendations as demoRecs } from '@/data/recommendations'
import { useLiveData } from '@/lib/useLiveData'
import { liveToRecommendations } from '@/lib/liveRecommendations'
import { useImplementedRecs } from '@/lib/useImplementedRecs'
import { painPointCounts, trendData } from '@/lib/aggregate'
import type { Review } from '@/data/types'
import BranchHealthGauge from '@/components/BranchHealthGauge'
import SentimentDonut from '@/components/charts/SentimentDonut'
import PainPointBar from '@/components/charts/PainPointBar'
import RecommendationCard from '@/components/RecommendationCard'
import Badge from '@/components/ui/Badge'

const CATEGORY_LABEL_VI: Record<string, string> = {
  waiting_time:    'Thời gian chờ',
  service_quality: 'Chất lượng DV',
  hygiene:         'Vệ sinh',
  order_accuracy:  'Chính xác đơn',
  product_quality: 'Chất lượng SP',
  general:         'Khác',
}

const PAIN_LABEL_VI: Record<string, string> = {
  WaitingTime: 'Thời gian chờ', ServiceQuality: 'Chất lượng DV',
  ProductQuality: 'Chất lượng SP', Delivery: 'Giao hàng',
  Environment: 'Không gian', Pricing: 'Giá cả', Seating: 'Chỗ ngồi', Other: 'Khác',
}

const REVIEWS_INIT = 8
const REVIEWS_STEP = 10

export default function BranchDetailPage() {
  const params = useRouter()
  const urlParams = useParams()
  const router = params
  const { t, lang } = useLang()
  const vi = lang === 'vi'

  const id = urlParams.id as string
  const { mode, metrics, branches: liveBranches, reviews: liveReviews } = useLiveData()
  const isLive = mode === 'live'

  const { implementedIds, markImplemented } = useImplementedRecs()
  const [reviewLimit, setReviewLimit] = useState(REVIEWS_INIT)

  const branch = isLive ? liveBranches.find(b => b.id === id) : getBranch(id)

  if (!branch) {
    return (
      <div className="text-center py-24 text-slate-400">
        {t('branch.notFound')}{' '}
        <button onClick={() => router.push('/dashboard')} className="text-primary-600 font-medium">
          {t('branch.goBack')}
        </button>
      </div>
    )
  }

  // ─── Reviews ──────────────────────────────────────────────────────────────

  type MappedReview = Review & { categories?: string[] }

  const branchReviews: MappedReview[] = isLive
    ? liveReviews
        .filter(r => r.branch_name === branch.name)
        .sort((a, b) => (b.date > a.date ? 1 : -1))
        .map((r, i) => ({
          id:           i,
          branchId:     id,
          date:         r.date,
          platform:     (r.platform || 'Other') as Review['platform'],
          rating:       r.rating ?? null,
          reviewerName: r.author_name || (vi ? 'Khách hàng' : 'Customer'),
          reviewText:   r.review_text,
          sentiment:    (r.sentiment.charAt(0).toUpperCase() + r.sentiment.slice(1)) as Review['sentiment'],
          painPoint:    'Other' as Review['painPoint'],
          categories:   r.categories ?? [],
        }))
    : getReviewsForBranch(id).map(r => ({ ...r, categories: [] }))

  // ─── Recommendations ──────────────────────────────────────────────────────

  const liveRecsAll  = liveToRecommendations(metrics)
  const branchRecs   = isLive
    ? liveRecsAll.filter(r => r.branchId === id || r.branchId === null).slice(0, 3)
    : demoRecs.filter(r => r.branchId === id || r.branchId === null).slice(0, 3)

  // ─── Pain point chart — derived from live review categories when available ─

  // Use raw liveReviews for this branch (lowercase sentiment, needed by painPointCounts)
  const rawForBranch = isLive ? liveReviews.filter(r => r.branch_name === branch.name) : []

  const livePainData = rawForBranch.length > 0
    ? painPointCounts(rawForBranch).map(p => ({
        key:   p.key,
        label: vi ? (CATEGORY_LABEL_VI[p.key] ?? p.label) : p.label,
        count: p.count,
      }))
    : []

  const fallbackPainData = branch.topPainPoints.map(p => ({
    key:   p.key,
    label: vi ? (PAIN_LABEL_VI[p.key] ?? p.label) : p.label,
    count: p.count,
  }))

  const painData = (isLive && livePainData.length > 0) ? livePainData : fallbackPainData

  // ─── Timeline — show dates that actually have reviews (up to 14) ──────────

  const timelineData: { date: string; label: string; count: number; negative: number }[] = []

  if (isLive && rawForBranch.length > 0) {
    // Use trendData which only returns dates WITH reviews — avoids all-empty bars
    const trend = trendData(rawForBranch, 14)
    for (const d of trend) {
      // trendData returns { date: "MM-DD", positive, neutral, negative }
      const [mm, dd] = d.date.split('-')
      timelineData.push({
        date:     d.date,
        label:    `${parseInt(dd)}/${parseInt(mm)}`,
        count:    d.positive + d.neutral + d.negative,
        negative: d.negative,
      })
    }
  } else {
    // Demo mode: last 14 calendar days
    const today = new Date()
    for (let i = 13; i >= 0; i--) {
      const d  = new Date(today)
      d.setDate(d.getDate() - i)
      const ds  = d.toISOString().slice(0, 10)
      const day = branchReviews.filter(r => r.date && r.date.startsWith(ds))
      timelineData.push({
        date:     ds,
        label:    `${d.getDate()}/${d.getMonth() + 1}`,
        count:    day.length,
        negative: day.filter(r => r.sentiment === 'Negative').length,
      })
    }
  }

  const maxCount       = Math.max(...timelineData.map(d => d.count), 1)
  const totalInWindow  = timelineData.reduce((s, d) => s + d.count, 0)

  // ─── Sentiment counts from live reviews ──────────────────────────────────

  const sentimentCounts = isLive ? {
    positive: branchReviews.filter(r => r.sentiment === 'Positive').length,
    negative: branchReviews.filter(r => r.sentiment === 'Negative').length,
    neutral:  branchReviews.filter(r => r.sentiment === 'Neutral').length,
  } : null

  const visibleReviews = branchReviews.slice(0, reviewLimit)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Back */}
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-700 font-medium transition-colors"
      >
        <ArrowLeft size={16} />
        {t('branch.back')}
      </button>

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-900 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary-200 bg-white/10 px-2 py-0.5 rounded-full">
                {t('branch.badge')}
              </span>
              {isLive && (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/40 border border-emerald-700/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  {vi ? `${branchReviews.length} đánh giá thực` : `${branchReviews.length} live reviews`}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">{branch.name}</h1>
            <div className="flex items-center gap-1.5 text-primary-200 text-sm mb-4">
              <MapPin size={14} />
              {branch.address}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-primary-200">
                <User size={14} />
                <span>{t('branch.manager')}</span>
                <span className="text-white font-medium">{branch.manager}</span>
              </div>
              <div className="flex items-center gap-1.5 text-primary-200">
                <Clock size={14} />
                <span>{branch.openHours}</span>
              </div>
              <div className="flex items-center gap-1.5 text-primary-200">
                <Star size={14} className="text-amber-400" fill="currentColor" />
                <span className="text-white font-medium">{branch.avgRating} / 5.0</span>
              </div>
            </div>
          </div>
          <BranchHealthGauge score={branch.healthScore} prevScore={branch.prevScore} size="md" />
        </div>
      </div>

      {/* Row: Mood + Pain points */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Customer mood */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h2 className="font-bold text-slate-800 mb-4">{t('branch.mood')}</h2>
          <SentimentDonut
            positive={branch.sentiment.positive}
            neutral={branch.sentiment.neutral}
            negative={branch.sentiment.negative}
            size={240}
          />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              { label: t('positive'), value: sentimentCounts?.positive ?? branch.sentiment.positive, color: 'text-emerald-600', bg: 'bg-emerald-100', suffix: isLive ? (vi ? ' đánh giá' : '') : '%' },
              { label: t('neutral'),  value: sentimentCounts?.neutral  ?? branch.sentiment.neutral,  color: 'text-slate-500',   bg: 'bg-slate-100',   suffix: isLive ? (vi ? ' đánh giá' : '') : '%' },
              { label: t('negative'), value: sentimentCounts?.negative ?? branch.sentiment.negative, color: 'text-red-500',     bg: 'bg-red-100',     suffix: isLive ? (vi ? ' đánh giá' : '') : '%' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-3 ${s.bg}`}>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}{!isLive && '%'}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pain points */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h2 className="font-bold text-slate-800 mb-4">{t('branch.painPoints')}</h2>
          <PainPointBar data={painData} height={240} />
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800">{t('branch.timeline')}</h2>
          {isLive && (
            <span className="text-xs text-slate-400">
              {vi
                ? `${totalInWindow} đánh giá trong 14 ngày qua`
                : `${totalInWindow} reviews in the last 14 days`}
            </span>
          )}
        </div>
        {totalInWindow === 0 && isLive ? (
          <div className="flex flex-col items-center justify-center h-24 text-slate-300 text-sm">
            {vi ? 'Không có đánh giá nào trong 14 ngày qua' : 'No reviews in the last 14 days'}
          </div>
        ) : (
          <>
            <div className="flex items-end gap-1.5 h-24">
              {timelineData.map(day => (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-0.5"
                  title={`${day.label}: ${day.count} ${vi ? 'đánh giá' : 'reviews'}${day.negative ? `, ${day.negative} ${vi ? 'tiêu cực' : 'negative'}` : ''}`}
                >
                  <div className="w-full rounded-t-sm overflow-hidden flex flex-col-reverse" style={{ height: '80px' }}>
                    <div
                      className="w-full bg-primary-100 rounded-t-sm relative"
                      style={{ height: `${(day.count / maxCount) * 100}%` }}
                    >
                      {day.negative > 0 && (
                        <div
                          className="w-full bg-red-300 absolute bottom-0 rounded-t-sm"
                          style={{ height: `${(day.negative / day.count) * 100}%` }}
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400">{day.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary-200 inline-block" /> {t('branch.total')}</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-300 inline-block" /> {t('negative')}</div>
            </div>
          </>
        )}
      </div>

      {/* AI Recommendations */}
      {branchRecs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-800">{t('branch.recs')}</h2>
            {isLive && (
              <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                {vi ? 'Từ dữ liệu thực' : 'From live data'}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branchRecs.map(rec => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                isLive={isLive}
                onImplemented={markImplemented}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent reviews */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">{t('branch.reviews')}</h2>
          <span className="text-xs text-slate-400">
            {isLive
              ? (vi ? `${branchReviews.length} đánh giá` : `${branchReviews.length} reviews`)
              : ''}
          </span>
        </div>

        {branchReviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-slate-400">
            <p className="text-sm">{vi ? 'Chưa có đánh giá nào cho chi nhánh này.' : 'No reviews for this branch yet.'}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {visibleReviews.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-slate-700">{r.reviewerName}</span>
                        {r.platform && (
                          <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                            {r.platform}
                          </span>
                        )}
                        <Badge
                          variant={r.sentiment === 'Positive' ? 'positive' : r.sentiment === 'Negative' ? 'negative' : 'neutral'}
                        >
                          {r.sentiment === 'Positive' ? t('positive') : r.sentiment === 'Negative' ? t('negative') : t('neutral')}
                        </Badge>
                        {r.date && (
                          <span className="text-[10px] text-slate-400 ml-auto">{r.date.slice(0, 10)}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{r.reviewText}</p>
                      {/* Categories from live data */}
                      {r.categories && r.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {r.categories.map(cat => (
                            <span key={cat} className="text-[10px] text-primary-600 bg-primary-50 border border-primary-100 px-1.5 py-0.5 rounded-full">
                              {vi ? (CATEGORY_LABEL_VI[cat] ?? cat) : cat.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {r.rating && (
                      <div className="flex-shrink-0 text-amber-400 text-sm font-bold whitespace-nowrap">
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {reviewLimit < branchReviews.length && (
              <button
                onClick={() => setReviewLimit(l => l + REVIEWS_STEP)}
                className="mt-4 w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 bg-white border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 hover:text-primary-700 hover:border-primary-200 transition-all"
              >
                <ChevronDown size={15} />
                {vi
                  ? `Xem thêm ${Math.min(REVIEWS_STEP, branchReviews.length - reviewLimit)} đánh giá`
                  : `Show ${Math.min(REVIEWS_STEP, branchReviews.length - reviewLimit)} more reviews`}
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
