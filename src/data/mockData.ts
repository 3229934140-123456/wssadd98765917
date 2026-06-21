import Taro from '@tarojs/taro'
import type { WaybillInfo, TempSummary, OverTempDetail, AuditRecord, AbnormalItem, TempRecord, SyncStatus, SearchQuery, DashboardStats, TimeRange, ReviewInfo, ReviewConclusion, DisposalInfo, DisposalStatus, TimelineItem, ExportReport } from '@/types/audit'

const STORAGE_KEY = 'cold_chain_audit_records_v1'

const generateTempRecords = (baseTemp: number, tempMin: number, tempMax: number, hasOver: boolean, hasWarning: boolean): TempRecord[] => {
  const records = []
  const now = new Date()
  const range = tempMax - tempMin
  for (let i = 119; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 1000)
    let temp = baseTemp + (Math.random() - 0.5) * range * 0.5
    let status: 'normal' | 'warning' | 'over' = 'normal'
    const warningThreshold = tempMax + 2
    const overThreshold = tempMax + 5
    
    if (hasOver && i >= 40 && i <= 55) {
      temp = overThreshold + 1 + Math.random() * 3
      status = 'over'
    } else if (hasWarning && i >= 80 && i <= 90) {
      temp = warningThreshold + Math.random() * 2
      status = 'warning'
    } else if (temp > overThreshold) {
      status = 'over'
    } else if (temp > warningThreshold) {
      status = 'warning'
    }
    
    records.push({
      timestamp: time.toISOString(),
      temperature: Math.round(temp * 10) / 10,
      status
    })
  }
  return records
}

const generateSummary = (records: TempRecord[]): TempSummary => {
  const temps = records.map(r => r.temperature)
  const overRecords = records.filter(r => r.status === 'over')
  const warningRecords = records.filter(r => r.status === 'warning')
  
  return {
    hasOverTemp: overRecords.length > 0,
    hasWarningTemp: warningRecords.length > 0,
    avgTemp: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length * 10) / 10,
    maxTemp: Math.round(Math.max(...temps) * 10) / 10,
    minTemp: Math.round(Math.min(...temps) * 10) / 10,
    latestTemp: temps[temps.length - 1],
    overTempCount: overRecords.length,
    warningTempCount: warningRecords.length,
    records
  }
}

const generateOverTempDetails = (hasOver: boolean, tempMax: number): OverTempDetail[] => {
  if (!hasOver) return []
  const now = new Date()
  const startTime = new Date(now.getTime() - 80 * 60 * 1000)
  const endTime = new Date(now.getTime() - 65 * 60 * 1000)
  const overMax = tempMax + 7
  return [{
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    durationMinutes: 15,
    maxTemperature: Math.round(overMax * 10) / 10,
    avgTemperature: Math.round((tempMax + 5) * 10) / 10
  }]
}

const loadRecordsFromStorage = async (): AuditRecord[] | null => {
  try {
    const res = await Taro.getStorage({ key: STORAGE_KEY })
    if (res && res.data && Array.isArray(res.data)) {
      console.log('[MockData] 从本地存储加载记录成功，共', res.data.length, '条')
      return res.data as AuditRecord[]
    }
  } catch (e) {
    console.log('[MockData] 本地存储无历史记录，使用默认数据')
  }
  return null
}

const saveRecordsToStorage = async (records: AuditRecord[]): void => {
  try {
    Taro.setStorage({ key: STORAGE_KEY, data: records }).catch(err => {
      console.warn('[MockData] 保存失败:', err)
    })
  } catch (e) {
    console.warn('[MockData] 保存本地存储异常:', e)
  }
}

export const mockAbnormalItems: AbnormalItem[] = [
  { key: 'soft', label: '外箱软化', value: false },
  { key: 'blood', label: '血水渗出', value: false },
  { key: 'smell', label: '异味', value: false },
  { key: 'normal', label: '无异常', value: false }
]

interface WaybillData {
  waybillInfo: WaybillInfo
  tempSummary: TempSummary
  overTempDetails: OverTempDetail[]
}

