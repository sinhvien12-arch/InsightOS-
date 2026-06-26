import type { AIResponse } from './types'

export const aiResponses: AIResponse[] = [
  {
    intent: 'satisfaction_drop',
    keywords: ['drop', 'fell', 'decrease', 'lower', 'worse', 'satisfaction', 'why', 'dropped', 'giảm', 'tụt'],
    response: `Based on our current dataset of 504 customer reviews, satisfaction is under pressure from **three converging factors**:

1. **Thanh Thái & Trần Quốc Hoàn waiting time crisis** — 23 and 25 reviews respectively cite waiting as the primary complaint. That's 41–45% of each branch's total reviews. Both branches are understaffed during peak lunch and evening windows.

2. **Service quality breakdown** — 110 reviews chain-wide cite service quality issues. Most severe at Lê Văn Lương (24/50 reviews, 48%) and Núi Trúc (22/62 reviews, 35%). Root cause: recently onboarded staff without completed training, and evening shift supervision gaps.

3. **Thanh Thái reputation spiral** — 75% negative sentiment and 1.93★ average rating at Thanh Thái means every new review compounds brand damage. Health score is now 43/100 — lowest in the chain.

**My recommendation:** Initiate the Thanh Thái emergency service audit immediately (ISS-003), and deploy the peak-hour barista schedule at Trần Quốc Hoàn this week (ACT-002). These two actions together are projected to lift chain health score by 5–8 points within 30 days.`,
    responseVi: `Dựa trên 504 đánh giá khách hàng hiện tại, sự hài lòng đang chịu áp lực từ **ba yếu tố hội tụ**:

1. **Khủng hoảng thời gian chờ tại Thanh Thái & Trần Quốc Hoàn** — lần lượt 23 và 25 đánh giá nêu chờ đợi là phàn nàn chính, chiếm 41–45% tổng đánh giá mỗi chi nhánh. Cả hai chi nhánh đều thiếu nhân sự trong giờ cao điểm buổi trưa và tối.

2. **Sụp đổ chất lượng dịch vụ** — 110 đánh giá toàn chuỗi nêu vấn đề chất lượng dịch vụ. Nghiêm trọng nhất tại Lê Văn Lương (24/50 đánh giá, 48%) và Núi Trúc (22/62 đánh giá, 35%). Nguyên nhân gốc: nhân viên mới chưa hoàn thành đào tạo và thiếu giám sát ca tối.

3. **Vòng xoáy danh tiếng Thanh Thái** — 75% phản hồi tiêu cực và đánh giá TB 1.93★ tại Thanh Thái khiến mỗi đánh giá mới đều gây thêm thiệt hại cho thương hiệu. Điểm sức khỏe hiện 43/100 — thấp nhất chuỗi.

**Khuyến nghị:** Khởi động ngay kiểm tra dịch vụ khẩn cấp Thanh Thái (ISS-003) và triển khai lịch barista cao điểm tại Trần Quốc Hoàn tuần này (ACT-002). Hai hành động này dự kiến nâng điểm sức khỏe chuỗi 5–8 điểm trong 30 ngày.`,
  },
  {
    intent: 'branch_attention',
    keywords: ['branch', 'attention', 'worst', 'problem', 'urgent', 'immediate', 'chi nhánh', 'cần', 'tệ nhất'],
    response: `**Thanh Thái** requires immediate attention. Here's the full triage:

| Branch | Health Score | Negative % | Priority |
|--------|-------------|------------|----------|
| Thanh Thái | 43/100 ↓ | 75% | 🔴 Critical |
| Trần Quốc Hoàn | 46/100 ↓ | 73% | 🔴 Critical |
| Núi Trúc | 48/100 ↓ | 71% | 🔴 Critical |
| Lê Văn Lương | 62/100 ↓ | 62% | 🟡 High |
| Nguyễn Văn Cừ | 78/100 ↑ | 36% | 🟢 Healthy |

Three branches are in the Critical zone (health score <50). Thanh Thái has the worst rating in the chain at 1.93★ with 75% negative sentiment across 56 reviews.

**Immediate action:** Open ISS-003 (Thanh Thái Critical Performance Crisis) and assign ACT-001 to the branch manager. A service audit + retraining plan is already queued. See Issues page for the full breakdown.`,
    responseVi: `**Thanh Thái** cần được xử lý ngay lập tức. Đây là đánh giá toàn bộ:

| Chi nhánh | Điểm sức khỏe | Tiêu cực % | Ưu tiên |
|-----------|--------------|------------|---------|
| Thanh Thái | 43/100 ↓ | 75% | 🔴 Nghiêm trọng |
| Trần Quốc Hoàn | 46/100 ↓ | 73% | 🔴 Nghiêm trọng |
| Núi Trúc | 48/100 ↓ | 71% | 🔴 Nghiêm trọng |
| Lê Văn Lương | 62/100 ↓ | 62% | 🟡 Cao |
| Nguyễn Văn Cừ | 78/100 ↑ | 36% | 🟢 Khỏe mạnh |

Ba chi nhánh đang ở vùng Nghiêm trọng (điểm sức khỏe <50). Thanh Thái có đánh giá tệ nhất chuỗi với 1.93★ và 75% phản hồi tiêu cực trong 56 đánh giá.

**Hành động ngay:** Mở ISS-003 (Khủng hoảng hiệu suất nghiêm trọng Thanh Thái) và giao ACT-001 cho quản lý chi nhánh. Kế hoạch kiểm tra dịch vụ + đào tạo lại đã được xếp hàng. Xem trang Vấn đề để biết đầy đủ chi tiết.`,
  },
  {
    intent: 'top_complaints',
    keywords: ['complaints', 'top', 'issues', 'problems', 'feedback', 'pain', 'what', 'phàn nàn', 'vấn đề'],
    response: `Across all 504 reviews, here are the **top customer complaints** by frequency:

1. **Waiting Time** — 142 mentions (28%) 🔴 Critical
   *"Chờ 45 phút mới có đồ uống"*, *"Hàng chờ quá dài giờ cao điểm"*

2. **Service Quality** — 110 mentions (22%) 🔴 Critical
   *"Nhân viên thái độ không tốt"*, *"Sai order 2 lần không xin lỗi"*

3. **Other / Misc** — 147 mentions (29%) 🟡 Watch
   Pricing, packaging, general experience feedback

4. **Delivery** — 29 mentions (6%) 🟡 Watch
   *"Giao hàng chậm 1 tiếng"*, *"App báo 20 phút nhưng chờ hơn 1 tiếng"*

5. **Product Quality** — 23 mentions (5%) 🟢 Moderate
   *"Vị khác lần trước"*, *"Kem cheese quá ít"*

**Hotspot branches:** Trần Quốc Hoàn (45% wait rate) and Thanh Thái (41% wait rate) are the worst offenders. Evening shifts across Núi Trúc and Lê Văn Lương drive the majority of service quality complaints.`,
    responseVi: `Trên tất cả 504 đánh giá, đây là **các phàn nàn hàng đầu** theo tần suất:

1. **Thời gian chờ** — 142 lần đề cập (28%) 🔴 Nghiêm trọng
   *"Chờ 45 phút mới có đồ uống"*, *"Hàng chờ quá dài giờ cao điểm"*

2. **Chất lượng dịch vụ** — 110 lần đề cập (22%) 🔴 Nghiêm trọng
   *"Nhân viên thái độ không tốt"*, *"Sai order 2 lần không xin lỗi"*

3. **Khác / Tổng hợp** — 147 lần đề cập (29%) 🟡 Theo dõi
   Giá cả, bao bì, phản hồi trải nghiệm chung

4. **Giao hàng** — 29 lần đề cập (6%) 🟡 Theo dõi
   *"Giao hàng chậm 1 tiếng"*, *"App báo 20 phút nhưng chờ hơn 1 tiếng"*

5. **Chất lượng sản phẩm** — 23 lần đề cập (5%) 🟢 Trung bình
   *"Vị khác lần trước"*, *"Kem cheese quá ít"*

**Chi nhánh nóng:** Trần Quốc Hoàn (45% tỷ lệ chờ) và Thanh Thái (41% tỷ lệ chờ) là tệ nhất. Ca tối tại Núi Trúc và Lê Văn Lương chiếm phần lớn phàn nàn chất lượng dịch vụ.`,
  },
  {
    intent: 'weekly_summary',
    keywords: ['summary', 'week', 'report', 'overview', 'tóm tắt', 'tuần', 'báo cáo'],
    response: `## Operations Summary — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}

**Chain Health Score: 54/100** (3 branches in Critical zone)

**Dataset:** 504 customer reviews analyzed | 5 branches monitored

**Overall sentiment:**
- Positive: 34% (173 reviews)
- Neutral: 2% (9 reviews)
- Negative: 64% (322 reviews)

**Average rating: 2.37★** across 275 branch-attributed reviews

**Branch performance:**
- 🟢 Nguyễn Văn Cừ: 78/100 ↑ Best performer (+6 pts this month)
- 🟡 Lê Văn Lương: 62/100 ↓ Monitoring — service drift
- 🔴 Núi Trúc: 48/100 ↓ Critical threshold approaching
- 🔴 Trần Quốc Hoàn: 46/100 ↓ Wait time overload (45% complaint rate)
- 🔴 Thanh Thái: 43/100 ↓ Emergency — lowest in chain

**Top priority this week:** Initiate Thanh Thái emergency audit (ACT-001) + deploy peak-hour barista at TQH (ACT-002). These two actions are projected to lift chain health score by 5–8 points within 30 days.`,
    responseVi: `## Tóm tắt vận hành — ${new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}

**Điểm sức khỏe chuỗi: 54/100** (3 chi nhánh ở vùng Nghiêm trọng)

**Dữ liệu:** 504 đánh giá khách hàng được phân tích | 5 chi nhánh được theo dõi

**Cảm xúc tổng thể:**
- Tích cực: 34% (173 đánh giá)
- Trung tính: 2% (9 đánh giá)
- Tiêu cực: 64% (322 đánh giá)

**Đánh giá TB: 2.37★** trên 275 đánh giá có gắn chi nhánh

**Hiệu suất chi nhánh:**
- 🟢 Nguyễn Văn Cừ: 78/100 ↑ Tốt nhất (+6 điểm tháng này)
- 🟡 Lê Văn Lương: 62/100 ↓ Theo dõi — sụt giảm dịch vụ
- 🔴 Núi Trúc: 48/100 ↓ Tiếp cận ngưỡng nghiêm trọng
- 🔴 Trần Quốc Hoàn: 46/100 ↓ Quá tải thời gian chờ (45% tỷ lệ phàn nàn)
- 🔴 Thanh Thái: 43/100 ↓ Khẩn cấp — thấp nhất chuỗi

**Ưu tiên hàng đầu tuần này:** Khởi động kiểm tra khẩn cấp Thanh Thái (ACT-001) + triển khai barista cao điểm tại TQH (ACT-002). Hai hành động này dự kiến nâng điểm sức khỏe chuỗi 5–8 điểm trong 30 ngày.`,
  },
  {
    intent: 'compare_branches',
    keywords: ['compare', 'comparison', 'vs', 'versus', 'difference', 'between', 'so sánh', 'khác nhau'],
    response: `Here's a **side-by-side branch comparison** from real customer feedback:

| Metric | NVC | LVL | NT | TQH | TT |
|--------|-----|-----|----|-----|----|
| Health Score | 78 ↑ | 62 ↓ | 48 ↓ | 46 ↓ | 43 ↓ |
| Avg Rating | 3.42★ | 2.50★ | 2.05★ | 2.05★ | 1.93★ |
| Positive % | 60% | 36% | 27% | 25% | 25% |
| Reviews | 52 | 50 | 62 | 55 | 56 |
| Top Issue | Service | Service | Wait+Service | Wait | Wait+Service |

*NVC = Nguyễn Văn Cừ, LVL = Lê Văn Lương, NT = Núi Trúc, TQH = Trần Quốc Hoàn, TT = Thanh Thái*

**Key insight:** The gap between best (NVC: 78) and worst (TT: 43) is **35 points** — a significant variance for a single chain. Nguyễn Văn Cừ's success model (consistent shift scheduling, proactive order confirmation, weekly quality checks) is already documented and ready to replicate at lower-performing branches.`,
    responseVi: `Đây là **so sánh chi nhánh cạnh nhau** từ phản hồi khách hàng thực tế:

| Chỉ số | NVC | LVL | NT | TQH | TT |
|--------|-----|-----|----|-----|----|
| Điểm sức khỏe | 78 ↑ | 62 ↓ | 48 ↓ | 46 ↓ | 43 ↓ |
| Đánh giá TB | 3.42★ | 2.50★ | 2.05★ | 2.05★ | 1.93★ |
| Tích cực % | 60% | 36% | 27% | 25% | 25% |
| Đánh giá | 52 | 50 | 62 | 55 | 56 |
| Vấn đề chính | Dịch vụ | Dịch vụ | Chờ+DV | Chờ đợi | Chờ+DV |

*NVC = Nguyễn Văn Cừ, LVL = Lê Văn Lương, NT = Núi Trúc, TQH = Trần Quốc Hoàn, TT = Thanh Thái*

**Nhận định chính:** Khoảng cách giữa tốt nhất (NVC: 78) và tệ nhất (TT: 43) là **35 điểm** — biến động đáng kể cho một chuỗi. Mô hình thành công của Nguyễn Văn Cừ (lịch ca nhất quán, xác nhận đơn chủ động, kiểm tra chất lượng hàng tuần) đã được tài liệu hóa và sẵn sàng nhân rộng sang các chi nhánh kém hiệu quả hơn.`,
  },
  {
    intent: 'recommendations_ask',
    keywords: ['recommend', 'suggest', 'should', 'action', 'do', 'improve', 'khuyến nghị', 'nên làm'],
    response: `Based on our 504-review dataset, here are my **top 3 recommendations for this week**:

**🔴 Priority 1 — Thanh Thái Emergency Service Recovery (Critical)**
ACT-001 is already queued: 2-day service audit + 4-hour staff retraining. Health score: 43 → target 60 in 30 days. 75% negative sentiment must be reversed before it becomes a permanent reputation issue.

**🔴 Priority 2 — Peak-Hour Barista at TQH & Thanh Thái**
ACT-002: Add 1 barista during 11:30am–1:30pm and 5:30–7:30pm. Cost: ~600K VND/day per branch. Expected: -40% wait complaints, +4 pts chain health score within 2 weeks. Highest volume impact action available.

**🟡 Priority 3 — Complete Lê Văn Lương Staff Onboarding**
ACT-005: 3 staff members have not completed the full training program. With service complaints at 48% of reviews, completing their training now prevents this branch from crossing into Critical territory.

These 3 actions combined are projected to raise chain health score from **54 → 65+** within 30 days. Full details in the Actions page.`,
    responseVi: `Dựa trên 504 đánh giá, đây là **3 khuyến nghị hàng đầu cho tuần này**:

**🔴 Ưu tiên 1 — Phục hồi dịch vụ khẩn cấp Thanh Thái (Nghiêm trọng)**
ACT-001 đã được xếp hàng: kiểm tra dịch vụ 2 ngày + đào tạo lại nhân viên 4 giờ. Điểm sức khỏe: 43 → mục tiêu 60 trong 30 ngày. 75% phản hồi tiêu cực phải được đảo ngược trước khi trở thành vấn đề danh tiếng vĩnh viễn.

**🔴 Ưu tiên 2 — Barista cao điểm tại TQH & Thanh Thái**
ACT-002: Thêm 1 barista trong 11:30–13:30 và 17:30–19:30. Chi phí: ~600K VND/ngày mỗi chi nhánh. Dự kiến: -40% phàn nàn chờ đợi, +4 điểm sức khỏe chuỗi trong 2 tuần. Hành động có tác động khối lượng cao nhất hiện có.

**🟡 Ưu tiên 3 — Hoàn thành đào tạo nhân viên Lê Văn Lương**
ACT-005: 3 nhân viên chưa hoàn thành chương trình đào tạo đầy đủ. Với phàn nàn dịch vụ chiếm 48% đánh giá, hoàn thành đào tạo ngay bây giờ ngăn chi nhánh này vượt ngưỡng Nghiêm trọng.

3 hành động này kết hợp dự kiến nâng điểm sức khỏe chuỗi từ **54 → 65+** trong 30 ngày. Xem chi tiết đầy đủ ở trang Hành động.`,
  },
]

