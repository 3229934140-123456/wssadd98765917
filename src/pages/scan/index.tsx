import React, { useState, useCallback } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import StepIndicator from '@/components/StepIndicator'
import TemperatureCard from '@/components/TemperatureCard'
import { useAudit } from '@/store/AuditContext'
import { getKnownWaybillCodes } from '@/data/mockData'

const ScanPage: React.FC = () => {
  const {
    waybillInfo,
    tempSummary,
    overTempDetails,
    scanWaybill,
    setCurrentStep
  } = useAudit()

  const [loading, setLoading] = useState(false)

  const handleScan = useCallback(async () => {
    console.log('[Scan] 开始扫码')
    try {
      const res = await Taro.scanCode({
        onlyFromCamera: false,
        scanType: ['qrCode', 'barCode']
      })
      console.log('[Scan] 扫码结果:', res.result)
      setLoading(true)
      const code = res.result?.trim()
      if (!code) {
        setLoading(false)
        Taro.showToast({ title: '扫码内容为空', icon: 'none' })
        return
      }
      const success = await scanWaybill(code)
      setLoading(false)
      if (!success) {
        Taro.showToast({ title: `运单「${code}」未找到`, icon: 'none', duration: 2500 })
      }
    } catch (error) {
      console.error('[Scan] 扫码失败:', error)
      Taro.showToast({ title: '取消扫码', icon: 'none' })
    }
  }, [scanWaybill])

  const handleManualInput = useCallback(async () => {
    console.log('[Scan] 手动输入运单')
    const knownCodes = getKnownWaybillCodes()
    const hintText = `可测试运单：\n${knownCodes.join('\n')}`
    
    const res = await Taro.showModal({
      title: '手动输入运单码',
      content: hintText,
      editable: true,
      placeholderText: '请输入运单编号',
      confirmText: '查询',
      cancelText: '取消'
    })
    
    if (!res.confirm) return
    
    const code = (res.content || '').trim()
    if (!code) {
      Taro.showToast({ title: '运单码不能为空', icon: 'none' })
      return
    }
    
    setLoading(true)
    const success = await scanWaybill(code)
    setLoading(false)
    if (!success) {
      Taro.showToast({ title: `运单「${code}」未找到`, icon: 'none', duration: 2500 })
    }
  }, [scanWaybill])

  const handleNext = useCallback(() => {
    console.log('[Scan] 进入现场核对')
    setCurrentStep('check')
    Taro.navigateTo({ url: '/pages/check/index' })
  }, [setCurrentStep])

  const handleBack = useCallback(() => {
    console.log('[Scan] 返回首页')
    Taro.navigateBack()
  }, [])

  return (
    <View className={styles.page}>
      <View className={styles.stepContainer}>
        <StepIndicator currentStep='scan' />
      </View>

      <View className={styles.content}>
        {!waybillInfo ? (
          <View className={styles.scanPrompt}>
            <Text className={styles.scanIcon}>📷</Text>
            <Text className={styles.scanTitle}>扫描运单码</Text>
            <Text className={styles.scanDesc}>
              扫描运单上的二维码或条形码，{'\n'}
              快速获取肉品信息和温度记录
            </Text>
            <Button
              className={styles.scanBtn}
              onClick={handleScan}
            >
              <Text className={styles.scanBtnIcon}>📷</Text>
              <Text>点击扫码</Text>
            </Button>
            <View className={styles.manualInput}>
              <Text className={styles.manualText}>无法扫码？</Text>
              <Text className={styles.manualLink} onClick={handleManualInput}>
                手动输入
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View className={styles.waybillCard}>
              <View className={styles.cardHeader}>
                <Text className={styles.cardTitle}>运单信息</Text>
                <Text className={styles.waybillCode}>
                  {waybillInfo.waybillCode}
                </Text>
              </View>
              <View className={styles.infoGrid}>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>肉品名称</Text>
                  <View className={styles.infoValue}>
                    <Text className={styles.productName}>
                      {waybillInfo.productName}
                    </Text>
                    <Text className={styles.productType}>
                      {waybillInfo.productType}
                    </Text>
                  </View>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>应走温区</Text>
                  <Text className={classnames(styles.infoValue, styles.tempZoneValue)}>
                    {waybillInfo.requiredTempZone}
                  </Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>发货仓</Text>
                  <Text className={styles.infoValue}>
                    {waybillInfo.warehouse}
                  </Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>预计到达</Text>
                  <Text className={styles.infoValue}>
                    {waybillInfo.estimatedArrivalTime}
                  </Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>实际到达</Text>
                  <Text className={styles.infoValue}>
                    {waybillInfo.actualArrivalTime}
                  </Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>运输车辆</Text>
                  <Text className={styles.infoValue}>
                    {waybillInfo.vehicleNo} · {waybillInfo.driverName}
                  </Text>
                </View>
              </View>
            </View>

            {tempSummary && (
              <TemperatureCard
                summary={tempSummary}
                overTempDetails={overTempDetails}
                tempMin={waybillInfo.tempMin}
                tempMax={waybillInfo.tempMax}
              />
            )}
          </>
        )}
      </View>

      {waybillInfo && (
        <View className={styles.footer}>
          <Button className={styles.backBtn} onClick={handleBack}>
            返回
          </Button>
          <Button
            className={classnames(styles.nextBtn)}
            onClick={handleNext}
          >
            下一步：现场核对
          </Button>
        </View>
      )}

      {loading && (
        <View className={styles.loadingMask}>
          <View className={styles.loadingContent}>
            <View className={styles.loadingSpinner} />
            <Text className={styles.loadingText}>正在获取运单信息...</Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default ScanPage
