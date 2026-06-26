export interface ClosedLoopStep {
  key:    string
  label:  string
  labelVi: string
  count:  number
  unit:   string
  unitVi: string
  status: 'complete' | 'active' | 'pending'
  color:  string
}

export const closedLoopSteps: ClosedLoopStep[] = [
  {
    key: 'detection',
    label: 'Issue Detection',    labelVi: 'Phát hiện vấn đề',
    count: 5, unit: 'detected',  unitVi: 'phát hiện',
    status: 'complete', color: 'red',
  },
  {
    key: 'recommendation',
    label: 'AI Recommendation',  labelVi: 'Đề xuất AI',
    count: 8, unit: 'generated', unitVi: 'đã tạo',
    status: 'complete', color: 'purple',
  },
  {
    key: 'action',
    label: 'Action Assigned',    labelVi: 'Giao hành động',
    count: 8, unit: 'assigned',  unitVi: 'đã giao',
    status: 'complete', color: 'amber',
  },
  {
    key: 'implementation',
    label: 'Implemented',        labelVi: 'Đã triển khai',
    count: 3, unit: 'completed', unitVi: 'hoàn thành',
    status: 'complete', color: 'blue',
  },
  {
    key: 'measurement',
    label: 'Measured',           labelVi: 'Đã đo lường',
    count: 3, unit: 'measured',  unitVi: 'đã đo',
    status: 'active', color: 'teal',
  },
  {
    key: 'monitoring',
    label: 'Monitored',          labelVi: 'Đang theo dõi',
    count: 2, unit: 'active',    unitVi: 'đang theo dõi',
    status: 'active', color: 'green',
  },
  {
    key: 'improvement',
    label: 'Business Impact',    labelVi: 'Tác động kinh doanh',
    count: 1, unit: 'confirmed', unitVi: 'xác nhận',
    status: 'active', color: 'emerald',
  },
]

export const closedLoopStats = {
  issuesDetected:       5,
  recommendationsGen:   8,
  actionsAssigned:      8,
  actionsImplemented:   3,
  actionsMeasured:      3,
  actionsMonitoring:    2,
  actionsImproved:      1,
  improvementRate:      68,
  stagesActive:         4,
  totalStages:          7,
  coveragePct:          Math.round((4 / 7) * 100),
}
