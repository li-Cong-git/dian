/**
 * 商家中心主界面
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MerchantCenterStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import merchantService, { MerchantInfo, MerchantStats } from '../../services/merchant.service';

// 定义组件属性类型
interface MerchantCenterScreenProps {
  navigation: StackNavigationProp<MerchantCenterStackParamList, 'MerchantCenterScreen'>;
}

/**
 * 商家中心主界面组件
 */
const MerchantCenterScreen: React.FC<MerchantCenterScreenProps> = ({ navigation }) => {
  // 设置页面标题
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: '商家中心',
      headerStyle: {
        backgroundColor: '#fff',
      },
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });
  }, [navigation]);

  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null);
  const [stats, setStats] = useState<MerchantStats | null>(null);
  
  // 加载商家信息
  useEffect(() => {
    loadMerchantInfo();
  }, []);
  
  /**
   * 加载商家信息
   */
  const loadMerchantInfo = async () => {
    if (!user?._id) {
      return;
    }
    
    setLoading(true);
    
    try {
      // 获取商家信息
      const merchantData = await merchantService.getMerchantInfo(user._id);
      setMerchantInfo(merchantData);
      
      // 获取统计数据
      const statsData = await merchantService.getMerchantStats(user._id);
      setStats(statsData);
    } catch (error) {
      console.error('加载商家信息失败:', error);
      Alert.alert('加载失败', '无法加载商家信息，请稍后重试');
      
      // 不再使用默认/模拟数据兜底，而是显示错误状态
      setMerchantInfo(null);
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  /**
   * 处理下拉刷新
   */
  const handleRefresh = () => {
    setRefreshing(true);
    loadMerchantInfo();
  };
  
  /**
   * 导航到订单管理
   */
  const goToOrderManagement = () => {
    console.log('导航到订单管理页面');
    navigation.navigate('OrderManagement', {});
  };

  /**
   * 导航到订单管理并过滤待处理订单
   */
  const goToPendingOrders = () => {
    navigation.navigate('OrderManagement', { status: 'pending' });
  };
  
  /**
   * 导航到商品管理
   */
  const goToProductManagement = () => {
    navigation.navigate('ProductList');
  };
  
  /**
   * 导航到设置页面
   */
  const goToSettings = () => {
    navigation.navigate('MerchantSettings');
  };
  
  /**
   * 渲染商家信息
   */
  const renderMerchantInfo = () => (
    <View style={styles.merchantInfoContainer}>
      <View style={styles.merchantHeader}>
        <Image
          source={{ uri: merchantInfo?.logo || 'https://via.placeholder.com/80' }}
          style={styles.logo}
        />
        <View style={styles.merchantDetails}>
          <Text style={styles.merchantName}>{merchantInfo?.name}</Text>
          <Text style={styles.accountId}>账号ID: {merchantInfo?.accountName}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, 
              merchantInfo?.status === 'active' ? styles.statusActive : 
              merchantInfo?.status === 'suspended' ? styles.statusSuspended : 
              styles.statusClosed
            ]} />
            <Text style={styles.statusText}>
              {merchantInfo?.status === 'active' ? '正常营业' : 
               merchantInfo?.status === 'suspended' ? '已暂停' : '已关闭'}
            </Text>
          </View>
        </View>
      </View>
      
      {merchantInfo?.description && (
        <Text style={styles.description}>{merchantInfo.description}</Text>
      )}
    </View>
  );
  
  /**
   * 渲染统计数据
   */
  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>¥{statsData.todaySales?.toFixed(2) || '0.00'}</Text>
        <Text style={styles.statLabel}>今日销售</Text>
      </View>
      
      <View style={styles.statDivider} />
      
      <TouchableOpacity style={styles.statItem} onPress={goToPendingOrders}>
        <Text style={[styles.statValue, styles.clickableStatValue]}>{statsData.pendingOrders || 0}</Text>
        <Text style={styles.statLabel}>待处理订单</Text>
      </TouchableOpacity>
      
      <View style={styles.statDivider} />
      
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{statsData.todayVisitors || 0}</Text>
        <Text style={styles.statLabel}>今日访客</Text>
      </View>
      
      <View style={styles.statDivider} />
      
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{statsData.productsOnSale || 0}</Text>
        <Text style={styles.statLabel}>在售商品</Text>
      </View>
    </View>
  );
  
  /**
   * 渲染销售概览
   */
  const renderSalesOverview = () => (
    <View style={styles.overviewContainer}>
      <Text style={styles.overviewTitle}>销售概览</Text>
      <View style={styles.overviewContent}>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>本周销售</Text>
          <Text style={styles.overviewValue}>¥{statsData.weekSales?.toFixed(2) || '0.00'}</Text>
        </View>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>本月销售</Text>
          <Text style={styles.overviewValue}>¥{statsData.monthSales?.toFixed(2) || '0.00'}</Text>
        </View>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>总销售额</Text>
          <Text style={styles.overviewValue}>¥{statsData.totalSales?.toFixed(2) || '0.00'}</Text>
        </View>
      </View>
    </View>
  );
  
  /**
   * 渲染功能菜单
   */
  const renderFeatureMenu = () => (
    <View style={styles.menuContainer}>
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>商品管理</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={goToProductManagement}
          activeOpacity={0.7}
          testID="productListButton"
        >
          <View style={styles.menuIconContainer}>
            <Text style={styles.menuIcon}>🛍️</Text>
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuLabel}>商品列表</Text>
            <Text style={styles.menuDescription}>查看和管理所有商品</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>订单管理</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={goToOrderManagement}
          activeOpacity={0.7}
          testID="orderListButton"
        >
          <View style={styles.menuIconContainer}>
            <Text style={styles.menuIcon}>📦</Text>
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuLabel}>订单列表</Text>
            <Text style={styles.menuDescription}>查看和管理所有订单</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>店铺设置</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={goToSettings}
          activeOpacity={0.7}
          testID="settingsButton"
        >
          <View style={styles.menuIconContainer}>
            <Text style={styles.menuIcon}>⚙️</Text>
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuLabel}>设置</Text>
            <Text style={styles.menuDescription}>店铺信息、账户设置与退出登录</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  /**
   * 渲染加载状态
   */
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1677ff" />
      <Text style={styles.loadingText}>加载中...</Text>
    </View>
  );
  
  /**
   * 渲染错误状态
   */
  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>无法加载数据，请下拉刷新重试</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={handleRefresh}
      >
        <Text style={styles.retryButtonText}>重试</Text>
      </TouchableOpacity>
    </View>
  );
  
  // 渲染主界面
  if (loading) {
    return renderLoading();
  }
  
  // 如果没有商家信息，显示错误状态
  if (!merchantInfo) {
    return (
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1677ff']}
          />
        }
      >
        {renderError()}
      </ScrollView>
    );
  }
  
  // 如果统计数据不可用，使用默认空数据
  const statsData = stats || {
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    totalSales: 0,
    todayOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    completedOrders: 0,
    todayVisitors: 0,
    totalProducts: 0,
    productsSoldOut: 0,
    productsOnSale: 0
  };
  
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#1677ff']}
        />
      }
    >
      {/* 临时测试按钮，仅用于调试导航问题 */}
      {/* <TouchableOpacity 
        style={{
          backgroundColor: '#1677ff',
          padding: 10,
          margin: 10,
          borderRadius: 5,
          alignItems: 'center'
        }}
        onPress={goToOrderManagement}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>测试跳转到订单管理</Text>
      </TouchableOpacity> */}
      {/* 商家信息 */}
      {renderMerchantInfo()}
      
      {/* 统计数据 */}
      {renderStats()}
      
      {/* 销售概览 */}
      {renderSalesOverview()}
      
      {/* 功能菜单 */}
      {renderFeatureMenu()}
    </ScrollView>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  merchantInfoContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
  },
  merchantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  merchantDetails: {
    flex: 1,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  accountId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusActive: {
    backgroundColor: '#52c41a',
  },
  statusSuspended: {
    backgroundColor: '#faad14',
  },
  statusClosed: {
    backgroundColor: '#ff4d4f',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statsContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 16,
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1677ff',
    marginBottom: 4,
  },
  clickableStatValue: {
    textDecorationLine: 'underline',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  overviewContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  overviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  menuSection: {
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 16,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 12,
    color: '#999',
  },
  menuArrow: {
    fontSize: 24,
    color: '#ccc',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 50,
  },
  errorText: {
    marginBottom: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1677ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MerchantCenterScreen; 