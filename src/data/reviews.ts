import type { Review, Platform, Sentiment, PainPoint } from './types'

const NAMES = [
  'Nguyễn Thị Mai', 'Trần Văn Hùng', 'Lê Thu Hà', 'Phạm Minh Tuấn', 'Hoàng Thị Lan',
  'Đặng Văn Nam', 'Vũ Thị Phương', 'Bùi Thành Long', 'Đỗ Thu Trang', 'Ngô Minh Hiếu',
  'Trịnh Thị Hoa', 'Dương Văn Khoa', 'Lý Thị Bích', 'Phan Văn Đức', 'Mai Thị Ngọc',
  'Đinh Anh Tuấn', 'Cao Thị Thu', 'Lưu Văn Bình', 'Hà Thị Yến', 'Tống Minh Quân',
  'Nguyễn Hoàng Nam', 'Trần Thị Cúc', 'Lê Văn Hải', 'Phạm Thị Linh', 'Hoàng Văn An',
  'Đặng Thị Hương', 'Vũ Minh Tâm', 'Bùi Thị Nga', 'Đỗ Quang Huy', 'Ngô Thị Sen',
  'Ẩn danh', 'KhachHang_001', 'user_hanoi', 'CoffeeLover', 'TravelerVN',
  'Minh Châu', 'Thanh Thảo', 'Kim Anh', 'Bảo Ngọc', 'Hải Đăng',
  'Trúc Linh', 'Quốc Khánh', 'Thùy Dương', 'Mạnh Tuấn', 'Linh Chi',
  'Ngọc Ánh', 'Hương Giang', 'Tiến Dũng', 'Thu Uyên', 'Đức Mạnh',
]

const POSITIVE_TEXTS = [
  'Trà ngon, không gian đẹp, nhân viên nhiệt tình. Chắc chắn sẽ quay lại!',
  'Ô long sữa rất thơm, đậm vị trà. Packaging chỉn chu, phù hợp làm quà.',
  'Không gian thoải mái, đồ uống ngon, giá hợp lý. Hài lòng lắm!',
  'Phục vụ nhanh, thái độ nhân viên tốt. Trà phin sữa tuyệt vời.',
  'Từ ngày có Phê La là bỏ bê sạch các quán trà sữa khác, mê lắm.',
  'Lần đầu thử Phê La, chọn ô long sữa — vị lạ mà ngon, không giống trà sữa thông thường.',
  'Packaging đẹp, hướng dẫn pha dễ hiểu. Rất phù hợp để tặng quà.',
  'Nhân viên niềm nở, order đúng, giao nhanh. 5 sao xứng đáng!',
  'Trà ô long đậm đặc rất thơm ngon. Mình sẽ ủng hộ thêm các món khác.',
  'Quán sạch, view đẹp, Wi-Fi ổn. Ngồi làm việc cả buổi không muốn về.',
  'Matcha latte ngon xuất sắc, không quá ngọt. Đây là quán yêu thích rồi.',
  'Phê La đúng là thương hiệu xứng đáng với danh tiếng. Mọi thứ đều chuẩn!',
  'Trà ngon, giá ổn, nhân viên friendly. Sẽ giới thiệu cho bạn bè.',
  'Đặt qua app rất tiện, nhận đồ đúng giờ, đồ uống vẫn lạnh và ngon.',
  'Không gian yên tĩnh, nhạc nhẹ, ánh sáng đẹp — hoàn hảo để học bài.',
]

