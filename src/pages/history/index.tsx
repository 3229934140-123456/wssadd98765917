import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { View, Text, ScrollView, Input, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import StatusBadge from '@/components/StatusBadge'
import { searchAuditRecords, getDashboardStats, generateExportReport } from '@/data/mockData'
import { formatDateTime } from '@/utils/temperature'
import type { AuditRecord, SignSuggestion, SyncStatus, TimeRange, DashboardStats, ExportReport, SearchQuery } from '@/types/audit'

interface FilterOption {
  key: SignSuggestion | 'all' | 'syncFailed' | 'overTemp'
  label: string
  badge?: number
}

interface TimeRangeOption {
  key: TimeRange
  label: string
}

const timeRangeOptions: TimeRangeOption[] = [
  { key: 'all', label: '全部' },
  { key: 'today', label: '今天' },
  { key: 'week', label: '近7天' },
  { key: 'month', label: '近30天' }
]

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
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [records, setRecords] = useState<AuditRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AuditRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null)
  const [showDashboard, setShowDashboard] = useState(true)
  const [showExport, setShowExport] = useState(false)
  const [exportReport, setExportReport] = useState<ExportReport | null>(null)

  const filters: FilterOption[] = useMemo(() => {
    const syncFailedCount = records.filter(r => 
      r.signResult.syncToLogistics === 'failed' || r.signResult.syncToQuality === 'failed'
    ).length
    const overTempCount = records.filter(r => r.tempSummary.hasOverTemp).length
    return [
      { key: 'all', label: '全部' },
      { key: 'normal', label: '正常签收' },
      { key: 'remark', label: '备注签收' },
      { key: 'reject', label: '拒收待复核' },
      { key: 'overTemp', label: '存在超温', badge: overTempCount },
      { key: 'syncFailed', label: '同步失败', badge: syncFailedCount }
    ]
  }, [records])

  const applyFilter = useCallback(() => {
    const list = searchAuditRecords({ keyword, status: activeFilter, timeRange })
    setFilteredRecords(list)
    const all = searchAuditRecords({ status: 'all', timeRange })
    setRecords(all)
    const stats = getDashboardStats(timeRange)
    setDashboard(stats)
  }, [keyword, activeFilter, timeRange])

  const loadRecords = useCallback(async () => {
    console.log('[History] 加载记录列表')
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      applyFilter()
    } catch (error) {
      console.error('[History] 加载记录失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  }, [applyFilter])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  useDidShow(() => {
    console.log('[History] 页面显示，刷新记录')
    applyFilter()
  })

  useEffect(() => {
    applyFilter()
  }, [keyword, activeFilter, timeRange, applyFilter])

  const handlePullDownRefresh = useCallback(() => {
    loadRecords()
  }, [loadRecords])

  Taro.usePullDownRefresh(handlePullDownRefresh)

  const handleFilterChange = useCallback((key: FilterOption['key']) => {
    setActiveFilter(key)
  }, [])

  const handleRecordClick = useCallback((id: string) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` })
  }, [])

  const handleClearKeyword = useCallback(() => {
    setKeyword('')
  }, [])

  const handleDashboardItemClick = useCallback((type: 'store' | 'product' | 'status', name: string, key?: string) => {
    if (type === 'status' && key) {
      setActiveFilter(key as FilterOption['key'])
    } else {
      setKeyword(name)
    }
    setShowDashboard(false)
  }, [])

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range)
  }, [])

  const handleExportClick = useCallback(() => {
    const searchQuery: SearchQuery = { keyword, status: activeFilter, timeRange }
    const report = generateExportReport(filteredRecords, searchQuery)
    setExportReport(report)
    setShowExport(true)
  }, [keyword, activeFilter, timeRange, filteredRecords])

  const handleExportCopy = useCallback(() => {
    if (!exportReport) return
    const lines: string[] = []
    lines.push('=== 肉类冷链温区稽核报表 ===')
    lines.push(`生成时间: ${formatDateTime(exportReport.generatedAt)}`)
    lines.push(`筛选条件: 时间【${exportReport.filters.timeRange}】 状态【${exportReport.filters.status}】${exportReport.filters.keyword ? ` 关键字【${exportReport.filters.keyword}】` : ''}`)
    lines.push('')
    lines.push('--- 汇总数字 ---')
    lines.push(`稽核总数: ${exportReport.summary.totalCount}`)
    lines.push(`超温数量: ${exportReport.summary.overTempCount}`)
    lines.push(`同步失败: ${exportReport.summary.syncFailedCount}`)
    lines.push(`正常签收: ${exportReport.summary.normalCount}  备注签收: ${exportReport.summary.remarkCount}  拒收待复核: ${exportReport.summary.rejectCount}`)
    lines.push('')
    lines.push('--- 每票单详情 ---')
    lines.push('运单号 | 肉品 | 门店 | 时间 | 签收结果 | 超温 | 最高温 | 物流客服 | 品控人员 | 复核 | 处置 | 备注')
    lines.push('-'.repeat(80))
    exportReport.records.forEach(r => {
      lines.push([
        r.waybillCode,
        r.productName,
        r.storeName,
        formatDateTime(r.operateTime),
        r.suggestionLabel,
        r.hasOverTemp ? '是' : '否',
        `${r.maxTemp}℃`,
        r.syncLogistics,
        r.syncQuality,
        r.reviewConclusion || '-',
        r.disposalStatus || '-',
        r.remark || '-'
      ].join(' | '))
    })
    const text = lines.join('\n')
    try {
      Taro.setClipboardData({
        data: text,
        success: () => {
          Taro.showToast({ title: '报表已复制到剪贴板', icon: 'success' })
        }
      })
    } catch (e) {
      Taro.showToast({ title: '复制失败', icon: 'none' })
    }
  }, [exportReport])

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
        <View className={styles.exportBtn} onClick={handleExportClick}>
          <Text>📤 导出</Text>
        </View>
      </View>

      <View className={styles.timeRangeBar}>
        {timeRangeOptions.map(opt => (
          <View
            key={opt.key}
            className={classnames(
              styles.timeRangeItem,
              timeRange === opt.key && styles.timeRangeActive
            )}
            onClick={() => handleTimeRangeChange(opt.key)}
          >
            {opt.label}
          </View>
        ))}
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
        {dashboard && showDashboard && (
          <View className={styles.dashboard}>
            <View className={styles.dashboardHeader}>
              <Text className={styles.dashboardTitle}>📊 汇总看板</Text>
              <Text className={styles.dashboardToggle} onClick={() => setShowDashboard(false)}>
                收起
              </Text>
            </View>

            <View className={styles.dashboardSummary}>
              <View className={styles.summaryItem} onClick={() => handleDashboardItemClick('status', '全部', 'all')}>
                <Text className={styles.summaryValue}>{dashboard.totalCount}</Text>
                <Text className={styles.summaryLabel}>稽核总数</Text>
              </View>
              <View className={classnames(styles.summaryItem, styles.summaryWarning)} onClick={() => { setActiveFilter('overTemp'); setShowDashboard(false) }}>
                <Text className={styles.summaryValue}>{dashboard.overTempCount}</Text>
                <Text className={styles.summaryLabel}>超温数量</Text>
              </View>
              <View className={classnames(styles.summaryItem, styles.summaryError)} onClick={() => { setActiveFilter('syncFailed'); setShowDashboard(false) }}>
                <Text className={styles.summaryValue}>{dashboard.syncFailedCount}</Text>
                <Text className={styles.summaryLabel}>同步失败</Text>
              </View>
            </View>

            {dashboard.byStatus.length > 0 && (
              <View className={styles.dashboardSection}>
                <Text className={styles.dashboardSectionTitle}>签收结果分布</Text>
                <View className={styles.dashboardGrid}>
                  {dashboard.byStatus.map(item => (
                    <View
                      key={item.key}
                      className={styles.dashboardGridItem}
                      onClick={() => handleDashboardItemClick('status', item.name, item.key)}
                    >
                      <Text className={styles.gridItemCount}>{item.count}</Text>
                      <Text className={styles.gridItemLabel}>{item.name}</Text>
                      <View className={styles.gridItemStats}>
                        {item.overTemp > 0 && <Text className={styles.gridItemStatOver}>超{item.overTemp}</Text>}
                        {item.syncFailed > 0 && <Text className={styles.gridItemStatFail}>败{item.syncFailed}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {dashboard.byStore.length > 0 && (
              <View className={styles.dashboardSection}>
                <Text className={styles.dashboardSectionTitle}>门店分布</Text>
                <View className={styles.dashboardGrid}>
                  {dashboard.byStore.slice(0, 5).map(item => (
                    <View
                      key={item.name}
                      className={styles.dashboardGridItem}
                      onClick={() => handleDashboardItemClick('store', item.name)}
                    >
                      <Text className={styles.gridItemCount}>{item.count}</Text>
                      <Text className={styles.gridItemLabel}>{item.name}</Text>
                      {(item.overTemp > 0 || item.syncFailed > 0) && (
                        <Text className={styles.gridItemWarn}>
                          {item.overTemp > 0 && `超${item.overTemp}`}
                          {item.overTemp > 0 && item.syncFailed > 0 && ' '}
                          {item.syncFailed > 0 && `败${item.syncFailed}`}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {dashboard.byProduct.length > 0 && (
              <View className={styles.dashboardSection}>
                <Text className={styles.dashboardSectionTitle}>肉品分布</Text>
                <View className={styles.dashboardGrid}>
                  {dashboard.byProduct.slice(0, 5).map(item => (
                    <View
                      key={item.name}
                      className={styles.dashboardGridItem}
                      onClick={() => handleDashboardItemClick('product', item.name)}
                    >
                      <Text className={styles.gridItemCount}>{item.count}</Text>
                      <Text className={styles.gridItemLabel}>{item.name}</Text>
                      {(item.overTemp > 0 || item.syncFailed > 0) && (
                        <Text className={styles.gridItemWarn}>
                          {item.overTemp > 0 && `超${item.overTemp}`}
                          {item.overTemp > 0 && item.syncFailed > 0 && ' '}
                          {item.syncFailed > 0 && `败${item.syncFailed}`}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {!showDashboard && (
          <View className={styles.dashboardShowBar} onClick={() => setShowDashboard(true)}>
            <Text className={styles.dashboardShowText}>📊 展开汇总看板</Text>
          </View>
        )}

        {loading ? (
          <Text className={styles.loading}>加载中...</Text>
        ) : filteredRecords.length > 0 ? (
          <>
            <View className={styles.resultCount}>
              <Text>共 {filteredRecords.length} 条记录</Text>
            </View>
            <View className={styles.recordList}>
              {filteredRecords.map(record => {
                const hasSyncIssue = record.signResult.syncToLogistics === 'failed' ||
                  record.signResult.syncToQuality === 'failed'
                const hasReview = !!record.signResult.reviewInfo
                const hasDisposal = !!record.signResult.disposalInfo
                return (
                  <View
                    key={record.id}
                    className={classnames(
                      styles.recordCard,
                      hasSyncIssue && styles.recordCardWarning,
                      hasReview && styles.recordCardReviewed
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
                      <View className={styles.recordHeaderRight}>
                        <StatusBadge status={record.status} size='sm' />
                        {hasReview && (
                          <Text className={styles.reviewedTag}>
                            {record.signResult.reviewInfo!.conclusionLabel}
                          </Text>
                        )}
                        {hasDisposal && (
                          <Text className={classnames(styles.disposalTag,
                            record.signResult.disposalInfo!.status === 'stored' && styles.disposalTagStored,
                            record.signResult.disposalInfo!.status === 'returned' && styles.disposalTagReturned,
                            record.signResult.disposalInfo!.status === 'negotiating' && styles.disposalTagNegotiating
                          )}>
                            {record.signResult.disposalInfo!.statusLabel}
                          </Text>
                        )}
                      </View>
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
          </>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无相关记录</Text>
            {(keyword || timeRange !== 'all') && (
              <Text className={styles.emptySubText}>试试清除搜索或更换筛选条件</Text>
            )}
          </View>
        )}
      </ScrollView>

      {showExport && exportReport && (
        <View className={styles.modalMask} onClick={() => setShowExport(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>📊 稽核报表导出</Text>
              <Text className={styles.modalClose} onClick={() => setShowExport(false)}>✕</Text>
            </View>

            <ScrollView className={styles.exportScroll} scrollY>
              <View className={styles.exportSection}>
                <Text className={styles.exportSectionTitle}>筛选条件</Text>
                <View className={styles.exportRow}>
                  <Text className={styles.exportKey}>时间范围</Text>
                  <Text className={styles.exportValue}>{exportReport.filters.timeRange}</Text>
                </View>
                <View className={styles.exportRow}>
                  <Text className={styles.exportKey}>签收状态</Text>
                  <Text className={styles.exportValue}>{exportReport.filters.status}</Text>
                </View>
                {exportReport.filters.keyword && (
                  <View className={styles.exportRow}>
                    <Text className={styles.exportKey}>关键字</Text>
                    <Text className={styles.exportValue}>{exportReport.filters.keyword}</Text>
                  </View>
                )}
              </View>

              <View className={styles.exportSection}>
                <Text className={styles.exportSectionTitle}>汇总数字</Text>
                <View className={styles.exportGrid}>
                  <View className={styles.exportGridItem}>
                    <Text className={styles.exportGridValue}>{exportReport.summary.totalCount}</Text>
                    <Text className={styles.exportGridLabel}>稽核总数</Text>
                  </View>
                  <View className={styles.exportGridItem}>
                    <Text className={styles.exportGridValue}>{exportReport.summary.overTempCount}</Text>
                    <Text className={styles.exportGridLabel}>超温数量</Text>
                  </View>
                  <View className={styles.exportGridItem}>
                    <Text className={styles.exportGridValue}>{exportReport.summary.syncFailedCount}</Text>
                    <Text className={styles.exportGridLabel}>同步失败</Text>
                  </View>
                </View>
                <View className={styles.exportSummarySub}>
                  <Text>正常签收 {exportReport.summary.normalCount}</Text>
                  <Text>备注签收 {exportReport.summary.remarkCount}</Text>
                  <Text>拒收待复核 {exportReport.summary.rejectCount}</Text>
                </View>
              </View>

              <View className={styles.exportSection}>
                <Text className={styles.exportSectionTitle}>记录清单（共{exportReport.records.length}条）</Text>
                {exportReport.records.map((r, idx) => (
                  <View className={styles.exportRecordCard} key={idx}>
                    <View className={styles.exportRecordHeader}>
                      <Text className={styles.exportWaybill}>{r.waybillCode}</Text>
                      <Text className={styles.exportSuggestion}>{r.suggestionLabel}</Text>
                    </View>
                    <Text className={styles.exportMeta}>{r.productName} · {r.storeName} · {formatDateTime(r.operateTime)}</Text>
                    <View className={styles.exportMetaRow}>
                      <Text>最高温 {r.maxTemp}℃ {r.hasOverTemp ? '⚠超温' : '✓正常'}</Text>
                      <Text>物流{r.syncLogistics} · 品控{r.syncQuality}</Text>
                    </View>
                    {(r.reviewConclusion || r.disposalStatus) && (
                      <View className={styles.exportMetaRow}>
                        {r.reviewConclusion && <Text>复核：{r.reviewConclusion}</Text>}
                        {r.disposalStatus && <Text>处置：{r.disposalStatus}</Text>}
                      </View>
                    )}
                    {r.remark && <Text className={styles.exportRemark}>备注：{r.remark}</Text>}
                  </View>
                ))}
              </View>
            </ScrollView>

            <View className={styles.modalActions}>
              <Button className={styles.modalBtnCancel} onClick={() => setShowExport(false)}>关闭</Button>
              <Button className={styles.modalBtnPrimary} onClick={handleExportCopy}>📋 复制报表文本</Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default HistoryPage
