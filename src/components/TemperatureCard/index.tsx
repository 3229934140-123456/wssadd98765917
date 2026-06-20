import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { TempSummary, OverTempDetail } from '@/types/audit'
import {
  formatTime,
  getTempStatusColor,
  getTempStatusLabel,
  getTempBarWidth
} from '@/utils/temperature'

interface TemperatureCardProps {
  summary: TempSummary
  overTempDetails: OverTempDetail[]
  tempMin: number
  tempMax: number
}

const TemperatureCard: React.FC<TemperatureCardProps> = ({
  summary,
  overTempDetails,
  tempMin,
  tempMax
}) => {
  const [showDetails, setShowDetails] = useState(false)
  const overallStatus = summary.hasOverTemp ? 'over' : summary.hasWarningTemp ? 'warning' : 'normal'
  const statusColor = getTempStatusColor(overallStatus)
  const statusLabel = getTempStatusLabel(overallStatus)

  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>最近两小时温度摘要</Text>
          <View
            className={classnames(styles.statusTag, styles[`status-${overallStatus}`])}
            style={{ background: `${statusColor}15`, color: statusColor }}
          >
            {statusLabel}
          </View>
        </View>
        <View className={styles.latestTempRow}>
          <Text className={styles.latestTempLabel}>当前温度</Text>
          <Text className={styles.latestTempValue} style={{ color: statusColor }}>
            {summary.latestTemp.toFixed(1)}
            <Text className={styles.tempUnit}>℃</Text>
          </Text>
        </View>
      </View>

      <View className={styles.tempBarContainer}>
        <View className={styles.tempBar}>
          <View
            className={classnames(styles.tempBarNormal, styles.tempBarSegment)}
            style={{ width: `${((tempMax - tempMin) / (tempMax - tempMin + 10)) * 100}%` }}
          />
          <View
            className={classnames(styles.tempBarWarning, styles.tempBarSegment)}
            style={{ width: `${(3 / (tempMax - tempMin + 10)) * 100}%` }}
          />
          <View
            className={classnames(styles.tempBarOver, styles.tempBarSegment)}
            style={{ width: `${(7 / (tempMax - tempMin + 10)) * 100}%` }}
          />
          <View
            className={styles.tempIndicator}
            style={{
              left: `${getTempBarWidth(summary.latestTemp, tempMin, tempMax)}%`,
              background: statusColor
            }}
          />
        </View>
        <View className={styles.tempLabels}>
          <Text className={styles.tempLabel}>{tempMin}℃</Text>
          <Text className={styles.tempLabel}>{tempMax}℃</Text>
          <Text className={styles.tempLabel}>{tempMax + 3}℃</Text>
          <Text className={styles.tempLabel}>{tempMax + 10}℃</Text>
        </View>
      </View>

      <View className={styles.statsGrid}>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>平均温度</Text>
          <Text className={styles.statValue}>{summary.avgTemp.toFixed(1)}℃</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>最高温度</Text>
          <Text className={styles.statValue} style={{ color: getTempStatusColor('over') }}>
            {summary.maxTemp.toFixed(1)}℃
          </Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>最低温度</Text>
          <Text className={styles.statValue}>{summary.minTemp.toFixed(1)}℃</Text>
        </View>
      </View>

      {summary.hasOverTemp && (
        <View className={styles.warningSection}>
          <View
            className={styles.warningHeader}
            onClick={() => setShowDetails(!showDetails)}
          >
            <View className={styles.warningIcon}>!</View>
            <Text className={styles.warningTitle}>
              存在超温记录（{summary.overTempCount}次）
            </Text>
            <Text className={styles.expandIcon}>{showDetails ? '▲' : '▼'}</Text>
          </View>
          {showDetails && (
            <View className={styles.warningDetails}>
              {overTempDetails.map((detail, index) => (
                <View key={index} className={styles.warningItem}>
                  <View className={styles.warningItemHeader}>
                    <Text className={styles.warningItemTime}>
                      {formatTime(detail.startTime)} - {formatTime(detail.endTime)}
                    </Text>
                    <Text className={styles.warningItemDuration}>
                      持续 {detail.durationMinutes} 分钟
                    </Text>
                  </View>
                  <View className={styles.warningItemStats}>
                    <View className={styles.warningStat}>
                      <Text className={styles.warningStatLabel}>最高温度</Text>
                      <Text className={styles.warningStatValue}>
                        {detail.maxTemperature.toFixed(1)}℃
                      </Text>
                    </View>
                    <View className={styles.warningStat}>
                      <Text className={styles.warningStatLabel}>平均温度</Text>
                      <Text className={styles.warningStatValue}>
                        {detail.avgTemperature.toFixed(1)}℃
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {summary.hasWarningTemp && !summary.hasOverTemp && (
        <View className={styles.noticeSection}>
          <Text className={styles.noticeText}>
            存在预警记录（{summary.warningTempCount}次），请重点检查货品状态
          </Text>
        </View>
      )}
    </View>
  )
}

export default TemperatureCard
