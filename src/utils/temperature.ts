import type { TempSummary, SignSuggestion, TempRecord } from '@/types/audit'

export const formatTime = (isoString: string): string => {
  const date = new Date(isoString)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

export const formatFullDateTime = (isoString: string): string => {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export const getTempStatusColor = (status: 'normal' | 'warning' | 'over'): string => {
  const colors = {
    normal: '#00B42A',
    warning: '#FF7D00',
    over: '#F53F3F'
  }
  return colors[status]
}

export const getTempStatusBg = (status: 'normal' | 'warning' | 'over'): string => {
  const colors = {
    normal: 'rgba(0, 180, 42, 0.1)',
    warning: 'rgba(255, 125, 0, 0.1)',
    over: 'rgba(245, 63, 63, 0.1)'
  }
  return colors[status]
}

export const getTempStatusLabel = (status: 'normal' | 'warning' | 'over'): string => {
  const labels = {
    normal: '正常',
    warning: '预警',
    over: '超温'
  }
  return labels[status]
}

export const getSignStatusColor = (status: SignSuggestion): string => {
  const colors = {
    normal: '#00B42A',
    remark: '#FF7D00',
    reject: '#F53F3F'
  }
  return colors[status]
}

export const getSignStatusBg = (status: SignSuggestion): string => {
  const colors = {
    normal: 'rgba(0, 180, 42, 0.1)',
    remark: 'rgba(255, 125, 0, 0.1)',
    reject: 'rgba(245, 63, 63, 0.1)'
  }
  return colors[status]
}

export const getSignStatusLabel = (status: SignSuggestion): string => {
  const labels = {
    normal: '正常签收',
    remark: '备注签收',
    reject: '拒收待复核'
  }
  return labels[status]
}

export const calculateSuggestion = (
  tempSummary: TempSummary,
  abnormalItems: { key: string; value: boolean }[]
): SignSuggestion => {
  const hasSeriousAbnormal = abnormalItems.some(
    item => item.key !== 'normal' && item.value
  )
  
  if (hasSeriousAbnormal || tempSummary.hasOverTemp) {
    return 'reject'
  }
  
  if (tempSummary.hasWarningTemp) {
    return 'remark'
  }
  
  return 'normal'
}

export const getTempBarWidth = (temp: number, min: number, max: number): number => {
  const range = max - min + 10
  const position = ((temp - min + 5) / range) * 100
  return Math.max(0, Math.min(100, position))
}

export const groupTempByStatus = (records: TempRecord[]) => {
  const groups: Array<{
    status: 'normal' | 'warning' | 'over'
    count: number
    startTime: string
    endTime: string
    maxTemp: number
  }> = []
  
  let currentGroup: typeof groups[0] | null = null
  
  records.forEach((record) => {
    if (!currentGroup || currentGroup.status !== record.status) {
      if (currentGroup) {
        groups.push(currentGroup)
      }
      currentGroup = {
        status: record.status,
        count: 1,
        startTime: record.timestamp,
        endTime: record.timestamp,
        maxTemp: record.temperature
      }
    } else {
      currentGroup.count++
      currentGroup.endTime = record.timestamp
      currentGroup.maxTemp = Math.max(currentGroup.maxTemp, record.temperature)
    }
  })
  
  if (currentGroup) {
    groups.push(currentGroup)
  }
  
  return groups.filter(g => g.status !== 'normal')
}