const waybillList: Array<Omit<WaybillInfo, 'estimatedArrivalTime' | 'actualArrivalTime'> & {
  baseTemp: number
  hasOver: boolean
  hasWarning: boolean
}> = [
  {
    waybillCode: 'YL202406210001',
    productName: '冷鲜猪后腿肉',
    productType: '冷鲜肉',
    requiredTempZone: '0-4℃冷藏区',
    tempMin: 0,
    tempMax: 4,
    warehouse: '上海青浦冷链中心',
    vehicleNo: '沪A·D85263',
    driverName: '张师傅',
    driverPhone: '138****5678',
    baseTemp: 2.5,
    hasOver: true,
    hasWarning: true
  },
  {
    waybillCode: 'YL202406210002',
    productName: '进口肥牛卷',
    productType: '冻品',
    requiredTempZone: '-18℃冷冻区',
    tempMin: -20,
    tempMax: -15,
    warehouse: '广州白云冷链仓',
    vehicleNo: '粤B·K72891',
    driverName: '李师傅',
    driverPhone: '139****1234',
    baseTemp: -17,
    hasOver: false,
    hasWarning: false
  },
  {
    waybillCode: 'YL202406210003',
    productName: '冷鲜鸡胸肉',
    productType: '冷鲜肉',
    requiredTempZone: '0-4℃冷藏区',
    tempMin: 0,
    tempMax: 4,
    warehouse: '北京通州冷链基地',
    vehicleNo: '京A·M35628',
    driverName: '王师傅',
    driverPhone: '136****8899',
    baseTemp: 2,
    hasOver: false,
    hasWarning: true
  },
  {
    waybillCode: 'YL202406210004',
    productName: '冻品虾仁',
    productType: '冻品',
    requiredTempZone: '-18℃冷冻区',
    tempMin: -20,
    tempMax: -15,
    warehouse: '深圳龙岗冷链中心',
    vehicleNo: '浙A·L90234',
    driverName: '刘师傅',
    driverPhone: '137****4567',
    baseTemp: -18,
    hasOver: true,
    hasWarning: true
  },
  {
    waybillCode: 'YL202406210005',
    productName: '冷鲜羊排',
    productType: '冷鲜肉',
    requiredTempZone: '0-4℃冷藏区',
    tempMin: 0,
    tempMax: 4,
    warehouse: '杭州余杭冷链仓',
    vehicleNo: '沪B·F18725',
    driverName: '陈师傅',
    driverPhone: '135****7788',
    baseTemp: 3,
    hasOver: false,
    hasWarning: false
  }
]

export const getWaybillByCode = (code: string): WaybillData | null => {
  const trimmed = code.trim()
  if (!trimmed) return null
  
  const found = waybillList.find(w => w.waybillCode === trimmed)
  if (!found) return null
  
  const now = new Date()
  const actualTime = new Date(now.getTime() - 10 * 60000)
  const estimatedTime = new Date(now.getTime() + 20 * 60000)
  const formatTime = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }
  
  const records = generateTempRecords(found.baseTemp, found.tempMin, found.tempMax, found.hasOver, found.hasWarning)
  const summary = generateSummary(records)
  const overDetails = generateOverTempDetails(found.hasOver, found.tempMax)
  
  return {
    waybillInfo: {
      waybillCode: found.waybillCode,
      productName: found.productName,
      productType: found.productType,
      requiredTempZone: found.requiredTempZone,
      tempMin: found.tempMin,
      tempMax: found.tempMax,
      warehouse: found.warehouse,
      estimatedArrivalTime: formatTime(estimatedTime),
      actualArrivalTime: formatTime(actualTime),
      vehicleNo: found.vehicleNo,
      driverName: found.driverName,
      driverPhone: found.driverPhone
    },
    tempSummary: summary,
    overTempDetails: overDetails
  }
}

export const getKnownWaybillCodes = (): string[] => {
  return waybillList.map(w => w.waybillCode)
}

const productNames = ['冷鲜猪后腿肉', '进口肥牛卷', '冷鲜鸡胸肉', '冻品虾仁', '冷鲜羊排', '冻品牛肉丸', '冷鲜猪里脊', '进口牛仔骨', '冷鲜鸭胸肉', '冻品鱼丸']
const warehouses = ['上海青浦冷链中心', '广州白云冷链仓', '北京通州冷链基地', '深圳龙岗冷链中心', '杭州余杭冷链仓']
const vehicles = ['沪A·D85263', '粤B·K72891', '京A·M35628', '浙A·L90234', '沪B·F18725']
const statuses: Array<'normal' | 'remark' | 'reject'> = ['normal', 'normal', 'remark', 'normal', 'reject', 'normal', 'normal', 'remark', 'normal', 'normal']
const stores = ['上海五角场店', '上海陆家嘴店', '上海徐家汇店', '上海静安寺店', '上海虹桥店']

