import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, Image, Button, Textarea, Input, ScrollView } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import StatusBadge from '@/components/StatusBadge'
import { getAuditRecordById, updateRecordSyncStatus, submitReview, submitDisposal, buildTimeline } from '@/data/mockData'
import { formatTime, formatFullDateTime, getSignStatusLabel } from '@/utils/temperature'
import type { AuditRecord, SyncStatus, ReviewConclusion, DisposalStatus, TimelineItem } from '@/types/audit'

const simulateRetrySync = async (failRate: number = 0.1): Promise<SyncStatus> => {
  await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 800))
  return Math.random() < failRate ? 'failed' : 'success'
}

const reviewOptions: Array<{ value: ReviewConclusion; label: string; desc: string }> = [
  { value: 'approved', label: '复核通过', desc: '货品状态可接受，允许入库' },
  { value: 'conditional', label: '有条件通过', desc: '需限期处理，限定条件下入库' },
  { value: 'rejected', label: '复核驳回', desc: '货品不可接收，退回处理' }
]

const disposalOptions: Array<{ value: DisposalStatus; label: string; desc: string }> = [
  { value: 'stored', label: '已入库', desc: '货品已正常入库' },
  { value: 'returned', label: '已退回', desc: '货品已退回供应商/物流' },
  { value: 'negotiating', label: '待协商', desc: '与物流/供应商协商中' }
]