const NEGATIVE_TEXTS = [
  'Chờ 45 phút mới có đồ uống, quá lâu cho một cốc trà!',
  'Nhân viên thái độ không tốt, hỏi gì cũng trả lời cộc lốc.',
  'Đặt qua app nhưng thiếu đồ, không báo trước. Gọi điện cũng không bắt máy.',
  'Ghế không đủ, phải đứng chờ 20 phút mới có chỗ ngồi.',
  'Giá cao mà đồ uống không ngon như kỳ vọng. Không đáng tiền.',
  'Giao hàng chậm 1 tiếng, đồ bị loãng do đá tan hết. Rất thất vọng.',
  'Sai order 2 lần, không một lời xin lỗi. Dịch vụ cần cải thiện nhiều.',
  'Đặt 0% đường nhưng vẫn ngọt. Nhân viên không đọc yêu cầu khách.',
  'Quán quá ồn ào, không ngồi làm việc được. Mất hẳn không gian chill.',
  'Nhân viên mới chưa được training tốt, pha sai công thức liên tục.',
  'Hôm nay đến lần thứ 3, cả 3 lần đều chờ hơn 30 phút. Không thể chấp nhận.',
  'Máy lạnh hỏng, quán nóng bức. Ngồi 10 phút đã không chịu được.',
  'Thiếu nhân viên ca tối, hàng chờ dài mà chỉ có 2 người phục vụ.',
  'Đồ giao không đúng hình ảnh quảng cáo. Lượng kem cheese quá ít.',
  'Gọi cho quán xử lý sai order nhưng không ai nghe máy trong 30 phút.',
  'Vệ sinh nhà vệ sinh rất tệ. Quán đẹp nhưng điểm này trừ nhiều lắm.',
  'Thái độ thu ngân hôm nay khó chịu, không chào hỏi hay cảm ơn khách.',
  'App báo 20 phút nhưng chờ 1 tiếng 20 phút mới có đồ. Sai quá nhiều.',
  'Trà bị đắng, không đúng vị như lần trước. Chất lượng không ổn định.',
  'Chờ 1 tiếng rưỡi mới có đồ uống. Lần đầu và cũng là lần cuối.',
]

const NEUTRAL_TEXTS = [
  'Đồ uống ổn, không có gì đặc biệt so với các quán khác trong khu vực.',
  'Bình thường, hơi đông vào giờ tan tầm nhưng chấp nhận được.',
  'Vị trà vừa phải, không quá nổi bật. Sẽ thử thêm lần nữa mới đánh giá chắc.',
  'Không gian được, nhưng nhạc hơi to. Phù hợp gặp gỡ bạn bè hơn là làm việc.',
  'Giá cao hơn mức bình thường một chút, nhưng chất lượng cũng tương đương.',
]

const PLATFORMS: Platform[]    = ['Google', 'ShopeeFood', 'GrabFood', 'TikTok', 'Facebook', 'Threads']
const PLATFORM_W               = [30, 25, 20, 10, 10, 5]
const BRANCH_IDS               = ['nvc', 'nt', 'tt', 'tqh', 'lvl']
const PAIN_POINTS: PainPoint[] = ['WaitingTime','ServiceQuality','ProductQuality','Delivery','Environment','Pricing','Seating','Other']

// Per-branch sentiment weights [positive%, neutral%, negative%]
const BRANCH_SENTIMENT: Record<string, [number, number, number]> = {
  nvc: [60, 4, 36],
  nt:  [27, 2, 71],
  tt:  [25, 0, 75],
  tqh: [25, 2, 73],
  lvl: [36, 2, 62],
}

// Per-branch pain point weights matching real data
const BRANCH_PAIN_W: Record<string, number[]> = {
  nvc: [14, 17, 2, 0, 0, 2, 2, 17],   // WaitingTime, Service, Product, Delivery, Env, Pricing, Seating, Other
  nt:  [21, 22, 1, 0, 2, 5, 2, 9],
  tt:  [23, 17, 1, 1, 2, 0, 1, 11],
  tqh: [25, 10, 1, 2, 2, 1, 0, 14],
  lvl: [9,  24, 0, 0, 3, 0, 0, 14],
}

const BRANCH_COUNTS: Record<string, number> = { nvc: 52, nt: 62, tt: 56, tqh: 55, lvl: 50 }

