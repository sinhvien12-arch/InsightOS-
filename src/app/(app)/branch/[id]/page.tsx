'use client'

import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Star, Clock, User } from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { getBranch } from '@/data/branches'
import { getReviewsForBranch } from '@/data/reviews'
import { recommendations } from '@/data/recommendations'
import { useLiveData } from '@/lib/useLiveData'
import type { Review } from '@/data/types'
import BranchHealthGauge from '@/components/BranchHealthGauge'
import SentimentDonut from '@/components/charts/SentimentDonut'
import PainPointBar from '@/components/charts/PainPointBar'
import RecommendationCard from '@/components/RecommendationCard'
import Badge from '@/components/ui/Badge'

const fade = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

export default function BranchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t, lang } = useLang()

  const id = params.id as string
  const { mode, branches: liveBranches, reviews: liveReviews } = useLiveData()
  const isLive = mode === 'live'
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

  const branchReviews = isLive
    ? liveReviews
        .filter(r => r.branch_name === branch?.name)
        .map((r, i) => ({
          id:           i,
          branchId:     id,
          date:         r.date,
          platform:     r.platform as Review['platform'],
          rating:       r.rating ?? null,
          reviewerName: r.author_name ?? 'Customer',
          reviewText:   r.review_text,
          sentiment:    (r.sentiment.charAt(0).toUpperCase() + r.sentiment.slice(1)) as Review['sentiment'],
          painPoint:    'Other' as Review['painPoint'],
        }))
    : getReviewsForBranch(id)
  const branchRecs    = recommendations.filter(r => r.branchId === id || r.branchId === null).slice(0, 3)

  const PAIN_LABEL_VI: Record<string, string> = {
    WaitingTime: 'Thời gian chờ', ServiceQuality: 'Chất lượng DV',
    ProductQuality: 'Chất lượng SP', Delivery: 'Giao hàng',
    Environment: 'Không gian', Pricing: 'Giá cả', Seating: 'Chỗ ngồi', Other: 'Khác',
  }

  // Build pain point data for chart
  const painData = branch.topPainPoints.map(p => ({
    key:   p.key,
    label: lang === 'vi' ? (PAIN_LABEL_VI[p.key] ?? p.label) : p.label,
    count: p.count,
  }))

  // Build timeline (last 14 days, by day)
  const today = new Date()
  const timelineData: { date: string; count: number; negative: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().slice(0, 10)
    const day = branchReviews.filter(r => r.date.startsWith(ds))
    timelineData.push({
      date: ds.slice(5),
      count: day.length,
      negative: day.filter(r => r.sentiment === 'Negative').length,
    })
  }

  const maxCount = Math.max(...timelineData.map(d => d.count), 1)

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
          {/* Mood bar */}
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              { label: t('positive'), value: branch.sentiment.positive, color: 'text-emerald-600', bg: 'bg-emerald-100' },
              { label: t('neutral'),  value: branch.sentiment.neutral,  color: 'text-slate-500',   bg: 'bg-slate-100'   },
              { label: t('negative'), value: branch.sentiment.negative, color: 'text-red-500',     bg: 'bg-red-100'     },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-3 ${s.bg}`}>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}%</div>
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
        <h2 className="font-bold text-slate-800 mb-4">{t('branch.timeline')}</h2>
        <div className="flex items-end gap-1.5 h-24">
          {timelineData.map(day => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5" title={`${day.date}: ${day.count} reviews`}>
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
              <span className="text-[9px] text-slate-400">{day.date.slice(3)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary-200 inline-block" /> {t('branch.total')}</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-300 inline-block" /> {t('negative')}</div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div>
        <h2 className="font-bold text-slate-800 mb-3">{t('branch.recs')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branchRecs.map(rec => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
      </div>

      {/* Recent reviews */}
      <div>
        <h2 className="font-bold text-slate-800 mb-3">{t('branch.reviews')}</h2>
        <div className="space-y-3">
          {branchReviews.slice(0, 8).map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-slate-700">{r.reviewerName}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                      {r.platform}
                    </span>
                    <Badge
                      variant={r.sentiment === 'Positive' ? 'positive' : r.sentiment === 'Negative' ? 'negative' : 'neutral'}
                    >
                      {r.sentiment === 'Positive' ? t('positive') : r.sentiment === 'Negative' ? t('negative') : t('neutral')}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{r.reviewText}</p>
                </div>
                {r.rating && (
                  <div className="flex-shrink-0 text-amber-400 text-sm font-bold">
                    {'★'.repeat(r.rating)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