const DetailPage: React.FC = () => {
  const [record, setRecord] = useState<AuditRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState<'logistics' | 'quality' | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewConclusion, setReviewConclusion] = useState<ReviewConclusion>('approved')
  const [reviewer, setReviewer] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [showDisposalModal, setShowDisposalModal] = useState(false)
  const [disposalStatus, setDisposalStatus] = useState<DisposalStatus>('stored')
  const [disposalOperator, setDisposalOperator] = useState('')
  const [disposalRemark, setDisposalRemark] = useState('')
  const [submittingDisposal, setSubmittingDisposal] = useState(false)
  const [showTimeline, setShowTimeline] = useState(true)
  const router = useRouter()

  const loadRecord = useCallback(async () => {
    const id = router.params.id || ''
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      const found = getAuditRecordById(id)
      if (found) {
        setRecord(found)
      }
    } catch (error) {
      console.error('[Detail] 加载记录失败:', error)
    } finally {
      setLoading(false)
    }
  }, [router.params.id])

  useEffect(() => {
    loadRecord()
  }, [loadRecord])

  useDidShow(() => {
    loadRecord()
  })

  const handleRetrySync = useCallback(async (field: 'syncToLogistics' | 'syncToQuality') => {
    if (!record || retrying) return
    const fieldLabel = field === 'syncToLogistics' ? '物流客服' : '品控人员'
    const retryingKey = field === 'syncToLogistics' ? 'logistics' : 'quality'
    setRetrying(retryingKey)
    updateRecordSyncStatus(record.id, field, 'pending')
    setRecord(prev => prev ? {
      ...prev,
      signResult: { ...prev.signResult, [field]: 'pending' as SyncStatus }
    } : prev)
    try {
      const result = await simulateRetrySync(0.08)
      const updated = updateRecordSyncStatus(record.id, field, result)
      if (updated) {
        setRecord(updated)
        Taro.showToast({
          title: result === 'success' ? `${fieldLabel}同步成功` : `${fieldLabel}同步失败，请稍后再试`,
          icon: result === 'success' ? 'success' : 'none',
          duration: 2000
        })
      }
    } catch (err) {
      const failed = updateRecordSyncStatus(record.id, field, 'failed')
      if (failed) setRecord(failed)
      Taro.showToast({ title: `${fieldLabel}同步失败`, icon: 'none' })
    } finally {
      setRetrying(null)
    }
  }, [record, retrying])

  const handleOpenReview = useCallback(() => {
    if (!record) return
    setReviewConclusion('approved')
    setReviewer('')
    setReviewComment('')
    setShowReviewModal(true)
  }, [record])

  const handleSubmitReview = useCallback(async () => {
    if (!record || submittingReview) return
    if (!reviewer.trim()) {
      Taro.showToast({ title: '请输入复核人', icon: 'none' })
      return
    }
    setSubmittingReview(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      const updated = submitReview(record.id, reviewConclusion, reviewer.trim(), reviewComment.trim())
      if (updated) {
        setRecord(updated)
        setShowReviewModal(false)
        Taro.showToast({ title: '复核提交成功', icon: 'success' })
      }
    } catch (err) {
      Taro.showToast({ title: '复核提交失败', icon: 'none' })
    } finally {
      setSubmittingReview(false)
    }
  }, [record, reviewConclusion, reviewer, reviewComment, submittingReview])

  const handleImagePreview = useCallback((url: string) => {
    if (url) {
      Taro.previewImage({ urls: [url], current: url })
    }
  }, [])

  const handleOpenDisposal = useCallback(() => {
    if (!record) return
    setDisposalStatus('stored')
    setDisposalOperator('')
    setDisposalRemark('')
    setShowDisposalModal(true)
  }, [record])

  const handleSubmitDisposal = useCallback(async () => {
    if (!record || submittingDisposal) return
    if (!disposalOperator.trim()) {
      Taro.showToast({ title: '请输入处置人', icon: 'none' })
      return
    }
    setSubmittingDisposal(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      const updated = submitDisposal(record.id, disposalStatus, disposalOperator.trim(), disposalRemark.trim())
      if (updated) {
        setRecord(updated)
        setShowDisposalModal(false)
        Taro.showToast({ title: '处置状态更新成功', icon: 'success' })
      }
    } catch (err) {
      Taro.showToast({ title: '处置状态更新失败', icon: 'none' })
    } finally {
      setSubmittingDisposal(false)
    }
  }, [record, disposalStatus, disposalOperator, disposalRemark, submittingDisposal])

  const timeline: TimelineItem[] = useMemo(() => {
    if (!record) return []
    return buildTimeline(record)
  }, [record])

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

  const statusIcon = { normal: '✅', remark: '⚠️', reject: '🚫' }[record.status]
  const canReview = record.status === 'reject' || record.status === 'remark'
  const hasReview = !!record.signResult.reviewInfo
  const canDisposal = hasReview
  const hasDisposal = !!record.signResult.disposalInfo
  const syncL = record.signResult.syncToLogistics || 'success'
  const syncQ = record.signResult.syncToQuality || 'success'

  const renderSyncRow = (
    label: string,
    status: SyncStatus,
    retryKey: 'syncToLogistics' | 'syncToQuality',
    retryingKey: 'logistics' | 'quality'
  ) => {
    const statusText = status === 'success' ? '✓ 已同步' :
      status === 'failed' ? '✗ 同步失败' : '同步中'
    return (
      <View className={styles.resultRow}>
        <Text className={styles.resultLabel}>{label}</Text>
        <View className={styles.resultValueRow}>
          <Text className={classnames(
            styles.resultValue,
            status === 'success' && styles.syncSuccessText,
            status === 'failed' && styles.syncFailedText
          )}>
            {statusText}
          </Text>
          {(status === 'failed' || status === 'pending') && (
            <Button
              className={styles.retryBtn}
              size='mini'
              loading={retrying === retryingKey}
              disabled={retrying === retryingKey}
              onClick={() => handleRetrySync(retryKey)}
            >
              {retrying === retryingKey ? '' : '重试'}
            </Button>
          )}
        </View>
      </View>
    )
  }

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
                <Text className={styles.productName}>{record.waybillInfo.productName}</Text>
                <Text className={styles.productType}>{record.waybillInfo.productType}</Text>
              </View>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>运单号</Text>
              <Text className={styles.infoValue}>{record.waybillInfo.waybillCode}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>应走温区</Text>
              <Text className={classnames(styles.infoValue, styles.tempZoneValue)}>
                {record.waybillInfo.requiredTempZone}
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>发货仓</Text>
              <Text className={styles.infoValue}>{record.waybillInfo.warehouse}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>运输车辆</Text>
              <Text className={styles.infoValue}>
                {record.waybillInfo.vehicleNo} · {record.waybillInfo.driverName}
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>到达时间</Text>
              <Text className={styles.infoValue}>{record.waybillInfo.actualArrivalTime}</Text>
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
              <Text className={styles.tempStatValue}>{record.tempSummary.avgTemp.toFixed(1)}℃</Text>
            </View>
            <View className={styles.tempStat}>
              <Text className={styles.tempStatLabel}>最高温度</Text>
              <Text className={classnames(styles.tempStatValue, record.tempSummary.hasOverTemp && styles.over)}>
                {record.tempSummary.maxTemp.toFixed(1)}℃
              </Text>
            </View>
            <View className={styles.tempStat}>
              <Text className={styles.tempStatLabel}>最低温度</Text>
              <Text className={styles.tempStatValue}>{record.tempSummary.minTemp.toFixed(1)}℃</Text>
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
                  <Text className={styles.overTempDuration}>持续 {detail.durationMinutes} 分钟</Text>
                  <View className={styles.overTempStats}>
                    <View className={styles.overTempStat}>
                      <Text className={styles.overTempStatLabel}>最高温度</Text>
                      <Text className={styles.overTempStatValue}>{detail.maxTemperature.toFixed(1)}℃</Text>
                    </View>
                    <View className={styles.overTempStat}>
                      <Text className={styles.overTempStatLabel}>平均温度</Text>
                      <Text className={styles.overTempStatValue}>{detail.avgTemperature.toFixed(1)}℃</Text>
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
                doorSeal: '车厢门封', outerPackage: '货品外包装', tempGun: '手持测温枪读数'
              }
              return (
                <View key={index} className={styles.photoItem}>
                  <Text className={styles.photoLabel}>{labels[photo.type]}</Text>
                  <View className={styles.photoImage}>
                    {photo.url ? (
                      <Image className={styles.photoUploaded} src={photo.url} mode='aspectFill' onClick={() => handleImagePreview(photo.url)} />
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
                <View key={item.key} className={classnames(styles.abnormalItem, item.value && (isNormal ? styles.selectedNormal : styles.selected))}>
                  <View className={classnames(styles.checkbox, item.value && (isNormal ? styles.selectedNormal : styles.selected))}>
                    {item.value && <Text className={styles.checkmark}>✓</Text>}
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
            <Text className={styles.resultValue}>{record.signResult.suggestionLabel}</Text>
          </View>
          {record.signResult.remark && (
            <View className={styles.resultRow}>
              <Text className={styles.resultLabel}>备注说明</Text>
              <Text className={classnames(styles.resultValue, styles.remarkValue)}>{record.signResult.remark}</Text>
            </View>
          )}
          <View className={styles.resultRow}>
            <Text className={styles.resultLabel}>操作人员</Text>
            <Text className={styles.resultValue}>{record.signResult.operator}</Text>
          </View>
          <View className={styles.resultRow}>
            <Text className={styles.resultLabel}>操作时间</Text>
            <Text className={styles.resultValue}>{formatFullDateTime(record.signResult.operateTime)}</Text>
          </View>

          <View className={styles.syncDivider} />
          <View className={styles.syncSectionRow}>
            <Text className={styles.syncSectionTitle}>信息同步状态</Text>
            {(syncL === 'failed' || syncQ === 'failed') && (
              <View className={styles.syncTip}>
                <Text className={styles.syncTipIcon}>💡</Text>
                <Text className={styles.syncTipText}>失败可点击重试</Text>
              </View>
            )}
          </View>
          {renderSyncRow('物流客服', syncL, 'syncToLogistics', 'logistics')}
          {renderSyncRow('品控人员', syncQ, 'syncToQuality', 'quality')}
        </View>

        {hasReview && (
          <View className={styles.reviewSection}>
            <Text className={styles.sectionTitle}>复核结果</Text>
            <View className={styles.resultRow}>
              <Text className={styles.resultLabel}>复核结论</Text>
              <Text className={classnames(
                styles.resultValue,
                record.signResult.reviewInfo!.conclusion === 'approved' && styles.syncSuccessText,
                record.signResult.reviewInfo!.conclusion === 'rejected' && styles.syncFailedText,
                record.signResult.reviewInfo!.conclusion === 'conditional' && styles.reviewConditionalText
              )}>
                {record.signResult.reviewInfo!.conclusionLabel}
              </Text>
            </View>
            <View className={styles.resultRow}>
              <Text className={styles.resultLabel}>复核人</Text>
              <Text className={styles.resultValue}>{record.signResult.reviewInfo!.reviewer}</Text>
            </View>
            <View className={styles.resultRow}>
              <Text className={styles.resultLabel}>复核时间</Text>
              <Text className={styles.resultValue}>{formatFullDateTime(record.signResult.reviewInfo!.reviewTime)}</Text>
            </View>
            {record.signResult.reviewInfo!.comment && (
              <View className={styles.resultRow}>
                <Text className={styles.resultLabel}>复核说明</Text>
                <Text className={classnames(styles.resultValue, styles.remarkValue)}>
                  {record.signResult.reviewInfo!.comment}
                </Text>
              </View>
            )}
          </View>
        )}

        {hasDisposal && (
          <View className={styles.disposalSection}>
            <Text className={styles.sectionTitle}>后续处置</Text>
            <View className={styles.resultRow}>
              <Text className={styles.resultLabel}>处置状态</Text>
              <Text className={classnames(
                styles.resultValue,
                record.signResult.disposalInfo!.status === 'stored' && styles.syncSuccessText,
                record.signResult.disposalInfo!.status === 'returned' && styles.syncFailedText,
                record.signResult.disposalInfo!.status === 'negotiating' && styles.reviewConditionalText
              )}>
                {record.signResult.disposalInfo!.statusLabel}
              </Text>
            </View>
            <View className={styles.resultRow}>
              <Text className={styles.resultLabel}>处置人</Text>
              <Text className={styles.resultValue}>{record.signResult.disposalInfo!.operator}</Text>
            </View>
            <View className={styles.resultRow}>
              <Text className={styles.resultLabel}>处置时间</Text>
              <Text className={styles.resultValue}>{formatFullDateTime(record.signResult.disposalInfo!.operateTime)}</Text>
            </View>
            {record.signResult.disposalInfo!.remark && (
              <View className={styles.resultRow}>
                <Text className={styles.resultLabel}>处置备注</Text>
                <Text className={classnames(styles.resultValue, styles.remarkValue)}>
                  {record.signResult.disposalInfo!.remark}
                </Text>
              </View>
            )}
          </View>
        )}

        <View className={styles.timelineSection}>
          <View className={styles.timelineHeader} onClick={() => setShowTimeline(!showTimeline)}>
            <Text className={styles.sectionTitle}>🕒 完整追溯时间线</Text>
            <Text className={styles.timelineToggle}>{showTimeline ? '收起' : '展开'}</Text>
          </View>
          {showTimeline && timeline.length > 0 && (
            <View className={styles.timelineList}>
              {timeline.map((item, index) => (
                <View key={index} className={styles.timelineItem}>
                  <View className={styles.timelineLeft}>
                    <View className={classnames(
                      styles.timelineDot,
                      item.status === 'success' && styles.timelineDotSuccess,
                      item.status === 'warning' && styles.timelineDotWarning,
                      item.status === 'danger' && styles.timelineDotDanger,
                      item.status === 'info' && styles.timelineDotInfo,
                      !item.status && styles.timelineDotDefault
                    )}>
                      <Text className={styles.timelineDotText}>
                        {item.type === 'scan' ? '📱' :
                         item.type === 'check' ? '📷' :
                         item.type === 'sign' ? '✅' :
                         item.type === 'sync' ? '📡' :
                         item.type === 'review' ? '📋' : '📦'}
                      </Text>
                    </View>
                    {index < timeline.length - 1 && <View className={styles.timelineLine} />}
                  </View>
                  <View className={styles.timelineContent}>
                    <View className={styles.timelineTitleRow}>
                      <Text className={styles.timelineType}>{item.typeLabel}</Text>
                      <Text className={classnames(
                        styles.timelineTitle,
                        item.status === 'success' && styles.timelineTitleSuccess,
                        item.status === 'warning' && styles.timelineTitleWarning,
                        item.status === 'danger' && styles.timelineTitleDanger
                      )}>{item.title}</Text>
                    </View>
                    <Text className={styles.timelineDesc}>{item.description}</Text>
                    {item.detail && <Text className={styles.timelineDetail}>{item.detail}</Text>}
                    <View className={styles.timelineMeta}>
                      <Text className={styles.timelineOperator}>{item.operator}</Text>
                      <Text className={styles.timelineTime}>{formatFullDateTime(item.operateTime)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {canReview && !hasReview && (
          <View className={styles.reviewAction}>
            <Button className={styles.reviewBtn} onClick={handleOpenReview}>
              📋 填写复核结论
            </Button>
          </View>
        )}

        {canDisposal && !hasDisposal && (
          <View className={styles.reviewAction}>
            <Button className={styles.disposalBtn} onClick={handleOpenDisposal}>
              📦 标记处置状态
            </Button>
          </View>
        )}

        {canReview && hasReview && (
          <View className={styles.reviewAction}>
            {hasDisposal ? (
              <Text className={styles.reviewDone}>复核与处置均已完成</Text>
            ) : (
              <Button className={styles.disposalBtnSmall} onClick={handleOpenDisposal}>
                📦 补记后续处置
              </Button>
            )}
          </View>
        )}
      </View>

      {showReviewModal && (
        <View className={styles.modalMask} onClick={() => setShowReviewModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>填写复核结论</Text>
            <Text className={styles.modalSubtitle}>
              {record.waybillInfo.productName} · {record.signResult.suggestionLabel}
            </Text>

            <View className={styles.reviewOptionList}>
              {reviewOptions.map(opt => (
                <View
                  key={opt.value}
                  className={classnames(
                    styles.reviewOption,
                    reviewConclusion === opt.value && styles.reviewOptionActive,
                    opt.value === 'approved' && reviewConclusion === opt.value && styles.reviewOptionApproved,
                    opt.value === 'conditional' && reviewConclusion === opt.value && styles.reviewOptionConditional,
                    opt.value === 'rejected' && reviewConclusion === opt.value && styles.reviewOptionRejected
                  )}
                  onClick={() => setReviewConclusion(opt.value)}
                >
                  <Text className={styles.reviewOptionLabel}>{opt.label}</Text>
                  <Text className={styles.reviewOptionDesc}>{opt.desc}</Text>
                </View>
              ))}
            </View>

            <View className={styles.modalField}>
              <Text className={styles.modalFieldLabel}>复核人 *</Text>
              <Input
                className={styles.modalInput}
                placeholder='请输入复核人姓名'
                value={reviewer}
                onInput={(e) => setReviewer(e.detail.value)}
              />
            </View>

            <View className={styles.modalField}>
              <Text className={styles.modalFieldLabel}>复核说明</Text>
              <Textarea
                className={styles.modalTextarea}
                placeholder='请输入复核说明（可选）'
                value={reviewComment}
                onInput={(e) => setReviewComment(e.detail.value)}
                maxlength={200}
              />
            </View>

            <View className={styles.modalActions}>
              <Button className={styles.modalCancel} onClick={() => setShowReviewModal(false)}>
                取消
              </Button>
              <Button
                className={classnames(styles.modalConfirm, submittingReview && styles.modalConfirmDisabled)}
                onClick={handleSubmitReview}
                loading={submittingReview}
                disabled={submittingReview || !reviewer.trim()}
              >
                {submittingReview ? '提交中' : '提交复核'}
              </Button>
            </View>
          </View>
        </View>
      )}

      {showDisposalModal && (
        <View className={styles.modalMask} onClick={() => setShowDisposalModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>后续处置</Text>
            <Text className={styles.modalSubtitle}>
              {record.waybillInfo.productName} · {record.signResult.reviewInfo?.conclusionLabel || record.signResult.suggestionLabel}
            </Text>

            <View className={styles.reviewOptionList}>
              {disposalOptions.map(opt => (
                <View
                  key={opt.value}
                  className={classnames(
                    styles.reviewOption,
                    disposalStatus === opt.value && styles.reviewOptionActive,
                    opt.value === 'stored' && disposalStatus === opt.value && styles.reviewOptionApproved,
                    opt.value === 'returned' && disposalStatus === opt.value && styles.reviewOptionRejected,
                    opt.value === 'negotiating' && disposalStatus === opt.value && styles.reviewOptionConditional
                  )}
                  onClick={() => setDisposalStatus(opt.value)}
                >
                  <Text className={styles.reviewOptionLabel}>{opt.label}</Text>
                  <Text className={styles.reviewOptionDesc}>{opt.desc}</Text>
                </View>
              ))}
            </View>

            <View className={styles.modalField}>
              <Text className={styles.modalFieldLabel}>处置人 *</Text>
              <Input
                className={styles.modalInput}
                placeholder='请输入处置人姓名'
                value={disposalOperator}
                onInput={(e) => setDisposalOperator(e.detail.value)}
              />
            </View>

            <View className={styles.modalField}>
              <Text className={styles.modalFieldLabel}>处置备注</Text>
              <Textarea
                className={styles.modalTextarea}
                placeholder='请输入处置备注（可选）'
                value={disposalRemark}
                onInput={(e) => setDisposalRemark(e.detail.value)}
                maxlength={200}
              />
            </View>

            <View className={styles.modalActions}>
              <Button className={styles.modalCancel} onClick={() => setShowDisposalModal(false)}>
                取消
              </Button>
              <Button
                className={classnames(styles.modalConfirm, submittingDisposal && styles.modalConfirmDisabled)}
                onClick={handleSubmitDisposal}
                loading={submittingDisposal}
                disabled={submittingDisposal || !disposalOperator.trim()}
              >
                {submittingDisposal ? '提交中' : '确认处置'}
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default DetailPage