const buildDefaultRecords = (): AuditRecord[] => {
  return productNames.map((name, index) => {
    const hasOver = statuses[index] !== 'normal'
    const tempMin = index % 2 === 0 ? 0 : -20
    const tempMax = index % 2 === 0 ? 4 : -15
    const baseTemp = index % 2 === 0 ? 2.5 : -17
    const records = generateTempRecords(baseTemp, tempMin, tempMax, hasOver, hasOver)
    const summary = generateSummary(records)
    const now = new Date()
    const createTime = new Date(now.getTime() - (index + 1) * 3600 * 1000)
    
    const hasSyncFailed = index === 2 || index === 4
    
    return {
      id: `AUD${20240621}${String(index + 1).padStart(4, '0')}`,
      waybillInfo: {
        waybillCode: `YL20240621${String(index + 1).padStart(4, '0')}`,
        productName: name,
        productType: index % 2 === 0 ? '冷鲜肉' : '冻品',
        requiredTempZone: index % 2 === 0 ? '0-4℃冷藏区' : '-18℃冷冻区',
        tempMin,
        tempMax,
        warehouse: warehouses[index % warehouses.length],
        estimatedArrivalTime: new Date(createTime.getTime() - 30 * 60000).toISOString(),
        actualArrivalTime: createTime.toISOString(),
        vehicleNo: vehicles[index % vehicles.length],
        driverName: ['张师傅', '李师傅', '王师傅', '刘师傅', '陈师傅'][index % 5],
        driverPhone: '138****5678'
      },
      tempSummary: summary,
      overTempDetails: generateOverTempDetails(hasOver, tempMax),
      photos: [
        { type: 'doorSeal', url: '', uploadTime: createTime.toISOString() },
        { type: 'outerPackage', url: '', uploadTime: createTime.toISOString() },
        { type: 'tempGun', url: '', uploadTime: createTime.toISOString() }
      ],
      abnormalItems: mockAbnormalItems.map(item => ({
        ...item,
        value: statuses[index] === 'reject' && item.key !== 'normal'
      })),
      signResult: {
        suggestion: statuses[index],
        suggestionLabel: statuses[index] === 'normal' ? '正常签收' : statuses[index] === 'remark' ? '备注签收' : '拒收待复核',
        remark: statuses[index] === 'remark' ? '运输途中短暂超温，货品外观正常' : statuses[index] === 'reject' ? '外箱软化严重，有血水渗出' : '',
        operator: mockUserInfo.name,
        operateTime: createTime.toISOString(),
        syncToLogistics: hasSyncFailed ? 'failed' : 'success',
        syncToQuality: index === 4 ? 'failed' : 'success'
      },
      status: statuses[index],
      createTime: createTime.toISOString(),
      storeName: stores[index % stores.length]
    }
  })
}

let auditRecords: AuditRecord[] = buildDefaultRecords()
let storageInitialized = false
let pendingStorageSave = false

const initFromStorage = async (): Promise<void> => {
  if (storageInitialized) return
  storageInitialized = true
  const stored = await loadRecordsFromStorage()
  if (stored && stored.length > 0) {
    auditRecords = stored
    console.log('[MockData] 使用本地存储记录，共', auditRecords.length, '条')
  } else {
    auditRecords = buildDefaultRecords()
    console.log('[MockData] 使用默认示例记录，共', auditRecords.length, '条')
    scheduleSave()
  }
}

const scheduleSave = (): void => {
  if (pendingStorageSave) return
  pendingStorageSave = true
  Promise.resolve().then(() => {
    pendingStorageSave = false
    saveRecordsToStorage(auditRecords)
  })
}

void initFromStorage()

const ensureSyncFields = (record: AuditRecord): AuditRecord => {
  if (record.signResult.syncToLogistics && record.signResult.syncToQuality) {
    return record
  }
  return {
    ...record,
    signResult: {
      ...record.signResult,
      syncToLogistics: record.signResult.syncToLogistics || 'success',
      syncToQuality: record.signResult.syncToQuality || 'success'
    }
  }
}

