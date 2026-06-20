import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { AuditStep } from '@/types/audit'

interface StepIndicatorProps {
  currentStep: AuditStep
}

const steps: Array<{ key: AuditStep; label: string }> = [
  { key: 'scan', label: '扫码验车' },
  { key: 'check', label: '现场核对' },
  { key: 'result', label: '签收意见' }
]

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const currentIndex = steps.findIndex(s => s.key === currentStep)

  return (
    <View className={styles.container}>
      {steps.map((step, index) => {
        const isActive = index === currentIndex
        const isCompleted = index < currentIndex
        return (
          <React.Fragment key={step.key}>
            <View className={styles.stepItem}>
              <View
                className={classnames(
                  styles.stepCircle,
                  isActive && styles.active,
                  isCompleted && styles.completed
                )}
              >
                <Text className={styles.stepNumber}>
                  {isCompleted ? '✓' : index + 1}
                </Text>
              </View>
              <Text
                className={classnames(
                  styles.stepLabel,
                  isActive && styles.activeLabel
                )}
              >
                {step.label}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View
                className={classnames(
                  styles.stepLine,
                  index < currentIndex && styles.lineCompleted
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </View>
  )
}

export default StepIndicator
