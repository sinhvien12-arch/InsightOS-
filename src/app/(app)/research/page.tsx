'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '@/lib/LangContext'
import { useLiveData } from '@/lib/useLiveData'
import {
  BookOpen, Database, TrendingUp, Lightbulb, Users, BarChart3,
  ShoppingBag, Star, Globe,
} from 'lucide-react'

const SECTIONS = [
  { id: 'pain',        label: 'Business Pain',          labelVI: 'Bài toán kinh doanh'   },
  { id: 'methodology', label: 'Research Methodology',   labelVI: 'Phương pháp nghiên cứu'},
  { id: 'sources',     label: 'Data Sources',           labelVI: 'Nguồn dữ liệu'         },
  { id: 'journey',     label: 'Digital Transformation', labelVI: 'Chuyển đổi số'         },
  { id: 'why',         label: 'Why InsightOS',          labelVI: 'Tại sao InsightOS'     },
]

const DATA_SOURCES = [
  { platform: 'Google Reviews', icon: Star,        reviews: 275, type: 'Review Platform',   focus: 'Overall experience, ambience, service quality' },
  { platform: 'ShopeeFood',     icon: ShoppingBag, reviews: 154, type: 'Delivery Platform', focus: 'Delivery speed, packaging, order accuracy'     },
  { platform: 'GrabFood',       icon: ShoppingBag, reviews: 64,  type: 'Delivery Platform', focus: 'Delivery time, product quality, driver issues'  },
  { platform: 'TikTok',         icon: Globe,       reviews: 11,  type: 'Social Media',      focus: 'Brand mentions, viral content sentiment'        },
]

