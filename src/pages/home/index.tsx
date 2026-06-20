import React, { useState, useCallback, useEffect } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import StatusBadge from '@/components/StatusBadge'
import { getAuditRecords, mockUserInfo } from '@/data/mockData'
import { formatDateTime } from '@/utils/temperature'
import type { AuditRecord } from '@/types/audit'

const HomePage: React.FC = () => {
  const [records, setRecords] = useState<AuditRecord[]>([])
  const [loading, setLoading] = useState(false)

  const loadRecentRecords = useCallback(async () => {
    console.log('[Home] 加载最近记录')
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      const all = getAuditRecords()
      setRecords(all.slice(0, 5))
      console.log('[Home] 最近记录数量:', all.length)
    } catch (error) {
      console.error('[Home] 加载记录失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  }, [])

  useEffect(() => {
    loadRecentRecords()
  }, [loadRecentRecords])

  useDidShow(() => {
    console.log('[Home] 页面显示，刷新记录')
    loadRecentRecords()
  })

  const handlePullDownRefresh = useCallback(() => {
    loadRecentRecords()
  }, [loadRecentRecords])

  Taro.usePullDownRefresh(handlePullDownRefresh)

  const handleScan = useCallback(async () => {
    console.log('[Home] 点击扫码验车')
    Taro.navigateTo({ url: '/pages/scan/index' })
  }, [])

  const handleViewAll = useCallback(() => {
    console.log('[Home] 查看全部记录')
    Taro.switchTab({ url: '/pages/history/index' })
  }, [])

  const handleRecordClick = useCallback((id: string) => {
    console.log('[Home] 点击记录:', id)
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` })
  }, [])

  return (
    <ScrollView
      className={styles.page}
      scrollY
      refresherEnabled
      refresherTriggered={loading}
      onRefresherRefresh={handlePullDownRefresh}
    >
      <View className={styles.header}>
        <Text className={styles.storeName}>{mockUserInfo.storeName}</Text>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            {mockUserInfo.name.charAt(0)}
          </View>
          <View className={styles.userDetails}>
            <Text className={styles.userName}>{mockUserInfo.name}</Text>
            <Text className={styles.userRole}>{mockUserInfo.role}</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.scanSection}>
          <Button
            className={classnames(styles.scanBtn)}
            onClick={handleScan}
          >
            <Text className={styles.scanIcon}>📷</Text>
            <Text className={styles.scanBtnText}>扫码验车</Text>
          </Button>

          <View className={styles.stepsGuide}>
            <View className={styles.stepItem}>
              <View className={styles.stepCircle}>1</View>
              <Text className={styles.stepLabel}>扫码验车</Text>
            </View>
            <View className={styles.stepItem}>
              <View className={styles.stepCircle}>2</View>
              <Text className={styles.stepLabel}>现场核对</Text>
            </View>
            <View className={styles.stepItem}>
              <View className={styles.stepCircle}>3</View>
              <Text className={styles.stepLabel}>签收意见</Text>
            </View>
          </View>
        </View>

        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>最近稽核</Text>
          <Text className={styles.viewAll} onClick={handleViewAll}>
            查看全部
          </Text>
        </View>

        {loading ? (
          <Text className={styles.loading}>加载中...</Text>
        ) : records.length > 0 ? (
          <View className={styles.recordList}>
            {records.map(record => (
              <View
                key={record.id}
                className={styles.recordCard}
                onClick={() => handleRecordClick(record.id)}
              >
                <View className={styles.recordHeader}>
                  <Text className={styles.recordTitle}>
                    {record.waybillInfo.productName}
                  </Text>
                  <StatusBadge status={record.status} size='sm' />
                </View>
                <View className={styles.recordMeta}>
                  <Text className={styles.waybillCode}>
                    运单：{record.waybillInfo.waybillCode}
                  </Text>
                  <Text className={styles.recordTime}>
                    {formatDateTime(record.createTime)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无稽核记录</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

export default HomePage
