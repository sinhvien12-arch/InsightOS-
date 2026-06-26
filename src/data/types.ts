export type Sentiment  = 'Positive' | 'Neutral' | 'Negative'
export type Priority   = 'Critical' | 'High' | 'Medium' | 'Low'
export type Platform   = 'Google' | 'ShopeeFood' | 'GrabFood' | 'TikTok' | 'Facebook' | 'Threads'
export type PainPoint  = 'WaitingTime' | 'ServiceQuality' | 'ProductQuality' | 'Delivery' | 'Environment' | 'Pricing' | 'Seating' | 'Other'
export type IssueStatus   = 'Open' | 'In Progress' | 'Monitoring' | 'Resolved'
export type ActionStatus  = 'Pending' | 'In Progress' | 'Done' | 'Monitoring'

export interface Branch {
  id:           string
  name:         string
  address:      string
  district:     string
  healthScore:  number
  prevScore:    number
  avgRating:    number
  reviewCount:  number
  issueCount:   number
  sentiment: {
    positive: number
    neutral:  number
    negative: number
  }
  topPainPoints: { label: string; count: number; key: PainPoint }[]
  openHours:    string
  manager:      string
}

export interface Review {
  id:           number
  branchId:     string
  date:         string
  platform:     Platform
  rating:       number | null
  reviewerName: string
  reviewText:   string
  sentiment:    Sentiment
  painPoint:    PainPoint
}

export interface Alert {
  id:             string
  severity:       'High' | 'Medium' | 'Low'
  title:          string
  titleVi?:       string
  description:    string
  descriptionVi?: string
  branchId:       string | null
  branchName:     string | null
  metric:         string
  change:         string
  timestamp:      string
  actionLabel:    string
  actionRoute:    string
}

export interface Recommendation {
  id:                      string
  branchId:                string | null
  branchName:              string | null
  priority:                Priority
  category:                string
  title:                   string
  titleVi?:                string
  description:             string
  descriptionVi?:          string
  expectedImpact:          string
  estimatedImprovement:    string
  estimatedImprovementVi?: string
  effort:                  'Low' | 'Medium' | 'High'
  timeframe:               string
  tags:                    string[]
}

export interface Issue {
  id:                string
  code:              string
  title:             string
  titleVi?:          string
  description:       string
  descriptionVi?:    string
  category:          PainPoint
  priority:          Priority
  status:            IssueStatus
  branchId:          string | null
  affectedBranches:  string[]
  reviewCount:       number
  trend:             'Rising' | 'Stable' | 'Falling'
  rootCauses:        string[]
  rootCausesVi?:     string[]
  businessImpact:    string
  businessImpactVi?: string
  detectedAt:        string
  beforeMetrics:     { label: string; labelVi?: string; value: string }[]
  afterMetrics:      { label: string; labelVi?: string; value: string }[]
}

export interface Action {
  id:               string
  issueId:          string
  issueCode:        string
  title:            string
  titleVi?:         string
  description:      string
  descriptionVi?:   string
  owner:            string
  branchId:         string | null
  branchName:       string | null
  priority:         Priority
  status:           ActionStatus
  deadline:         string
  progress:         number
  expectedImpact:   string
  expectedImpactVi?: string
  tags:             string[]
  timeline?:        TimelineEvent[]
  comments?:        ActionComment[]
  monitoring?:      MonitoringState
  actualImpact?:    ActualImpactItem[]
}

export interface TimelineEvent {
  date:     string
  event:    string
  eventVi:  string
  type:     'created' | 'assigned' | 'progress' | 'deployed' | 'completed' | 'monitoring' | 'improved'
}

export interface ActionComment {
  id:      string
  author:  string
  date:    string
  text:    string
  textVi:  string
}

export interface MonitoringState {
  startDate:   string
  period:      7 | 14 | 30
  status:      'Improving' | 'Stable' | 'Regression Risk'
  nextCheckIn: string
}

export interface ActualImpactItem {
  metric:   string
  metricVi: string
  expected: string
  actual:   string
  delta:    string
  positive: boolean
}

export interface AIResponse {
  intent:      string
  keywords:    string[]
  response:    string
  responseVi?: string
}

export interface SimulatorScenario {
  id:      string
  title:   string
  titleVi: string
  desc:    string
  descVi:  string
  icon:    string
  metrics: SimMetric[]
}

export interface SimMetric {
  label:          string
  unit:           string
  before:         number
  after:          (intensity: number) => number
  higherIsBetter: boolean
}
