import React from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { CheckPhoto } from '@/types/audit'

interface PhotoUploaderProps {
  type: CheckPhoto['type']
  label: string
  description: string
  url?: string
  onUpload: (url: string) => void
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  type,
  label,
  description,
  url,
  onUpload
}) => {
  const handleChooseImage = async () => {
    console.log('[PhotoUploader] 选择图片:', type)
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album']
      })
      const tempUrl = res.tempFilePaths[0]
      if (tempUrl) {
        console.log('[PhotoUploader] 图片选择成功:', tempUrl)
        onUpload(tempUrl)
      }
    } catch (error) {
      console.error('[PhotoUploader] 选择图片失败:', error)
      Taro.showToast({ title: '取消选择', icon: 'none' })
    }
  }

  const handlePreview = () => {
    if (url) {
      Taro.previewImage({
        urls: [url],
        current: url
      })
    }
  }

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.label}>{label}</Text>
        {url && <Text className={styles.uploadedTag}>已上传</Text>}
      </View>
      <Text className={styles.description}>{description}</Text>
      <View className={styles.uploadArea}>
        {url ? (
          <View className={styles.previewContainer} onClick={handlePreview}>
            <Image
              className={styles.previewImage}
              src={url}
              mode='aspectFill'
              onError={(e) => console.error('[PhotoUploader] 图片加载失败:', e)}
            />
            <View className={styles.previewMask}>
              <Text className={styles.previewText}>点击查看</Text>
            </View>
          </View>
        ) : (
          <Button
            className={styles.uploadBtn}
            onClick={handleChooseImage}
          >
            <View className={styles.uploadIcon}>📷</View>
            <Text className={styles.uploadBtnText}>拍摄照片</Text>
          </Button>
        )}
      </View>
    </View>
  )
}

export default PhotoUploader
