/**
 * 商家首页屏幕
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

/**
 * 商家首页屏幕组件
 */
const MerchantHomeScreen: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          欢迎回来，{user?.name || user?.username || '商家'}
        </Text>
        <Text style={styles.shopName}>
          {user?.shopName || '我的店铺'}
        </Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <Text style={styles.statsValue}>0</Text>
          <Text style={styles.statsLabel}>今日订单</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsValue}>0</Text>
          <Text style={styles.statsLabel}>今日访客</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsValue}>¥0</Text>
          <Text style={styles.statsLabel}>今日销售额</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>待处理事项</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>0</Text>
            </View>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📦</Text>
            </View>
            <Text style={styles.actionText}>待发货</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>0</Text>
            </View>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>🚚</Text>
            </View>
            <Text style={styles.actionText}>待收货</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>0</Text>
            </View>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>💬</Text>
            </View>
            <Text style={styles.actionText}>新消息</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📊</Text>
            </View>
            <Text style={styles.actionText}>全部订单</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>店铺管理</Text>
        <View style={styles.manageGrid}>
          <TouchableOpacity style={styles.manageItem}>
            <View style={styles.manageIcon}>
              <Text style={styles.manageIconText}>📝</Text>
            </View>
            <Text style={styles.manageText}>商品管理</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.manageItem}>
            <View style={styles.manageIcon}>
              <Text style={styles.manageIconText}>🏷️</Text>
            </View>
            <Text style={styles.manageText}>分类管理</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.manageItem}>
            <View style={styles.manageIcon}>
              <Text style={styles.manageIconText}>📈</Text>
            </View>
            <Text style={styles.manageText}>销售统计</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.manageItem}>
            <View style={styles.manageIcon}>
              <Text style={styles.manageIconText}>🔧</Text>
            </View>
            <Text style={styles.manageText}>店铺设置</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.manageItem}>
            <View style={styles.manageIcon}>
              <Text style={styles.manageIconText}>📹</Text>
            </View>
            <Text style={styles.manageText}>视频管理</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.manageItem}>
            <View style={styles.manageIcon}>
              <Text style={styles.manageIconText}>💰</Text>
            </View>
            <Text style={styles.manageText}>结算中心</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1677ff',
    padding: 20,
    paddingTop: 30,
    paddingBottom: 30,
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  shopName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: -20,
    marginHorizontal: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1677ff',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  actionBadge: {
    position: 'absolute',
    top: -5,
    right: '30%',
    backgroundColor: '#ff4d4f',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  actionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 5,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIconText: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
  },
  manageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  manageItem: {
    width: '33.33%',
    alignItems: 'center',
    marginBottom: 16,
  },
  manageIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  manageIconText: {
    fontSize: 24,
  },
  manageText: {
    fontSize: 12,
    color: '#666',
  },
});

export default MerchantHomeScreen; 