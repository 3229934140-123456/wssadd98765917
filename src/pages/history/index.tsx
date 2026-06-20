import React, { useState, useCallback, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import StatusBadge from '@/components/StatusBadge'
import { getAuditRecords } from '@/data/mockData'
import { formatDateTime } from '@/utils/temperature'
import type { AuditRecord, SignSuggestion } from '@/types/audit'

interface FilterOption {
  key: SignSuggestion | 'all'
  label: string
}

const filters: FilterOption[] = [
  { key: 'all', label: '全部' },
  { key: 'normal', label: '正常签收' },
  { key: 'remark', label: '备注签收' },
  { key: 'reject', label: '拒收待复核' }
]

const HistoryPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<SignSuggestion | 'all'>('all')
  const [records, setRecords] = useState<AuditRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AuditRecord[]>([])
  const [loading, setLoading] = useState(false)

  const loadRecords = useCallback(async () => {
    console.log('[History] 加载记录列表')
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      const list = getAuditRecords()
      setRecords(list)
      console.log('[History] 记录数量:', list.length)
    } catch (error) {
      console.error('[History] 加载记录失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  }, [])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  useDidShow(() => {
    console.log('[History] 页面显示，刷新记录')
    loadRecords()
  })

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredRecords(records)
    } else {
      setFilteredRecords(records.filter(r => r.status === activeFilter))
    }
  }, [activeFilter, records])

  const handlePullDownRefresh = useCallback(() => {
    loadRecords()
  }, [loadRecords])

  Taro.usePullDownRefresh(handlePullDownRefresh)

  const handleFilterChange = useCallback((key: SignSuggestion | 'all') => {
    console.log('[History] 切换筛选:', key)
    setActiveFilter(key)
  }, [])

  const handleRecordClick = useCallback((id: string) => {
    console.log('[History] 点击记录:', id)
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` })
  }, [])

  return (
    <View className={styles.page}>
      <ScrollView
        className={styles.filterBar}
        scrollX
        showScrollbar={false}
      >
        {filters.map(filter => (
          <View
            key={filter.key}
            className={classnames(
              styles.filterItem,
              activeFilter === filter.key && styles.active
            )}
            onClick={() => handleFilterChange(filter.key)}
          >
            {filter.label}
          </View>
        ))}
      </ScrollView>

      <ScrollView
        className={styles.listContainer}
        scrollY
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={handlePullDownRefresh}
      >
        {loading ? (
          <Text className={styles.loading}>加载中...</Text>
        ) : filteredRecords.length > 0 ? (
          <View className={styles.recordList}>
            {filteredRecords.map(record => (
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
                <View className={styles.recordBody}>
                  <View className={styles.recordRow}>
                    <Text className={styles.recordLabel}>运单号</Text>
                    <Text className={styles.recordValue}>
                      {record.waybillInfo.waybillCode}
                    </Text>
                  </View>
                  <View className={styles.recordRow}>
                    <Text className={styles.recordLabel}>温区要求</Text>
                    <Text className={styles.recordValue}>
                      {record.waybillInfo.requiredTempZone}
                    </Text>
                  </View>
                  <View className={styles.recordRow}>
                    <Text className={styles.recordLabel}>车牌号</Text>
                    <Text className={styles.recordValue}>
                      {record.waybillInfo.vehicleNo}
                    </Text>
                  </View>
                </View>
                <View className={styles.recordFooter}>
                  <Text className={styles.storeName}>{record.storeName}</Text>
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
            <Text className={styles.emptyText}>暂无相关记录</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default HistoryPage