export const getAuditRecords = (): AuditRecord[] => {
  return [...auditRecords]
    .map(ensureSyncFields)
    .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
}

const getTimeRangeStart = (timeRange: TimeRange): Date | null => {
  const now = new Date()
  switch (timeRange) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return start
    }
    case 'week': {
      const start = new Date(now.getTime() - 7 * 24 * 3600 * 1000)
      return start
    }
    case 'month': {
      const start = new Date(now.getTime() - 30 * 24 * 3600 * 1000)
      return start
    }
    default:
      return null
  }
}

export const searchAuditRecords = (query: SearchQuery): AuditRecord[] => {
  const { keyword = '', status = 'all', timeRange = 'all', overTempOnly = false } = query
  const kw = keyword.trim().toLowerCase()
  
  let list = getAuditRecords()
  
  if (timeRange !== 'all') {
    const start = getTimeRangeStart(timeRange)
    if (start) {
      list = list.filter(r => new Date(r.createTime).getTime() >= start.getTime())
    }
  }
  
  if (status !== 'all') {
    if (status === 'syncFailed') {
      list = list.filter(r => 
        r.signResult.syncToLogistics === 'failed' || r.signResult.syncToQuality === 'failed'
      )
    } else if (status === 'overTemp') {
      list = list.filter(r => r.tempSummary.hasOverTemp)
    } else {
      list = list.filter(r => r.status === status)
    }
  }
  
  if (overTempOnly) {
    list = list.filter(r => r.tempSummary.hasOverTemp)
  }
  
  if (kw) {
    list = list.filter(r => 
      r.waybillInfo.waybillCode.toLowerCase().includes(kw) ||
      r.waybillInfo.productName.toLowerCase().includes(kw) ||
      r.storeName.toLowerCase().includes(kw)
    )
  }
  
  return list
}

export const getDashboardStats = (timeRange: TimeRange = 'all'): DashboardStats => {
  const records = timeRange === 'all' 
    ? getAuditRecords() 
    : searchAuditRecords({ timeRange })
  
  const totalCount = records.length
  const overTempCount = records.filter(r => r.tempSummary.hasOverTemp).length
  const syncFailedCount = records.filter(r => 
    r.signResult.syncToLogistics === 'failed' || r.signResult.syncToQuality === 'failed'
  ).length
  
  const storeMap = new Map<string, { count: number; overTemp: number; syncFailed: number }>()
  const productMap = new Map<string, { count: number; overTemp: number; syncFailed: number }>()
  const statusMap = new Map<string, { name: string; key: AuditRecord['status']; count: number; overTemp: number; syncFailed: number }>()
  
  for (const r of records) {
    const store = storeMap.get(r.storeName) || { count: 0, overTemp: 0, syncFailed: 0 }
    store.count++
    if (r.tempSummary.hasOverTemp) store.overTemp++
    if (r.signResult.syncToLogistics === 'failed' || r.signResult.syncToQuality === 'failed') store.syncFailed++
    storeMap.set(r.storeName, store)
    
    const product = productMap.get(r.waybillInfo.productName) || { count: 0, overTemp: 0, syncFailed: 0 }
    product.count++
    if (r.tempSummary.hasOverTemp) product.overTemp++
    if (r.signResult.syncToLogistics === 'failed' || r.signResult.syncToQuality === 'failed') product.syncFailed++
    productMap.set(r.waybillInfo.productName, product)
    
    const statusKey = r.status
    const s = statusMap.get(statusKey) || { 
      name: statusKey === 'normal' ? '正常签收' : statusKey === 'remark' ? '备注签收' : '拒收待复核', 
      key: statusKey, 
      count: 0,
      overTemp: 0,
      syncFailed: 0
    }
    s.count++
    if (r.tempSummary.hasOverTemp) s.overTemp++
    if (r.signResult.syncToLogistics === 'failed' || r.signResult.syncToQuality === 'failed') s.syncFailed++
    statusMap.set(statusKey, s)
  }
  
  return {
    totalCount,
    overTempCount,
    syncFailedCount,
    byStore: Array.from(storeMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count),
    byProduct: Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count),
    byStatus: Array.from(statusMap.values())
      .sort((a, b) => b.count - a.count)
  }
}

export const addAuditRecord = (record: AuditRecord): void => {
  auditRecords.unshift(record)
  scheduleSave()
  console.log('[MockData] 新增记录，当前总数：', auditRecords.length)
}