export default function ResearchPage() {
  const { lang } = useLang()
  const [active, setActive] = useState('pain')
  const vi = lang === 'vi'
  const { chainStats, branches: liveBranches, mode } = useLiveData()
  const isLive      = mode === 'live'
  const totalReviews = isLive ? chainStats.totalReviews : 504
  const branchCount  = isLive ? liveBranches.length     : 5

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {vi ? 'Nghiên cứu & Bối cảnh' : 'Research & Context'}
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {vi
            ? 'Bài toán kinh doanh, phương pháp luận và câu chuyện chuyển đổi số đằng sau InsightOS'
            : 'The business problem, methodology, and digital transformation story behind InsightOS'}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <aside className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-3 sticky top-24">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 mb-2">{vi ? 'Mục lục' : 'Contents'}</p>
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`w-full text-left text-xs font-medium px-3 py-2.5 rounded-xl transition-all ${
                  active === s.id
                    ? 'bg-primary-700 text-white'
                    : 'text-slate-500 hover:bg-gray-50 hover:text-slate-700'
                }`}
              >
                {vi ? s.labelVI : s.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 space-y-5">
          {/* PAIN POINT */}
          {active === 'pain' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={20} />
                  <h2 className="text-lg font-bold">
                    {vi ? 'Bài toán kinh doanh' : 'The Business Pain Point'}
                  </h2>
                </div>
                <p className="text-red-100 text-sm leading-relaxed">
                  {vi
                    ? 'Phê La đang vận hành chuỗi cà phê 5 chi nhánh tại Hà Nội: Nguyễn Văn Cừ, Núi Trúc, Thanh Thái, Trần Quốc Hoàn và Lê Văn Lương. Dù đã có mobile app, loyalty program, POS, ERP, và thanh toán số — phản hồi khách hàng vẫn bị phân tán khắp nơi và không được xử lý hiệu quả.'
                    : 'Phê La operates a 5-branch coffee chain in Hanoi: Nguyễn Văn Cừ, Núi Trúc, Thanh Thái, Trần Quốc Hoàn, and Lê Văn Lương. Despite having a mobile app, loyalty program, POS, ERP, and digital payments — customer feedback remains scattered and unprocessed.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: '📊', title: vi ? 'Dữ liệu phân tán' : 'Fragmented Data',
                    body: vi ? 'Đánh giá từ Google, ShopeeFood, GrabFood, TikTok, Facebook — không có hệ thống tổng hợp duy nhất.' : 'Reviews across Google, ShopeeFood, GrabFood, TikTok, Facebook with no central aggregation system.' },
                  { icon: '⏰', title: vi ? 'Phản ứng chậm' : 'Slow Response',
                    body: vi ? 'Quản lý không phát hiện vấn đề cho đến khi điểm đánh giá đã giảm nhiều.' : 'Managers don\'t detect issues until after ratings have already declined significantly.' },
                  { icon: '🔍', title: vi ? 'Thiếu insight' : 'No Root-Cause Insight',
                    body: vi ? 'Không có công cụ phân tích nguyên nhân gốc rễ của phàn nàn.' : 'No tooling for root-cause analysis of complaints or pattern detection.' },
                  { icon: '🎯', title: vi ? 'Quyết định thiếu cơ sở' : 'Gut-Based Decisions',
                    body: vi ? 'Quyết định vận hành dựa trên cảm tính thay vì dữ liệu.' : 'Operational decisions based on intuition rather than evidence from customer data.' },
                ].map(item => (
                  <div key={item.title} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1.5">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  {vi ? `Thực trạng từ ${totalReviews} đánh giá thực tế` : `Evidence from ${totalReviews} real customer reviews`}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { val: '64%',  color: 'text-red-500',     bg: 'bg-red-50',     label: vi ? 'Đánh giá tiêu cực' : 'Negative reviews'              },
                    { val: '28%',  color: 'text-amber-600',   bg: 'bg-amber-50',   label: vi ? 'Phàn nàn thời gian chờ' : 'Wait complaints'           },
                    { val: '43',   color: 'text-red-600',     bg: 'bg-red-50',     label: vi ? 'Điểm thấp nhất (Thanh Thái)' : 'Lowest score (Thanh Thái)' },
                    { val: '54',   color: 'text-slate-700',   bg: 'bg-slate-50',   label: vi ? 'Điểm sức khỏe chuỗi' : 'Chain health score'           },
                  ].map(s => (
                    <div key={s.val} className={`${s.bg} rounded-xl p-4 text-center`}>
                      <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* METHODOLOGY */}
          {active === 'methodology' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={18} className="text-primary-600" />
                  <h2 className="text-lg font-bold text-slate-800">
                    {vi ? 'Phương pháp nghiên cứu' : 'Research Methodology'}
                  </h2>
                </div>
                <div className="space-y-4">
                  {[
                    { step: '01', title: vi ? 'Thu thập dữ liệu' : 'Data Collection',
                      body: vi ? 'Thu thập 504 đánh giá từ Google Reviews, ShopeeFood, GrabFood và TikTok trong khoảng thời gian 2022-2026. Dữ liệu được chuẩn hóa về định dạng đồng nhất và gán nhãn theo chi nhánh.' : 'Collection of 504 reviews from Google Reviews, ShopeeFood, GrabFood, and TikTok spanning 2022–2026. Data normalized into a consistent format and tagged by branch.' },
                    { step: '02', title: vi ? 'Phân tích cảm xúc' : 'Sentiment Analysis',
                      body: vi ? 'Phân loại từng đánh giá thành Positive / Neutral / Negative dựa trên nội dung text, bối cảnh và điểm số (nếu có).' : 'Classification of each review into Positive / Neutral / Negative based on text content, context, and star rating where available.' },
                    { step: '03', title: vi ? 'Phân loại điểm đau' : 'Pain Point Categorization',
                      body: vi ? 'Gán nhãn điểm đau chính cho mỗi đánh giá: WaitingTime, ServiceQuality, ProductQuality, Delivery, Environment, Pricing, Seating, Other.' : 'Tagging each review with its primary pain point: WaitingTime, ServiceQuality, ProductQuality, Delivery, Environment, Pricing, Seating, Other.' },
                    { step: '04', title: vi ? 'Xây dựng InsightOS' : 'InsightOS Development',
                      body: vi ? 'Thiết kế và xây dựng nền tảng AI Operations Intelligence dựa trên các phát hiện từ nghiên cứu.' : 'Designed and built the AI Operations Intelligence platform based on research findings, with mock data reflecting the real patterns discovered.' },
                  ].map(s => (
                    <div key={s.step} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold text-primary-700">
                        {s.step}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 mb-1">{s.title}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">{s.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DATA SOURCES */}
          {active === 'sources' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Database size={18} className="text-primary-600" />
                  <h2 className="text-lg font-bold text-slate-800">
                    {vi ? 'Nguồn dữ liệu' : 'Data Sources'}
                  </h2>
                </div>
                <div className="space-y-3">
                  {DATA_SOURCES.map(s => (
                    <div key={s.platform} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center">
                        <s.icon size={18} className="text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-bold text-slate-800">{s.platform}</span>
                          <span className="text-[10px] text-slate-400 bg-white border border-gray-100 px-2 py-0.5 rounded-full">{s.type}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{s.focus}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-primary-700">{s.reviews}</div>
                        <div className="text-[10px] text-slate-400">{vi ? 'đánh giá' : 'reviews'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DIGITAL TRANSFORMATION JOURNEY */}
          {active === 'journey' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp size={18} className="text-primary-600" />
                  <h2 className="text-lg font-bold text-slate-800">
                    {vi ? 'Hành trình Chuyển đổi số của Phê La' : "Phê La's Digital Transformation Journey"}
                  </h2>
                </div>
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />
                  <div className="space-y-8">
                    {[
                      {
                        year: '2021',
                        label: vi ? 'Ra mắt & Vượt qua đại dịch' : 'Launch & Surviving the Pandemic',
                        bullets: vi ? [
                          'Khai trương địa điểm đầu tiên tại Phạm Ngọc Thạch, Hà Nội',
                          'Nhanh chóng triển khai POS và bán hàng đa kênh trực tuyến',
                          'Ra mắt trên GrabFood và ShopeeFood',
                          'Bán trà đóng chai để thích nghi với COVID-19',
                        ] : [
                          'Opened first location at Pham Ngoc Thach, Hanoi',
                          'Quickly deployed POS and multi-channel online sales',
                          'Launched on GrabFood and ShopeeFood',
                          'Sold bottled tea to adapt to COVID-19',
                        ],
                      },
                      {
                        year: '2022',
                        label: vi ? 'Chuẩn hóa vận hành & Hệ thống thành viên' : 'Operations Standardization & Membership System',
                        bullets: vi ? [
                          'Số hóa thanh toán không tiền mặt tại quầy',
                          'Ra mắt tích điểm thành viên và hệ thống loyalty qua điện thoại/CRM',
                        ] : [
                          'Digitized cashless payment at counter',
                          'Launched member points and loyalty system via phone/CRM',
                        ],
                      },
                      {
                        year: '2023–2024',
                        label: vi ? 'Mở rộng quy mô & Quản lý số ERP' : 'Scale-up & ERP Digital Management',
                        bullets: vi ? [
                          'Đồng bộ phần cứng/phần mềm POS toàn chuỗi trong quá trình mở rộng',
                          'Triển khai ERP quản lý tồn kho',
                          'Giảm lãng phí nguyên liệu trên các chi nhánh',
                        ] : [
                          'Synchronized POS hardware/software chain-wide during expansion',
                          'Implemented ERP for inventory management',
                          'Reduced ingredient waste across branches',
                        ],
                      },
                      {
                        year: '2025–2026',
                        label: vi ? 'Hệ sinh thái Mobile App & Tối ưu trải nghiệm' : 'Mobile App Ecosystem & Experience Optimization',
                        bullets: vi ? [
                          'Ra mắt chính thức Phê La Mobile App (cuối 2025)',
                          'Triển khai Big Data cho khuyến mãi cá nhân hóa',
                          'Cải thiện tốc độ xử lý đơn hàng trực tuyến',
                        ] : [
                          'Official launch of Phê La Mobile App (late 2025)',
                          'Big Data implementation for personalized promotions',
                          'Improved online order fulfillment speed',
                        ],
                      },
                      {
                        year: '2026',
                        label: vi ? 'InsightOS: Tầng thông minh' : 'InsightOS: Intelligence Layer',
                        current: true,
                        bullets: vi ? [
                          'Xây dựng tầng phân tích AI',
                          'Biến phản hồi khách hàng thành quyết định vận hành',
                          'Dữ liệu → Insight → Quyết định → Hành động',
                        ] : [
                          'Built AI analytics layer',
                          'Transform customer feedback into operational decisions',
                          'Data → Insight → Decision → Action',
                        ],
                      },
                    ].map(item => (
                      <div key={item.year} className="flex gap-4 relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-[10px] font-bold leading-tight text-center ${
                          item.current
                            ? 'bg-primary-700 text-white ring-4 ring-primary-100'
                            : 'bg-white border-2 border-gray-200 text-slate-400'
                        }`}>
                          {item.year.includes('–') ? item.year.replace('–', '\n').split('\n').map((y, i) => (
                            <span key={i} className="block leading-none">{y.slice(2)}</span>
                          )) : item.year.slice(2)}
                        </div>
                        <div className="pt-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-xs font-mono text-slate-400">{item.year}</span>
                            <span className="text-sm font-bold text-slate-800">{item.label}</span>
                            {item.current && (
                              <span className="text-[10px] font-bold text-primary-600 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-full">
                                {vi ? 'HIỆN TẠI' : 'NOW'}
                              </span>
                            )}
                          </div>
                          <ul className="space-y-1">
                            {item.bullets.map((b, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                                <span className={`mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full ${item.current ? 'bg-primary-500' : 'bg-gray-300'}`} />
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WHY INSIGHTOS */}
          {active === 'why' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-primary-900 to-primary-700 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={20} />
                  <h2 className="text-lg font-bold">
                    {vi ? 'Tại sao InsightOS?' : 'Why InsightOS?'}
                  </h2>
                </div>
                <p className="text-primary-200 text-sm leading-relaxed">
                  {vi
                    ? 'InsightOS không phải một báo cáo hay dashboard tĩnh. Đây là AI Operations Copilot — công cụ giúp quản lý đưa ra quyết định nhanh hơn, chính xác hơn, dựa trên dữ liệu thực tế.'
                    : 'InsightOS is not a report or a static dashboard. It\'s an AI Operations Copilot — a tool that helps managers make faster, more accurate decisions grounded in real customer data.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: BarChart3, title: vi ? 'Từ dữ liệu rời rạc → Insight thống nhất' : 'From Fragmented Data → Unified Insight',
                    body: vi ? `${totalReviews} đánh giá từ nhiều nền tảng được tổng hợp và phân tích thành một bức tranh vận hành duy nhất.` : `${totalReviews} reviews from multiple platforms aggregated into one unified operational picture.` },
                  { icon: TrendingUp, title: vi ? 'Từ phản ứng → Chủ động' : 'From Reactive → Proactive',
                    body: vi ? 'Hệ thống phát hiện vấn đề trước khi điểm số giảm, thay vì sau khi thiệt hại đã xảy ra.' : 'System detects issues before scores drop, rather than after damage is already done.' },
                  { icon: Lightbulb, title: vi ? 'Từ trực giác → Bằng chứng' : 'From Intuition → Evidence',
                    body: vi ? 'Mọi khuyến nghị đều có cơ sở từ dữ liệu thực tế với tác động dự kiến đo lường được.' : 'Every recommendation is grounded in real data with measurable projected impact.' },
                  { icon: Users, title: vi ? 'Từ quản lý một người → Cả chuỗi' : 'From One Manager → Whole Chain',
                    body: vi ? `Cho phép quản lý theo dõi tất cả ${branchCount} chi nhánh từ một dashboard duy nhất.` : `Enables managers to monitor all ${branchCount} branches from a single workspace simultaneously.` },
                ].map(item => (
                  <div key={item.title} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center mb-3">
                      <item.icon size={16} className="text-primary-700" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1.5">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  {vi ? 'Team' : 'Team'}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {['HSB Group 12', 'June 2026 Research', 'Next.js 14', 'Firebase', 'Recharts', 'Framer Motion'].map(tag => (
                    <span key={tag} className="text-xs font-medium text-primary-700 bg-primary-50 border border-primary-100 px-3 py-1.5 rounded-xl">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </motion.div>
  )
}
