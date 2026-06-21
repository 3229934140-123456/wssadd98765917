export interface WaybillInfo {
  waybillCode: string
  productName: string
  productType: string
  requiredTempZone: string
  tempMin: number
  tempMax: number
  warehouse: string
  estimatedArrivalTime: string
  actualArrivalTime: string
  vehicleNo: string
  driverName: string
  driverPhone: string
}

export interface TempRecord {
  timestamp: string
  temperature: number
  status: 'normal' | 'warning' | 'over'
}

export interface TempSummary {
  hasOverTemp: boolean
  hasWarningTemp: boolean
  avgTemp: number
  maxTemp: number
  minTemp: number
  latestTemp: number
  overTempCount: number
  warningTempCount: number
  records: TempRecord[]
}

export interface OverTempDetail {
  startTime: string
  endTime: string
  durationMinutes: number
  maxTemperature: number
  avgTemperature: number
}

export interface CheckPhoto {
  type: 'doorSeal' | 'outerPackage' | 'tempGun'
  url: string
  uploadTime: string
}

export interface AbnormalItem {
  key: string
  label: string
  value: boolean
}

export type SignSuggestion = 'normal' | 'remark' | 'reject'

export type SyncStatus = 'pending' | 'success' | 'failed'

export type ReviewConclusion = 'approved' | 'conditional' | 'rejected'

export interface ReviewInfo {
  conclusion: ReviewConclusion
  conclusionLabel: string
  reviewer: string
  reviewTime: string
  comment: string
}

export type DisposalStatus = 'stored' | 'returned' | 'negotiating'

export interface DisposalInfo {
  status: DisposalStatus
  statusLabel: string
  operator: string
  operateTime: string
  remark: string
}

export interface SignResult {
  suggestion: SignSuggestion
  suggestionLabel: string
  remark: string
  operator: string
  operateTime: string
  syncToLogistics?: SyncStatus
  syncToQuality?: SyncStatus
  reviewInfo?: ReviewInfo
  disposalInfo?: DisposalInfo
}

export type TimelineStepType = 'scan' | 'check' | 'sign' | 'sync' | 'review' | 'disposal'

export interface TimelineItem {
  type: TimelineStepType
  typeLabel: string
  title: string
  operator: string
  operateTime: string
  description: string
  status?: 'success' | 'warning' | 'danger' | 'info'
  detail?: string
}

export interface ExportReport {
  generatedAt: string
  summary: {
    totalCount: number
    overTempCount: number
    syncFailedCount: number
    normalCount: number
    remarkCount: number
    rejectCount: number
  }
  filters: {
    keyword?: string
    status?: string
    timeRange?: string
    overTempOnly?: boolean
  }
  records: Array<{
    waybillCode: string
    productName: string
    storeName: string
    operateTime: string
    suggestionLabel: string
    hasOverTemp: boolean
    maxTemp: number
    syncLogistics: string
    syncQuality: string
    reviewConclusion?: string
    disposalStatus?: string
    remark: string
  }>
}

export type TimeRange = 'today' | 'week' | 'month' | 'all'

export interface AuditRecord {
  id: string
  waybillInfo: WaybillInfo
  tempSummary: TempSummary
  overTempDetails: OverTempDetail[]
  photos: CheckPhoto[]
  abnormalItems: AbnormalItem[]
  signResult: SignResult
  status: SignSuggestion
  createTime: string
  storeName: string
}

export type AuditStep = 'scan' | 'check' | 'result'

export interface DashboardStats {
  totalCount: number
  overTempCount: number
  syncFailedCount: number
  byStore: Array<{ name: string; count: number; overTemp: number; syncFailed: number }>
  byProduct: Array<{ name: string; count: number; overTemp: number; syncFailed: number }>
  byStatus: Array<{ name: string; key: SignSuggestion; count: number; overTemp: number; syncFailed: number }>
}

export interface SearchQuery {
  keyword?: string
  status?: SignSuggestion | 'syncFailed' | 'overTemp' | 'all'
  timeRange?: TimeRange
  overTempOnly?: boolean
}