export const getAuditRecordById = (id: string): AuditRecord | undefined => {
  return auditRecords.find(r => r.id === id)
}

export const updateRecordSyncStatus = (
  id: string,
  field: 'syncToLogistics' | 'syncToQuality',
  status: SyncStatus
): AuditRecord | null => {
  const idx = auditRecords.findIndex(r => r.id === id)
  if (idx === -1) return null
  auditRecords[idx] = {
    ...auditRecords[idx],
    signResult: {
      ...auditRecords[idx].signResult,
      [field]: status
    }
  }
  scheduleSave()
  console.log('[MockData] 更新同步状态:', id, field, status)
  return auditRecords[idx]
}

export const submitReview = (
  id: string,
  conclusion: ReviewConclusion,
  reviewer: string,
  comment: string
): AuditRecord | null => {
  const idx = auditRecords.findIndex(r => r.id === id)
  if (idx === -1) return null
  
  const conclusionLabel = conclusion === 'approved' ? '复核通过' 
    : conclusion === 'conditional' ? '有条件通过' 
    : '复核驳回'
  
  const reviewInfo: ReviewInfo = {
    conclusion,
    conclusionLabel,
    reviewer,
    reviewTime: new Date().toISOString(),
    comment
  }
  
  auditRecords[idx] = {
    ...auditRecords[idx],
    signResult: {
      ...auditRecords[idx].signResult,
      reviewInfo
    }
  }
  scheduleSave()
  console.log('[MockData] 提交复核:', id, conclusionLabel)
  return auditRecords[idx]
}

export const submitDisposal = (
  id: string,
  status: DisposalStatus,
  operator: string,
  remark: string
): AuditRecord | null => {
  const idx = auditRecords.findIndex(r => r.id === id)
  if (idx === -1) return null

  const statusLabel = status === 'stored' ? '已入库'
    : status === 'returned' ? '已退回'
    : '待协商'

  const disposalInfo: DisposalInfo = {
    status,
    statusLabel,
    operator,
    operateTime: new Date().toISOString(),
    remark
  }

  auditRecords[idx] = {
    ...auditRecords[idx],
    signResult: {
      ...auditRecords[idx].signResult,
      disposalInfo
    }
  }
  scheduleSave()
  console.log('[MockData] 提交处置:', id, statusLabel)
  return auditRecords[idx]
}

export const buildTimeline = (record: AuditRecord): TimelineItem[] => {
  const timeline: TimelineItem[] = []
  const { waybillInfo, signResult, tempSummary, photos, abnormalItems } = record
  const syncL = signResult.syncToLogistics || 'success'
  const syncQ = signResult.syncToQuality || 'success'

  timeline.push({
    type: 'scan',
    typeLabel: '扫码验车',
    title: '扫描运单，验车完成',
    operator: signResult.operator,
    operateTime: record.createTime,
    description: `${waybillInfo.waybillCode} · ${waybillInfo.productName} · ${record.storeName}`,
    status: tempSummary.hasOverTemp ? 'warning' : 'success',
    detail: tempSummary.hasOverTemp
      ? `超温${tempSummary.overTempCount}次，最高温度${tempSummary.maxTemp}℃`
      : `温度正常，平均温度${tempSummary.avgTemp}℃`
  })

  timeline.push({
    type: 'check',
    typeLabel: '现场核对',
    title: '现场核对完成',
    operator: signResult.operator,
    operateTime: record.createTime,
    description: `${photos.filter(p => p.url).length}张照片 · ${abnormalItems.filter(a => a.value).length}项异常勾选`,
    status: abnormalItems.some(a => a.key !== 'normal' && a.value) ? 'danger' : 'success',
    detail: abnormalItems.filter(a => a.value).map(a => a.label).join('、') || '无异常'
  })

  timeline.push({
    type: 'sign',
    typeLabel: '签收意见',
    title: signResult.suggestionLabel,
    operator: signResult.operator,
    operateTime: signResult.operateTime,
    description: signResult.remark || '无备注',
    status: signResult.suggestion === 'normal' ? 'success'
      : signResult.suggestion === 'remark' ? 'warning'
      : 'danger'
  })

  const syncHasFailed = syncL === 'failed' || syncQ === 'failed'
  const syncHasPending = syncL === 'pending' || syncQ === 'pending'
  timeline.push({
    type: 'sync',
    typeLabel: '通知同步',
    title: syncHasFailed ? '同步存在失败' : syncHasPending ? '同步进行中' : '全部同步完成',
    operator: '系统',
    operateTime: signResult.operateTime,
    description: `物流客服: ${syncL === 'success' ? '✓已同步' : syncL === 'failed' ? '✗失败' : '◌进行中'} · 品控人员: ${syncQ === 'success' ? '✓已同步' : syncQ === 'failed' ? '✗失败' : '◌进行中'}`,
    status: syncHasFailed ? 'danger' : syncHasPending ? 'info' : 'success'
  })

  if (signResult.reviewInfo) {
    const { reviewInfo } = signResult
    timeline.push({
      type: 'review',
      typeLabel: '稽核复核',
      title: reviewInfo.conclusionLabel,
      operator: reviewInfo.reviewer,
      operateTime: reviewInfo.reviewTime,
      description: reviewInfo.comment || '无复核说明',
      status: reviewInfo.conclusion === 'approved' ? 'success'
        : reviewInfo.conclusion === 'conditional' ? 'warning'
        : 'danger'
    })
  }

  if (signResult.disposalInfo) {
    const { disposalInfo } = signResult
    timeline.push({
      type: 'disposal',
      typeLabel: '后续处置',
      title: disposalInfo.statusLabel,
      operator: disposalInfo.operator,
      operateTime: disposalInfo.operateTime,
      description: disposalInfo.remark || '无处置备注',
      status: disposalInfo.status === 'stored' ? 'success'
        : disposalInfo.status === 'returned' ? 'danger'
        : 'info'
    })
  }

  return timeline.sort((a, b) => new Date(a.operateTime).getTime() - new Date(b.operateTime).getTime())
}

