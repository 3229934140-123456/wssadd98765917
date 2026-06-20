import React, { useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { mockUserInfo } from '@/data/mockData'

interface MenuItem {
  icon: string
  label: string
  action: () => void
}

const MinePage: React.FC = () => {
  const handleMenuClick = useCallback((label: string) => {
    console.log('[Mine] 点击菜单项:', label)
    Taro.showToast({ title: `${label}功能开发中`, icon: 'none' })
  }, [])

  const menuItems: MenuItem[] = [
    { icon: '📖', label: '操作指引', action: () => handleMenuClick('操作指引') },
    { icon: '❓', label: '常见问题', action: () => handleMenuClick('常见问题') },
    { icon: '📞', label: '联系客服', action: () => handleMenuClick('联系客服') },
    { icon: 'ℹ️', label: '关于我们', action: () => handleMenuClick('关于我们') }
  ]

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.userCard}>
          <View className={styles.avatar}>
            {mockUserInfo.name.charAt(0)}
          </View>
          <View className={styles.userInfo}>
            <Text className={styles.userName}>{mockUserInfo.name}</Text>
            <View>
              <Text className={styles.userRole}>{mockUserInfo.role}</Text>
            </View>
            <Text className={styles.employeeId}>工号：{mockUserInfo.employeeId}</Text>
          </View>
        </View>
        <View className={styles.storeInfo}>
          <Text className={styles.storeIcon}>🏪</Text>
          <View className={styles.storeDetails}>
            <Text className={styles.storeName}>{mockUserInfo.storeName}</Text>
            <Text className={styles.storeType}>{mockUserInfo.storeType}</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>常用功能</View>
        <View className={styles.menuList}>
          {menuItems.map((item, index) => (
            <View
              key={index}
              className={styles.menuItem}
              onClick={item.action}
            >
              <View className={styles.menuIcon}>{item.icon}</View>
              <View className={styles.menuContent}>
                <Text className={styles.menuLabel}>{item.label}</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.footer}>
        <Text className={styles.version}>冷链温区稽核 v1.0.0</Text>
      </View>
    </View>
  )
}

export default MinePage
