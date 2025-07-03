/**
 * 个人中心主屏幕
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';

// 定义组件属性类型
type ProfileScreenProps = StackScreenProps<ProfileStackParamList, 'ProfileScreen'>;

/**
 * 个人中心主屏幕组件
 */
const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  // 用户信息（模拟）
  const userInfo = {
    username: '用户名',
    avatar: null,
    level: 'Lv.5',
    points: 1250,
    description: '这是个人简介，用户可以在这里展示自己的兴趣爱好或其他信息。',
  };

  // 订单数据（模拟）
  const orderStats = [
    { label: '待付款', count: 2, icon: '💰' },
    { label: '待发货', count: 1, icon: '📦' },
    { label: '待收货', count: 0, icon: '🚚' },
    { label: '待评价', count: 3, icon: '✍️' },
    { label: '退换/售后', count: 0, icon: '🔄' },
  ];

  // 个人中心菜单项
  const menuItems = [
    { label: '我的订单', icon: '🛒', action: 'orders' },
    { label: '收货地址', icon: '📍', action: 'addresses' },
    { label: '我的收藏', icon: '⭐', action: 'favorites' },
    { label: '优惠券', icon: '🎟️', action: 'coupons' },
    { label: '浏览历史', icon: '👁️', action: 'history' },
    { label: '客服中心', icon: '💬', action: 'customerService' },
    { label: '帮助中心', icon: '❓', action: 'help' },
    { label: '设置', icon: '⚙️', action: 'settings' },
  ];

  // 导航处理
  const handleNavigation = (action: string) => {
    switch (action) {
      case 'editProfile':
        navigation.navigate('ProfileEdit', { userId: '123' });
        break;
      case 'settings':
        navigation.navigate('ProfileSettings');
        break;
      default:
        // 其他导航或操作（模拟）
        Alert.alert(`点击了${action}，实际应用中会跳转到相应页面`);
        break;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 个人信息 */}
      <View style={styles.header}>
        <View style={styles.userInfoContainer}>
          {/* 头像 */}
          <View style={styles.avatarContainer}>
            {userInfo.avatar ? (
              <Image source={{ uri: userInfo.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{userInfo.username.charAt(0)}</Text>
              </View>
            )}
          </View>

          {/* 用户信息 */}
          <View style={styles.userInfo}>
            <Text style={styles.username}>{userInfo.username}</Text>
            <View style={styles.levelContainer}>
              <Text style={styles.level}>{userInfo.level}</Text>
              <Text style={styles.points}>{userInfo.points}积分</Text>
            </View>
            <Text style={styles.description} numberOfLines={1}>
              {userInfo.description}
            </Text>
          </View>

          {/* 编辑按钮 */}
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleNavigation('editProfile')}
          >
            <Text style={styles.editButtonText}>编辑</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 我的订单 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>我的订单</Text>
          <TouchableOpacity onPress={() => handleNavigation('orders')}>
            <Text style={styles.sectionMore}>查看全部 &gt;</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.orderStats}>
          {orderStats.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.orderItem}
              onPress={() => handleNavigation(`order_${item.label}`)}
            >
              <View style={styles.orderIconContainer}>
                <Text style={styles.orderIcon}>{item.icon}</Text>
                {item.count > 0 && (
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderBadgeText}>{item.count}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.orderLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 功能菜单 */}
      <View style={styles.section}>
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleNavigation(item.action)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 推荐服务 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>推荐服务</Text>
        </View>
        <View style={styles.recommendContainer}>
          <TouchableOpacity style={styles.recommendItem}>
            <View style={styles.recommendIconContainer}>
              <Text style={styles.recommendIcon}>🎁</Text>
            </View>
            <View style={styles.recommendContent}>
              <Text style={styles.recommendTitle}>邀请有礼</Text>
              <Text style={styles.recommendDescription}>邀请好友注册，双方各得50积分</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.recommendItem}>
            <View style={styles.recommendIconContainer}>
              <Text style={styles.recommendIcon}>🏆</Text>
            </View>
            <View style={styles.recommendContent}>
              <Text style={styles.recommendTitle}>每日签到</Text>
              <Text style={styles.recommendDescription}>连续签到7天，额外奖励100积分</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 底部安全区域 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>App 版本：1.0.0</Text>
      </View>
    </ScrollView>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1677ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  level: {
    fontSize: 12,
    color: '#1677ff',
    backgroundColor: '#e6f7ff',
    borderWidth: 1,
    borderColor: '#91caff',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  points: {
    fontSize: 12,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    marginLeft: 8,
  },
  editButtonText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionMore: {
    fontSize: 14,
    color: '#666',
  },
  orderStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderItem: {
    flex: 1,
    alignItems: 'center',
  },
  orderIconContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  orderIcon: {
    fontSize: 24,
  },
  orderBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#f5222d',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  orderBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  orderLabel: {
    fontSize: 12,
    color: '#666',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  menuItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  menuLabel: {
    fontSize: 12,
    color: '#666',
  },
  recommendContainer: {
    marginTop: 8,
  },
  recommendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recommendIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recommendIcon: {
    fontSize: 20,
  },
  recommendContent: {
    flex: 1,
  },
  recommendTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  recommendDescription: {
    fontSize: 12,
    color: '#999',
  },
  footer: {
    alignItems: 'center',
    padding: 16,
    marginTop: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default ProfileScreen; 