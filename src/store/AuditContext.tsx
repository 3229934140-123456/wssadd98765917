import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type {
  WaybillInfo,
  TempSummary,
  OverTempDetail,
  CheckPhoto,
  AbnormalItem,
  SignResult,
  AuditStep,
  AuditRecord,
  SyncStatus
} from '@/types/audit'
import {
  getWaybillByCode,
  mockAbnormalItems,
  addAuditRecord,
  mockUserInfo
} from '@/data/mockData'
import { calculateSuggestion, getSignStatusLabel } from '@/utils/temperature'

interface AuditContextType {
  currentStep: AuditStep
  waybillInfo: WaybillInfo | null
  tempSummary: TempSummary | null
  overTempDetails: OverTempDetail[]
  photos: CheckPhoto[]
  abnormalItems: AbnormalItem[]
  signResult: SignResult | null
  scanWaybill: (code: string) => Promise<boolean>
  setCurrentStep: (step: AuditStep) => void
  uploadPhoto: (type: CheckPhoto['type'], url: string) => void
  toggleAbnormalItem: (key: string) => void
  submitSignResult: (remark?: string) => Promise<{
    success: boolean
    syncToLogistics: SyncStatus
    syncToQuality: SyncStatus
  }>
  resetAudit: () => void
}

const AuditContext = createContext<AuditContextType | null>(null)

export const useAudit = () => {
  const context = useContext(AuditContext)
  if (!context) {
    throw new Error('useAudit must be used within AuditProvider')
  }
  return context
}

interface AuditProviderProps {
  children: ReactNode
}

const simulateSync = async (failRate: number = 0.15): Promise<SyncStatus> => {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 800))
  return Math.random() < failRate ? 'failed' : 'success'
}

export const AuditProvider: React.FC<AuditProviderProps> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<AuditStep>('scan')
  const [waybillInfo, setWaybillInfo] = useState<WaybillInfo | null>(null)
  const [tempSummary, setTempSummary] = useState<TempSummary | null>(null)
  const [overTempDetails, setOverTempDetails] = useState<OverTempDetail[]>([])
  const [photos, setPhotos] = useState<CheckPhoto[]>([])
  const [abnormalItems, setAbnormalItems] = useState<AbnormalItem[]>([])
  const [signResult, setSignResult] = useState<SignResult | null>(null)

  const scanWaybill = useCallback(async (code: string): Promise<boolean> => {
    console.log('[Audit] 扫描运单码:', code)
    const trimmed = code.trim()
    if (!trimmed) {
      console.warn('[Audit] 运单码为空')
      return false
    }
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      const data = getWaybillByCode(trimmed)
      if (!data) {
        console.warn('[Audit] 未找到运单信息:', trimmed)
        return false
      }
      
      setWaybillInfo(data.waybillInfo)
      setTempSummary(data.tempSummary)
      setOverTempDetails(data.overTempDetails)
      setAbnormalItems(mockAbnormalItems.map(item => ({ ...item, value: false })))
      setPhotos([])
      setSignResult(null)
      console.log('[Audit] 运单信息获取成功:', data.waybillInfo.productName)
      return true
    } catch (error) {
      console.error('[Audit] 运单信息获取失败:', error)
      return false
    }
  }, [])

  const uploadPhoto = useCallback((type: CheckPhoto['type'], url: string) => {
    console.log('[Audit] 上传照片:', type)
    setPhotos(prev => {
      const existing = prev.find(p => p.type === type)
      if (existing) {
        return prev.map(p =>
          p.type === type
            ? { ...p, url, uploadTime: new Date().toISOString() }
            : p
        )
      }
      return [...prev, { type, url, uploadTime: new Date().toISOString() }]
    })
  }, [])

  const toggleAbnormalItem = useCallback((key: string) => {
    console.log('[Audit] 切换异常项:', key)
    setAbnormalItems(prev => {
      if (key === 'normal') {
        return prev.map(item => ({
          ...item,
          value: item.key === 'normal' ? !item.value : false
        }))
      }
      return prev.map(item => {
        if (item.key === key) {
          const newValue = !item.value
          if (newValue) {
            return { ...item, value: true }
          }
          return { ...item, value: false }
        }
        if (item.key === 'normal') {
          return { ...item, value: false }
        }
        return item
      })
    })
  }, [])

  const submitSignResult = useCallback(async (remark?: string): Promise<{
    success: boolean
    syncToLogistics: SyncStatus
    syncToQuality: SyncStatus
  }> => {
    console.log('[Audit] 提交签收结果')
    const defaultResult = {
      success: false,
      syncToLogistics: 'pending' as SyncStatus,
      syncToQuality: 'pending' as SyncStatus
    }

    try {
      if (!tempSummary || !waybillInfo) {
        console.error('[Audit] 缺少必要数据')
        return defaultResult
      }
      
      const suggestion = calculateSuggestion(tempSummary, abnormalItems)
      const operateTime = new Date().toISOString()
      
      const [syncToLogistics, syncToQuality] = await Promise.all([
        simulateSync(suggestion === 'reject' ? 0.05 : 0.2),
        simulateSync(suggestion === 'reject' ? 0.05 : 0.25)
      ])
      
      const result: SignResult = {
        suggestion,
        suggestionLabel: getSignStatusLabel(suggestion),
        remark: remark || '',
        operator: mockUserInfo.name,
        operateTime,
        syncToLogistics,
        syncToQuality
      }
      
      setSignResult(result)
      
      const record: AuditRecord = {
        id: `AUD${Date.now()}`,
        waybillInfo,
        tempSummary,
        overTempDetails,
        photos: [...photos],
        abnormalItems: [...abnormalItems],
        signResult: result,
        status: suggestion,
        createTime: operateTime,
        storeName: mockUserInfo.storeName
      }
      addAuditRecord(record)
      
      console.log('[Audit] 签收结果已保存:', suggestion, '同步状态-物流:', syncToLogistics, '品控:', syncToQuality)
      
      return {
        success: true,
        syncToLogistics,
        syncToQuality
      }
    } catch (error) {
      console.error('[Audit] 提交失败:', error)
      return defaultResult
    }
  }, [tempSummary, waybillInfo, abnormalItems, overTempDetails, photos])

  const resetAudit = useCallback(() => {
    console.log('[Audit] 重置稽核流程')
    setCurrentStep('scan')
    setWaybillInfo(null)
    setTempSummary(null)
    setOverTempDetails([])
    setPhotos([])
    setAbnormalItems([])
    setSignResult(null)
  }, [])

  const value: AuditContextType = {
    currentStep,
    waybillInfo,
    tempSummary,
    overTempDetails,
    photos,
    abnormalItems,
    signResult,
    scanWaybill,
    setCurrentStep,
    uploadPhoto,
    toggleAbnormalItem,
    submitSignResult,
    resetAudit
  }

  return (
    <AuditContext.Provider value={value}>
      {children}
    </AuditContext.Provider>
  )
}
