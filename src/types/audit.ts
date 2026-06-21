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

export interface SignResult {
  suggestion: SignSuggestion
  suggestionLabel: string
  remark: string
  operator: string
  operateTime: string
  syncToLogistics?: SyncStatus
  syncToQuality?: SyncStatus
  reviewInfo?: ReviewInfo
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
  byStatus: Array<{ name: string; key: SignSuggestion; count: number }>
}

export interface SearchQuery {
  keyword?: string
  status?: SignSuggestion | 'syncFailed' | 'all'
  timeRange?: TimeRange
}