// Greeting and fallback texts keyed by intent (not in the keyword-matched array)
const SPECIAL_RESPONSES: Record<string, { en: string; vi: string }> = {
  greeting_ask: {
    en: `Hello! I'm your **InsightOS AI Copilot**. I have access to all 504 customer reviews across your 5 Hanoi branches.\n\nI can help you understand satisfaction trends, identify root causes, compare branch performance, and recommend actions.\n\nWhat would you like to know?`,
    vi: `Xin chào! Tôi là **AI Copilot InsightOS** của bạn. Tôi có quyền truy cập vào tất cả 504 đánh giá khách hàng trên 5 chi nhánh Hà Nội của bạn.\n\nTôi có thể giúp bạn hiểu xu hướng sự hài lòng, xác định nguyên nhân gốc rễ, so sánh hiệu suất chi nhánh và đề xuất hành động.\n\nBạn muốn biết điều gì?`,
  },
  greeting_center: {
    en: `Hello! I'm your **Phê La InsightOS** AI Copilot.\n\nI've analyzed **504 customer reviews** across 5 Hanoi branches and I'm ready to help you make operational decisions.\n\nYou can ask me about branch performance, customer pain points, recommended actions, or request a weekly summary. What would you like to explore?`,
    vi: `Xin chào! Tôi là **AI Copilot Phê La InsightOS** của bạn.\n\nTôi đã phân tích **504 đánh giá khách hàng** trên 5 chi nhánh Hà Nội và sẵn sàng hỗ trợ bạn ra quyết định vận hành.\n\nBạn có thể hỏi về hiệu suất chi nhánh, điểm đau khách hàng, hành động được đề xuất hoặc yêu cầu tóm tắt hàng tuần. Bạn muốn khám phá điều gì?`,
  },
  fallback: {
    en: `I've analyzed your query against the current dataset of **504 customer reviews** across 5 Phê La branches in Hanoi.\n\n**Current snapshot:**\n- Chain health score: **54/100** (3 branches Critical)\n- Most urgent: **Thanh Thái** (43/100, 75% negative)\n- Top complaint: **Waiting time** (142 reviews, 28%)\n- Overall sentiment: **64% negative**, 2.37★ avg rating\n\nI wasn't able to find a specific response for that exact query. Try one of these:\n\n- Ask **"why did satisfaction drop"** for root-cause analysis\n- Ask **"which branch needs attention"** for triage ranking\n- Ask **"top customer complaints"** for a full pain point breakdown\n- Ask **"weekly summary"** for a complete overview\n- Ask **"compare all branches"** for a side-by-side view\n- Ask **"what should I do"** for prioritized recommendations\n\nYou can also explore the [Issues](/issues) and [Actions](/actions) pages for the full operational workflow.`,
    vi: `Tôi đã phân tích câu hỏi của bạn dựa trên **504 đánh giá khách hàng** tại 5 chi nhánh Phê La ở Hà Nội.\n\n**Tóm tắt hiện tại:**\n- Điểm sức khỏe chuỗi: **54/100** (3 chi nhánh Nghiêm trọng)\n- Khẩn cấp nhất: **Thanh Thái** (43/100, 75% tiêu cực)\n- Phàn nàn hàng đầu: **Thời gian chờ** (142 đánh giá, 28%)\n- Cảm xúc tổng thể: **64% tiêu cực**, đánh giá TB 2.37★\n\nChưa tìm được phản hồi cụ thể cho câu hỏi đó. Hãy thử:\n\n- **"Tại sao sự hài lòng giảm"** để phân tích nguyên nhân gốc\n- **"Chi nhánh nào cần xử lý ngay"** để xem xếp hạng phân loại\n- **"Những phàn nàn hàng đầu là gì"** để xem phân tích điểm đau\n- **"Cho tôi tóm tắt tuần"** để xem tổng quan đầy đủ\n- **"So sánh tất cả chi nhánh"** để xem so sánh cạnh nhau\n- **"Tôi nên làm gì để cải thiện"** để xem khuyến nghị ưu tiên\n\nBạn cũng có thể khám phá các trang [Vấn đề](/issues) và [Hành động](/actions) để xem quy trình vận hành đầy đủ.`,
  },
}