function weightedPick<T>(arr: T[], weights: number[], seed: number): T {
  const total = weights.reduce((a, b) => a + b, 0)
  if (total === 0) return arr[arr.length - 1]
  let r = ((seed * 1664525 + 1013904223) & 0x7fffffff) % total
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i]
    if (r < 0) return arr[i]
  }
  return arr[arr.length - 1]
}

function lcg(seed: number): number {
  return (seed * 1664525 + 1013904223) & 0x7fffffff
}

function daysBefore(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  const hour = 7 + (n % 15)
  d.setHours(hour, (n * 7) % 60, 0, 0)
  return d.toISOString()
}

export function generateReviews(): Review[] {
  const reviews: Review[] = []
  let id = 1

  for (const branchId of BRANCH_IDS) {
    const count = BRANCH_COUNTS[branchId]
    const [posP, neuP] = BRANCH_SENTIMENT[branchId]
    const painW = BRANCH_PAIN_W[branchId]

    for (let i = 0; i < count; i++) {
      let seed = id * 31337 + branchId.charCodeAt(0) * 7 + i * 1009

      seed = lcg(seed)
      const pct = seed % 100

      let sentiment: Sentiment
      if (pct < posP)             sentiment = 'Positive'
      else if (pct < posP + neuP) sentiment = 'Neutral'
      else                        sentiment = 'Negative'

      seed = lcg(seed)
      const platform = weightedPick(PLATFORMS, PLATFORM_W, seed)

      seed = lcg(seed)
      const painPoint = weightedPick(PAIN_POINTS, painW, seed)

      seed = lcg(seed)
      let rating: number | null = null
      if (platform !== 'TikTok' && platform !== 'Threads' && platform !== 'Facebook') {
        if (sentiment === 'Positive') rating = 4 + (seed % 2)
        else if (sentiment === 'Neutral') rating = 3
        else rating = 1 + (seed % 2)
      }

      seed = lcg(seed)
      const reviewerName = NAMES[seed % NAMES.length]

      seed = lcg(seed)
      let texts: string[]
      if (sentiment === 'Positive')      texts = POSITIVE_TEXTS
      else if (sentiment === 'Negative') texts = NEGATIVE_TEXTS
      else                               texts = NEUTRAL_TEXTS

      const reviewText = texts[seed % texts.length]

      seed = lcg(seed)
      const daysAgo = seed % 45

      reviews.push({
        id, branchId, platform, rating, reviewerName, reviewText, sentiment, painPoint,
        date: daysBefore(daysAgo),
      })
      id++
    }
  }

  return reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const reviews: Review[] = generateReviews()

export function getReviewsForBranch(branchId: string): Review[] {
  return reviews.filter(r => r.branchId === branchId)
}

export function getSentimentCounts(branchId?: string) {
  const subset = branchId ? reviews.filter(r => r.branchId === branchId) : reviews
  return {
    positive: subset.filter(r => r.sentiment === 'Positive').length,
    neutral:  subset.filter(r => r.sentiment === 'Neutral').length,
    negative: subset.filter(r => r.sentiment === 'Negative').length,
    total:    subset.length,
  }
}

export function getTrendData(days = 7) {
  const result: { date: string; positive: number; negative: number; neutral: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayReviews = reviews.filter(r => r.date.startsWith(dateStr))
    result.push({
      date:     dateStr.slice(5),
      positive: dayReviews.filter(r => r.sentiment === 'Positive').length,
      neutral:  dayReviews.filter(r => r.sentiment === 'Neutral').length,
      negative: dayReviews.filter(r => r.sentiment === 'Negative').length,
    })
  }
  return result
}

export function getPainPointCounts(branchId?: string) {
  const subset = branchId ? reviews.filter(r => r.branchId === branchId) : reviews
  const counts: Record<string, number> = {}
  for (const r of subset) {
    counts[r.painPoint] = (counts[r.painPoint] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([key, count]) => ({ key, label: key.replace(/([A-Z])/g, ' $1').trim(), count }))
    .sort((a, b) => b.count - a.count)
}
