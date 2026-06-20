import type { WaybillInfo, TempSummary, OverTempDetail, AuditRecord, AbnormalItem } from '@/types/audit'

const generateTempRecords = (baseTemp: number, hasOver: boolean, hasWarning: boolean) => {
  const records = []
  const now = new Date()
  for (let i = 119; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 1000)
    let temp = baseTemp + (Math.random() - 0.5) * 2
    let status: 'normal' | 'warning' | 'over' = 'normal'
    
    if (hasOver && i >= 40 && i <= 55) {
      temp = 8 + Math.random() * 3
      status = 'over'
    } else if (hasWarning && i >= 80 && i <= 90) {
      temp = 5 + Math.random() * 1.5
      status = 'warning'
    } else if (temp > 6) {
      status = 'warning'
    } else if (temp > 4) {
      status = 'normal'
    }
    
    records.push({
      timestamp: time.toISOString(),
      temperature: Math.round(temp * 10) / 10,
      status
    })
  }
  return records
}

const generateSummary = (records: ReturnType<typeof generateTempRecords>) => {
  const temps = records.map(r => r.temperature)
  const overRecords = records.filter(r => r.status === 'over')
  const warningRecords = records.filter(r => r.status === 'warning')
  
  return {
    hasOverTemp: overRecords.length > 0,
    hasWarningTemp: warningRecords.length > 0,
    avgTemp: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length * 10) / 10,
    maxTemp: Math.max(...temps),
    minTemp: Math.min(...temps),
    latestTemp: temps[temps.length - 1],
    overTempCount: overRecords.length,
    warningTempCount: warningRecords.length,
    records
  }
}

const generateOverTempDetails = (hasOver: boolean): OverTempDetail[] => {
  if (!hasOver) return []
  const now = new Date()
  const startTime = new Date(now.getTime() - 80 * 60 * 1000)
  const endTime = new Date(now.getTime() - 65 * 60 * 1000)
  return [{
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    durationMinutes: 15,
    maxTemperature: 10.2,
    avgTemperature: 8.8
  }]
}

export const mockWaybillInfo: WaybillInfo = {
  waybillCode: 'YL202406210001',
  productName: '冷鲜猪后腿肉',
  productType: '冷鲜肉',
  requiredTempZone: '0-4℃冷藏区',
  tempMin: 0,
  tempMax: 4,
  warehouse: '上海青浦冷链中心',
  estimatedArrivalTime: '2024-06-21 09:30:00',
  actualArrivalTime: '2024-06-21 09:25:00',
  vehicleNo: '沪A·D85263',
  driverName: '张师傅',
  driverPhone: '138****5678'
}

export const mockTempSummary: TempSummary = generateSummary(
  generateTempRecords(2.5, true, true)
)

export const mockOverTempDetails: OverTempDetail[] = generateOverTempDetails(true)

export const mockAbnormalItems: AbnormalItem[] = [
  { key: 'soft', label: '外箱软化', value: false },
  { key: 'blood', label: '血水渗出', value: false },
  { key: 'smell', label: '异味', value: false },
  { key: 'normal', label: '无异常', value: false }
]

const productNames = ['冷鲜猪后腿肉', '进口肥牛卷', '冷鲜鸡胸肉', '冻品虾仁', '冷鲜羊排', '冻品牛肉丸', '冷鲜猪里脊', '进口牛仔骨', '冷鲜鸭胸肉', '冻品鱼丸']
const warehouses = ['上海青浦冷链中心', '广州白云冷链仓', '北京通州冷链基地', '深圳龙岗冷链中心', '杭州余杭冷链仓']
const vehicles = ['沪A·D85263', '粤B·K72891', '京A·M35628', '浙A·L90234', '沪B·F18725']
const statuses: Array<'normal' | 'remark' | 'reject'> = ['normal', 'normal', 'remark', 'normal', 'reject', 'normal', 'normal', 'remark', 'normal', 'normal']
const stores = ['上海五角场店', '上海陆家嘴店', '上海徐家汇店', '上海静安寺店', '上海虹桥店']

export const mockAuditRecords: AuditRecord[] = productNames.map((name, index) => {
  const hasOver = statuses[index] !== 'normal'
  const records = generateTempRecords(2.5, hasOver, hasOver)
  const summary = generateSummary(records)
  const now = new Date()
  const createTime = new Date(now.getTime() - index * 3600 * 1000)
  
  return {
    id: `AUD${20240621}${String(index + 1).padStart(4, '0')}`,
    waybillInfo: {
      waybillCode: `YL20240621${String(index + 1).padStart(4, '0')}`,
      productName: name,
      productType: index % 2 === 0 ? '冷鲜肉' : '冻品',
      requiredTempZone: index % 2 === 0 ? '0-4℃冷藏区' : '-18℃冷冻区',
      tempMin: index % 2 === 0 ? 0 : -20,
      tempMax: index % 2 === 0 ? 4 : -15,
      warehouse: warehouses[index % warehouses.length],
      estimatedArrivalTime: new Date(createTime.getTime() - 30 * 60000).toISOString(),
      actualArrivalTime: createTime.toISOString(),
      vehicleNo: vehicles[index % vehicles.length],
      driverName: ['张师傅', '李师傅', '王师傅', '刘师傅', '陈师傅'][index % 5],
      driverPhone: '138****5678'
    },
    tempSummary: summary,
    overTempDetails: generateOverTempDetails(hasOver),
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
      operator: '收货员小王',
      operateTime: createTime.toISOString()
    },
    status: statuses[index],
    createTime: createTime.toISOString(),
    storeName: stores[index % stores.length]
  }
})

export const mockUserInfo = {
  name: '王建国',
  role: '收货主管',
  storeName: '上海五角场店',
  storeType: '收货门店',
  phone: '138****8888',
  employeeId: 'EMP001234'
}
