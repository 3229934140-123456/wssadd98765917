import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { SignSuggestion } from '@/types/audit'
import { getSignStatusLabel, getSignStatusColor, getSignStatusBg } from '@/utils/temperature'

interface StatusBadgeProps {
  status: SignSuggestion
  size?: 'sm' | 'md'
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const label = getSignStatusLabel(status)
  const color = getSignStatusColor(status)
  const bgColor = getSignStatusBg(status)

  return (
    <View
      className={classnames(styles.badge, styles[size])}
      style={{ background: bgColor }}
    >
      <View
        className={classnames(styles.dot, styles[`dot-${status}`])}
        style={{ background: color }}
      />
      <Text className={styles.text} style={{ color }}>
        {label}
      </Text>
    </View>
  )
}

export default StatusBadge
