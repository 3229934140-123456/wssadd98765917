import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import StatusBadge from '@/components/StatusBadge'
import { getAuditRecords } from '@/data/mockData'
import { formatTime, formatFullDateTime, getSignStatusLabel } from '@/utils/temperature'
import type { AuditRecord } from '@/types/audit'

const DetailPage: React.FC = () => {
  const [record, setRecord] = useState<AuditRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const id = router.params.id || ''
    
    console.log('[Detail] 查看记录:', id)
    
    const loadRecord = async () => {
      setLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 300))
        const allRecords = getAuditRecords()
        const found = allRecords.find(r => r.id === id)
        if (found) {
          setRecord(found)
        }
      } catch (error) {
        console.error('[Detail] 加载记录失败:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadRecord()
  }, [router.params.id])

  const handleImagePreview = useCallback((url: string) => {
    if (url) {
      Taro.previewImage({
        urls: [url],
        current: url
      })
    }
  }, [])

  if (loading) {
    return (
      <View className={styles.page}>
        <Text className={styles.loading}>加载中...</Text>
      </View>
    )
  }

  if (!record) {
    return (
      <View className={styles.page}>
        <Text className={styles.empty}>未找到记录</Text>
      </View>
    )
  }

  const statusIcon = {
    normal: '✅',
    remark: '⚠️',
    reject: '🚫'
  }[record.status]

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        <View className={classnames(styles.statusCard, styles[record.status])}>
          <View className={styles.statusIcon}>{statusIcon}</View>
          <Text className={styles.statusTitle}>
            {getSignStatusLabel(record.status)}
          </Text>
          <Text className={styles.statusTime}>
            {formatFullDateTime(record.createTime)}
          </Text>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>运单信息</Text>
            <Text className={styles.auditId}>{record.id}</Text>
          </View>
          <View className={styles.infoGrid}>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>肉品名称</Text>
              <View className={styles.infoValue}>
                <Text className={styles.productName}>
                  {record.waybillInfo.productName}
                </Text>
                <Text className={styles.productType}>
                  {record.waybillInfo.productType}
                </Text>
              </View>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>运单号</Text>
              <Text className={styles.infoValue}>
                {record.waybillInfo.waybillCode}
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>应走温区</Text>
              <Text className={classnames(styles.infoValue, styles.tempZoneValue)}>
                {record.waybillInfo.requiredTempZone}
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>发货仓</Text>
              <Text className={styles.infoValue}>
                {record.waybillInfo.warehouse}
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>运输车辆</Text>
              <Text className={styles.infoValue}>
                {record.waybillInfo.vehicleNo} · {record.waybillInfo.driverName}
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>到达时间</Text>
              <Text className={styles.infoValue}>
                {record.waybillInfo.actualArrivalTime}
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>收货门店</Text>
              <Text className={styles.infoValue}>{record.storeName}</Text>
            </View>
          </View>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>温度记录</Text>
            <StatusBadge status={record.status} size='sm' />
          </View>
          <View className={styles.tempStats}>
            <View className={styles.tempStat}>
              <Text className={styles.tempStatLabel}>平均温度</Text>
              <Text className={styles.tempStatValue}>
                {record.tempSummary.avgTemp.toFixed(1)}℃
              </Text>
            </View>
            <View className={styles.tempStat}>
              <Text className={styles.tempStatLabel}>最高温度</Text>
              <Text
                className={classnames(
                  styles.tempStatValue,
                  record.tempSummary.hasOverTemp && styles.over
                )}
              >
                {record.tempSummary.maxTemp.toFixed(1)}℃
              </Text>
            </View>
            <View className={styles.tempStat}>
              <Text className={styles.tempStatLabel}>最低温度</Text>
              <Text className={styles.tempStatValue}>
                {record.tempSummary.minTemp.toFixed(1)}℃
              </Text>
            </View>
          </View>
          {record.overTempDetails.length > 0 && (
            <View className={styles.overTempList}>
              <Text className={styles.overTempTitle}>超温详情</Text>
              {record.overTempDetails.map((detail, index) => (
                <View key={index} className={styles.overTempItem}>
                  <Text className={styles.overTempTime}>
                    {formatTime(detail.startTime)} - {formatTime(detail.endTime)}
                  </Text>
                  <Text className={styles.overTempDuration}>
                    持续 {detail.durationMinutes} 分钟
                  </Text>
                  <View className={styles.overTempStats}>
                    <View className={styles.overTempStat}>
                      <Text className={styles.overTempStatLabel}>最高温度</Text>
                      <Text className={styles.overTempStatValue}>
                        {detail.maxTemperature.toFixed(1)}℃
                      </Text>
                    </View>
                    <View className={styles.overTempStat}>
                      <Text className={styles.overTempStatLabel}>平均温度</Text>
                      <Text className={styles.overTempStatValue}>
                        {detail.avgTemperature.toFixed(1)}℃
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>现场照片</Text>
          <View className={styles.photoSection}>
            {record.photos.map((photo, index) => {
              const labels: Record<string, string> = {
                doorSeal: '车厢门封',
                outerPackage: '货品外包装',
                tempGun: '手持测温枪读数'
              }
              return (
                <View key={index} className={styles.photoItem}>
                  <Text className={styles.photoLabel}>{labels[photo.type]}</Text>
                  <View className={styles.photoImage}>
                    {photo.url ? (
                      <Image
                        className={styles.photoUploaded}
                        src={photo.url}
                        mode='aspectFill'
                        onClick={() => handleImagePreview(photo.url)}
                      />
                    ) : (
                      <Text className={styles.photoPlaceholder}>暂无照片</Text>
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        </View>

        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>异常现象</Text>
          <View className={styles.abnormalList}>
            {record.abnormalItems.map(item => {
              const isNormal = item.key === 'normal'
              return (
                <View
                  key={item.key}
                  className={classnames(
                    styles.abnormalItem,
                    item.value && (isNormal ? styles.selectedNormal : styles.selected)
                  )}
                >
                  <View
                    className={classnames(
                      styles.checkbox,
                      item.value && (isNormal ? styles.selectedNormal : styles.selected)
                    )}
                  >
                    {item.value && (
                      <Text className={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text className={styles.abnormalLabel}>{item.label}</Text>
                </View>
              )
            })}
          </View>
        </View>

        <View className={styles.resultSection}>
          <Text className={styles.sectionTitle}>签收结果</Text>
          <View className={styles.resultRow}>
            <Text className={styles.resultLabel}>签收意见</Text>
            <Text className={styles.resultValue}>
              {record.signResult.suggestionLabel}
            </Text>
          </View>
          {record.signResult.remark && (
            <View className={styles.resultRow}>
              <Text className={styles.resultLabel}>备注说明</Text>
              <Text className={classnames(styles.resultValue, styles.remarkValue)}>
                {record.signResult.remark}
              </Text>
            </View>
          )}
          <View className={styles.resultRow}>
            <Text className={styles.resultLabel}>操作人员</Text>
            <Text className={styles.resultValue}>
              {record.signResult.operator}
            </Text>
          </View>
          <View className={styles.resultRow}>
            <Text className={styles.resultLabel}>操作时间</Text>
            <Text className={styles.resultValue}>
              {formatFullDateTime(record.signResult.operateTime)}
            </Text>
          </View>
          {(record.signResult.syncToLogistics || record.signResult.syncToQuality) && (
            <>
              <View className={styles.syncDivider} />
              <Text className={styles.syncSectionTitle}>信息同步状态</Text>
              <View className={styles.resultRow}>
                <Text className={styles.resultLabel}>物流客服</Text>
                <Text className={classnames(
                  styles.resultValue,
                  record.signResult.syncToLogistics === 'success' && styles.syncSuccessText,
                  record.signResult.syncToLogistics === 'failed' && styles.syncFailedText
                )}>
                  {record.signResult.syncToLogistics === 'success' ? '✓ 已同步' :
                   record.signResult.syncToLogistics === 'failed' ? '✗ 同步失败' : '同步中'}
                </Text>
              </View>
              <View className={styles.resultRow}>
                <Text className={styles.resultLabel}>品控人员</Text>
                <Text className={classnames(
                  styles.resultValue,
                  record.signResult.syncToQuality === 'success' && styles.syncSuccessText,
                  record.signResult.syncToQuality === 'failed' && styles.syncFailedText
                )}>
                  {record.signResult.syncToQuality === 'success' ? '✓ 已同步' :
                   record.signResult.syncToQuality === 'failed' ? '✗ 同步失败' : '同步中'}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  )
}

export default DetailPage