// Build a unified lookup map: intent → { en, vi }
const responseMap: Record<string, { en: string; vi: string }> = {
  ...SPECIAL_RESPONSES,
}
for (const r of aiResponses) {
  responseMap[r.intent] = { en: r.response, vi: r.responseVi ?? r.response }
}

/** Return the intent key that best matches a query (never throws). */
export function getAIResponseKey(query: string): string {
  const q = query.toLowerCase()
  for (const resp of aiResponses) {
    if (resp.keywords.some(kw => q.includes(kw))) return resp.intent
  }
  return 'fallback'
}

/** Look up response text by intent key and language. */
export function getResponseByKey(key: string, lang: 'en' | 'vi'): string {
  const entry = responseMap[key]
  if (!entry) return ''
  return lang === 'vi' ? entry.vi : entry.en
}

/** Legacy helper kept for any callers outside the chat pages. */
export function getAIResponse(query: string, lang: 'en' | 'vi' = 'en'): string {
  return getResponseByKey(getAIResponseKey(query), lang)
}

export const suggestedPrompts = [
  { en: 'Why did satisfaction drop this week?',      vi: 'Tại sao sự hài lòng giảm tuần này?' },
  { en: 'Which branch needs immediate attention?',    vi: 'Chi nhánh nào cần xử lý ngay?' },
  { en: 'What are the top customer complaints?',      vi: 'Những phàn nàn hàng đầu là gì?' },
  { en: 'Give me a weekly summary',                   vi: 'Cho tôi tóm tắt tuần' },
  { en: 'Compare all branches',                       vi: 'So sánh tất cả chi nhánh' },
  { en: 'What should I do to improve operations?',    vi: 'Tôi nên làm gì để cải thiện vận hành?' },
]