export const generateExportReport = (
  records: AuditRecord[],
  filters: SearchQuery
): ExportReport => {
  const overTempCount = records.filter(r => r.tempSummary.hasOverTemp).length
  const syncFailedCount = records.filter(r =>
    r.signResult.syncToLogistics === 'failed' || r.signResult.syncToQuality === 'failed'
  ).length
  const normalCount = records.filter(r => r.status === 'normal').length
  const remarkCount = records.filter(r => r.status === 'remark').length
  const rejectCount = records.filter(r => r.status === 'reject').length

  const timeRangeLabel = filters.timeRange === 'today' ? '今天'
    : filters.timeRange === 'week' ? '近7天'
    : filters.timeRange === 'month' ? '近30天'
    : '全部时间'

  const statusLabel = filters.status === 'syncFailed' ? '同步失败'
    : filters.status === 'overTemp' ? '存在超温'
    : filters.status === 'normal' ? '正常签收'
    : filters.status === 'remark' ? '备注签收'
    : filters.status === 'reject' ? '拒收待复核'
    : '全部状态'

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalCount: records.length,
      overTempCount,
      syncFailedCount,
      normalCount,
      remarkCount,
      rejectCount
    },
    filters: {
      keyword: filters.keyword || '',
      status: statusLabel,
      timeRange: timeRangeLabel,
      overTempOnly: filters.overTempOnly || false
    },
    records: records.map(r => {
      const rL = r.signResult.syncToLogistics || 'success'
      const rQ = r.signResult.syncToQuality || 'success'
      return {
        waybillCode: r.waybillInfo.waybillCode,
        productName: r.waybillInfo.productName,
        storeName: r.storeName,
        operateTime: r.signResult.operateTime,
        suggestionLabel: r.signResult.suggestionLabel,
        hasOverTemp: r.tempSummary.hasOverTemp,
        maxTemp: r.tempSummary.maxTemp,
        syncLogistics: rL === 'success' ? '已同步' : rL === 'failed' ? '失败' : '进行中',
        syncQuality: rQ === 'success' ? '已同步' : rQ === 'failed' ? '失败' : '进行中',
        reviewConclusion: r.signResult.reviewInfo?.conclusionLabel || '',
        disposalStatus: r.signResult.disposalInfo?.statusLabel || '',
        remark: r.signResult.remark || ''
      }
    })
  }
}

export const mockUserInfo = {
  name: '王建国',
  role: '收货主管',
  storeName: '上海五角场店',
  storeType: '收货门店',
  phone: '138****8888',
  employeeId: 'EMP001234'
}
