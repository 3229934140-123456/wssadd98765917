import React, { useCallback, useMemo } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import StepIndicator from '@/components/StepIndicator'
import PhotoUploader from '@/components/PhotoUploader'
import { useAudit } from '@/store/AuditContext'
import type { CheckPhoto } from '@/types/audit'

interface PhotoConfig {
  type: CheckPhoto['type']
  label: string
  description: string
}

const photoConfigs: PhotoConfig[] = [
  {
    type: 'doorSeal',
    label: '车厢门封',
    description: '请拍摄车厢门封条完整性，确保未被开启过'
  },
  {
    type: 'outerPackage',
    label: '货品外包装',
    description: '请拍摄货箱外观，检查是否有破损、软化'
  },
  {
    type: 'tempGun',
    label: '手持测温枪读数',
    description: '请拍摄测温枪显示的货品中心温度读数'
  }
]

const CheckPage: React.FC = () => {
  const {
    waybillInfo,
    photos,
    abnormalItems,
    uploadPhoto,
    toggleAbnormalItem,
    setCurrentStep
  } = useAudit()

  const canProceed = useMemo(() => {
    const hasAllPhotos = photoConfigs.every(config =>
      photos.some(p => p.type === config.type && p.url)
    )
    const hasSelection = abnormalItems.some(item => item.value)
    return hasAllPhotos && hasSelection
  }, [photos, abnormalItems])

  const handlePhotoUpload = useCallback((type: CheckPhoto['type'], url: string) => {
    uploadPhoto(type, url)
  }, [uploadPhoto])

  const handleBack = useCallback(() => {
    console.log('[Check] 返回扫码验车')
    setCurrentStep('scan')
    Taro.navigateBack()
  }, [setCurrentStep])

  const handleNext = useCallback(() => {
    if (!canProceed) {
      const missingPhotos = photoConfigs.filter(config =>
        !photos.some(p => p.type === config.type && p.url)
      )
      if (missingPhotos.length > 0) {
        Taro.showToast({
          title: `请上传${missingPhotos[0].label}照片`,
          icon: 'none'
        })
        return
      }
      const hasSelection = abnormalItems.some(item => item.value)
      if (!hasSelection) {
        Taro.showToast({
          title: '请选择异常现象',
          icon: 'none'
        })
        return
      }
      return
    }
    console.log('[Check] 进入签收意见')
    setCurrentStep('result')
    Taro.navigateTo({ url: '/pages/result/index' })
  }, [canProceed, photos, abnormalItems, setCurrentStep])

  if (!waybillInfo) {
    Taro.showToast({ title: '请先扫码验车', icon: 'none' })
    setTimeout(() => Taro.navigateBack(), 1500)
    return null
  }

  return (
    <View className={styles.page}>
      <View className={styles.stepContainer}>
        <StepIndicator currentStep='check' />
      </View>

      <View className={styles.content}>
        <Text className={styles.sectionTitle}>现场拍照</Text>
        <Text className={styles.sectionDesc}>
          请按顺序拍摄以下照片，作为核验依据
        </Text>

        {photoConfigs.map(config => {
          const photo = photos.find(p => p.type === config.type)
          return (
            <PhotoUploader
              key={config.type}
              type={config.type}
              label={config.label}
              description={config.description}
              url={photo?.url}
              onUpload={(url) => handlePhotoUpload(config.type, url)}
            />
          )
        })}

        <Text className={styles.sectionTitle}>异常现象</Text>
        <Text className={styles.sectionDesc}>
          请仔细检查货品状态，勾选发现的异常现象
        </Text>

        <View className={styles.abnormalCard}>
          <Text className={styles.abnormalTitle}>请勾选观察到的现象</Text>
          <View className={styles.abnormalList}>
            {abnormalItems.map(item => {
              const isNormal = item.key === 'normal'
              const isSelected = item.value
              return (
                <View
                  key={item.key}
                  className={classnames(
                    styles.abnormalItem,
                    isSelected && (isNormal ? styles.selected : styles.selectedAbnormal)
                  )}
                  onClick={() => toggleAbnormalItem(item.key)}
                >
                  <View
                    className={classnames(
                      styles.checkbox,
                      isSelected && (isNormal ? styles.selected : styles.selectedAbnormal)
                    )}
                  >
                    {isSelected && (
                      <Text className={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text className={styles.abnormalLabel}>{item.label}</Text>
                </View>
              )
            })}
          </View>

          <View className={styles.tipCard}>
            <Text className={styles.tipText}>
              💡 提示：如发现"外箱软化、血水渗出、异味"等任何一项异常，系统将自动建议拒收，最终结果由品控人员复核确认。
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.footer}>
        <Button className={styles.backBtn} onClick={handleBack}>
          上一步
        </Button>
        <Button
          className={classnames(styles.nextBtn, !canProceed && styles.disabled)}
          onClick={handleNext}
        >
          下一步：签收意见
        </Button>
      </View>
    </View>
  )
}

export default CheckPage
