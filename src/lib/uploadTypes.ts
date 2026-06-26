export type SentimentLabel = 'positive' | 'negative' | 'neutral'
export type CategoryKey =
  | 'waiting_time'
  | 'service_quality'
  | 'hygiene'
  | 'order_accuracy'
  | 'product_quality'
  | 'general'

export interface RawReview {
  date:         string
  platform:     string
  branch_name:  string
  review_text:  string
  author_name?: string
  rating?:      number
}

export interface ProcessedReview extends RawReview {
  sentiment:       SentimentLabel
  sentiment_score: number
  categories:      CategoryKey[]
  keywords_found:  string[]
  processed_at:    string
}

export interface BranchMetrics {
  branch_name:         string
  total_reviews:       number
  avg_rating:          number
  positive_count:      number
  negative_count:      number
  neutral_count:       number
  positive_percentage: number
  negative_percentage: number
  health_score:        number
  critical_issues:     string[]
  updated_at:          string
}

export interface UploadStats {
  total_reviews:     number
  branches:          string[]
  avg_health_score:  number
  positive_pct:      number
  negative_pct:      number
  processing_time_ms: number
}

export interface UploadResponse {
  success:  boolean
  stats?:   UploadStats
  error?:   string
}
