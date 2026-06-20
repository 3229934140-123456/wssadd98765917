import React, { useState, useCallback, useMemo } from 'react'
import { View, Text, Button, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import StepIndicator from '@/components/StepIndicator'
import { useAudit } from '@/store/AuditContext'
import { calculateSuggestion, getSignStatusLabel } from '@/utils/temperature'
import type { SignSuggestion } from '@/types/audit'

const ResultPage: React.FC = () => {
  const {
    waybillInfo,
    tempSummary,
    abnormalItems,
    submitSignResult,
    setCurrentStep,
    resetAudit
  } = useAudit()

  const [remark, setRemark] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const suggestion = useMemo<SignSuggestion | null>(() => {
    if (!tempSummary) return null
    return calculateSuggestion(tempSummary, abnormalItems)
  }, [tempSummary, abnormalItems])

  const reasons = useMemo(() => {
    const list: Array<{ icon: string; text: string; type: 'success' | 'warning' | 'error' }> = []
    if (!tempSummary) return list

    if (tempSummary.hasOverTemp) {
      list.push({
        icon: '⚠️',
        text: `运输途中存在超温记录（${tempSummary.overTempCount}次），最高温度 ${tempSummary.maxTemp.toFixed(1)}℃`,
        type: 'error'
      })
    } else if (tempSummary.hasWarningTemp) {
      list.push({
        icon: '⚡',
        text: `运输途中存在温度预警（${tempSummary.warningTempCount}次），请关注`,
        type: 'warning'
      })
    } else {
      list.push({
        icon: '✅',
        text: `运输温度全程正常，平均温度 ${tempSummary.avgTemp.toFixed(1)}℃`,
        type: 'success'
      })
    }

    const selectedAbnormal = abnormalItems.filter(item => item.value && item.key !== 'normal')
    if (selectedAbnormal.length > 0) {
      list.push({
        icon: '🔍',
        text: `现场检查发现异常：${selectedAbnormal.map(a => a.label).join('、')}`,
        type: 'error'
      })
    } else if (abnormalItems.some(a => a.key === 'normal' && a.value)) {
      list.push({
        icon: '🔍',
        text: '现场检查未发现异常现象',
        type: 'success'
      })
    }

    return list
  }, [tempSummary, abnormalItems])

  const suggestionIcon = useMemo(() => {
    if (!suggestion) return ''
    const icons = {
      normal: '✅',
      remark: '⚠️',
      reject: '🚫'
    }
    return icons[suggestion]
  }, [suggestion])

  const handleBack = useCallback(() => {
    console.log('[Result] 返回现场核对')
    setCurrentStep('check')
    Taro.navigateBack()
  }, [setCurrentStep])

  const handleSubmit = useCallback(async () => {
    if (!suggestion) return
    console.log('[Result] 提交签收意见:', suggestion)
    setSubmitting(true)
    try {
      const success = await submitSignResult(remark)
      setSubmitting(false)
      if (success) {
        setShowSuccess(true)
      } else {
        Taro.showToast({ title: '提交失败，请重试', icon: 'none' })
      }
    } catch (error) {
      console.error('[Result] 提交失败:', error)
      setSubmitting(false)
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' })
    }
  }, [suggestion, remark, submitSignResult])

  const handleComplete = useCallback(() => {
    console.log('[Result] 完成，返回首页')
    resetAudit()
    Taro.switchTab({ url: '/pages/home/index' })
  }, [resetAudit])

  if (!waybillInfo || !tempSummary || !suggestion) {
    Taro.showToast({ title: '请先完成前两步', icon: 'none' })
    setTimeout(() => Taro.navigateBack(), 1500)
    return null
  }

  const suggestionLabel = getSignStatusLabel(suggestion)

  return (
    <View className={styles.page}>
      <View className={styles.stepContainer}>
        <StepIndicator currentStep='result' />
      </View>

      <View className={styles.content}>
        <View className={classnames(styles.suggestionCard, styles[suggestion])}>
          <View className={styles.suggestionIcon}>{suggestionIcon}</View>
          <Text className={styles.suggestionTitle}>{suggestionLabel}</Text>
          <Text className={styles.suggestionDesc}>
            系统根据温度数据和现场检查结果给出以上建议
          </Text>
        </View>

        <View className={styles.summaryCard}>
          <Text className={styles.sectionTitle}>建议依据</Text>
          <View className={styles.reasonList}>
            {reasons.map((reason, index) => (
              <View key={index} className={styles.reasonItem}>
                <Text className={styles.reasonIcon}>{reason.icon}</Text>
                <Text className={styles.reasonText}>{reason.text}</Text>
              </View>
            ))}
          </View>
          <View className={styles.productInfo}>
            <Text className={styles.productLabel}>肉品名称</Text>
            <Text className={styles.productName}>{waybillInfo.productName}</Text>
          </View>
        </View>

        <View className={styles.remarkCard}>
          <Text className={styles.sectionTitle}>补充备注（可选）</Text>
          <Textarea
            className={styles.remarkInput}
            placeholder='请输入需要补充说明的内容...'
            value={remark}
            onInput={(e) => setRemark(e.detail.value)}
            maxlength={200}
          />
          <Text className={styles.remarkHint}>{remark.length}/200</Text>
        </View>

        <View className={styles.noticeCard}>
          <Text className={styles.noticeTitle}>
            <Text className={styles.noticeIcon}>📢</Text>
            信息同步通知
          </Text>
          <View className={styles.noticeList}>
            <View className={styles.noticeItem}>
              <View className={styles.noticeDot} />
              <Text>物流客服：将收到温度异常和拒收通知</Text>
            </View>
            <View className={styles.noticeItem}>
              <View className={styles.noticeDot} />
              <Text>品控人员：将对拒收货品进行复核确认</Text>
            </View>
            <View className={styles.noticeItem}>
              <View className={styles.noticeDot} />
              <Text>相关记录将永久保存在系统中可追溯</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.footer}>
        <Button className={styles.backBtn} onClick={handleBack}>
          上一步
        </Button>
        <Button
          className={classnames(styles.submitBtn, suggestion === 'reject' && styles.reject)}
          onClick={handleSubmit}
          loading={submitting}
          disabled={submitting}
        >
          {submitting ? '提交中...' : '确认提交'}
        </Button>
      </View>

      {showSuccess && (
        <View className={styles.successMask}>
          <View className={styles.successContent}>
            <View className={styles.successIcon}>✓</View>
            <Text className={styles.successTitle}>提交成功</Text>
            <Text className={styles.successDesc}>
              稽核记录已保存{'\n'}
              相关意见已同步至物流客服和品控人员
            </Text>
            <Button className={styles.successBtn} onClick={handleComplete}>
              返回首页
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}

export default ResultPage
