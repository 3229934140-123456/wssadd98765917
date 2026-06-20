import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import StatusBadge from '@/components/StatusBadge'
import { searchAuditRecords } from '@/data/mockData'
import { formatDateTime } from '@/utils/temperature'
import type { AuditRecord, SignSuggestion, SyncStatus } from '@/types/audit'

interface FilterOption {
  key: SignSuggestion | 'all' | 'syncFailed'
  label: string
  badge?: number
}

const getSyncBadgeClass = (status: SyncStatus | undefined) => {
  if (status === 'success') return styles.badgeSuccess
  if (status === 'failed') return styles.badgeFailed
  return styles.badgePending
}

const getSyncBadgeText = (status: SyncStatus | undefined) => {
  if (status === 'success') return '已同步'
  if (status === 'failed') return '失败'
  return '同步中'
}

const HistoryPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterOption['key']>('all')
  const [keyword, setKeyword] = useState('')
  const [records, setRecords] = useState<AuditRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AuditRecord[]>([])
  const [loading, setLoading] = useState(false)

  const filters: FilterOption[] = useMemo(() => {
    const syncFailedCount = records.filter(r => 
      r.signResult.syncToLogistics === 'failed' || r.signResult.syncToQuality === 'failed'
    ).length
    return [
      { key: 'all', label: '全部' },
      { key: 'normal', label: '正常签收' },
      { key: 'remark', label: '备注签收' },
      { key: 'reject', label: '拒收待复核' },
      { key: 'syncFailed', label: '同步失败', badge: syncFailedCount }
    ]
  }, [records])

  const loadRecords = useCallback(async () => {
    console.log('[History] 加载记录列表')
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      const list = searchAuditRecords({ keyword, status: activeFilter })
      setRecords(prev => {
        const all = searchAuditRecords({ status: 'all' })
        setFilteredRecords(list)
        return all
      })
      console.log('[History] 筛选后记录数量:', list.length)
    } catch (error) {
      console.error('[History] 加载记录失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  }, [keyword, activeFilter])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  useDidShow(() => {
    console.log('[History] 页面显示，刷新记录')
    loadRecords()
  })

  useEffect(() => {
    const list = searchAuditRecords({ keyword, status: activeFilter })
    setFilteredRecords(list)
    const all = searchAuditRecords({ status: 'all' })
    setRecords(all)
  }, [keyword, activeFilter])

  const handlePullDownRefresh = useCallback(() => {
    loadRecords()
  }, [loadRecords])

  Taro.usePullDownRefresh(handlePullDownRefresh)

  const handleFilterChange = useCallback((key: FilterOption['key']) => {
    console.log('[History] 切换筛选:', key)
    setActiveFilter(key)
  }, [])

  const handleRecordClick = useCallback((id: string) => {
    console.log('[History] 点击记录:', id)
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` })
  }, [])

  const handleClearKeyword = useCallback(() => {
    setKeyword('')
  }, [])

  return (
    <View className={styles.page}>
      <View className={styles.searchBar}>
        <View className={styles.searchInputWrap}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder='搜索运单号、肉品、门店'
            placeholderClass={styles.searchPlaceholder}
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
            confirmType='search'
          />
          {keyword && (
            <Text className={styles.searchClear} onClick={handleClearKeyword}>
              ✕
            </Text>
          )}
        </View>
      </View>

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
            <Text>{filter.label}</Text>
            {filter.badge !== undefined && filter.badge > 0 && (
              <Text className={styles.filterBadge}>{filter.badge}</Text>
            )}
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
            {filteredRecords.map(record => {
              const hasSyncIssue = record.signResult.syncToLogistics === 'failed' ||
                record.signResult.syncToQuality === 'failed'
              return (
                <View
                  key={record.id}
                  className={classnames(
                    styles.recordCard,
                    hasSyncIssue && styles.recordCardWarning
                  )}
                  onClick={() => handleRecordClick(record.id)}
                >
                  <View className={styles.recordHeader}>
                    <View className={styles.recordHeaderLeft}>
                      <Text className={styles.recordTitle}>
                        {record.waybillInfo.productName}
                      </Text>
                      <Text className={styles.recordWaybill}>
                        {record.waybillInfo.waybillCode}
                      </Text>
                    </View>
                    <StatusBadge status={record.status} size='sm' />
                  </View>

                  <View className={styles.recordBody}>
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

                    {record.signResult.remark && (
                      <View className={styles.remarkBlock}>
                        <Text className={styles.remarkLabel}>📝 收货备注</Text>
                        <Text className={styles.remarkText}>
                          {record.signResult.remark}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className={styles.syncBar}>
                    <View className={styles.syncItem}>
                      <Text className={classnames(styles.syncDot, getSyncBadgeClass(record.signResult.syncToLogistics))} />
                      <Text className={styles.syncLabel}>物流客服</Text>
                      <Text className={classnames(styles.syncValue, getSyncBadgeClass(record.signResult.syncToLogistics))}>
                        {getSyncBadgeText(record.signResult.syncToLogistics)}
                      </Text>
                    </View>
                    <View className={styles.syncItem}>
                      <Text className={classnames(styles.syncDot, getSyncBadgeClass(record.signResult.syncToQuality))} />
                      <Text className={styles.syncLabel}>品控人员</Text>
                      <Text className={classnames(styles.syncValue, getSyncBadgeClass(record.signResult.syncToQuality))}>
                        {getSyncBadgeText(record.signResult.syncToQuality)}
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
              )
            })}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无相关记录</Text>
            {keyword && (
              <Text className={styles.emptySubText}>试试清除搜索或更换筛选条件</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default HistoryPage
