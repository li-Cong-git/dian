/**
 * 商家订单管理页面
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MerchantCenterStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import orderService from '../../services/order.service';

// 定义组件属性类型
type OrderManagementScreenProps = StackScreenProps<MerchantCenterStackParamList, 'OrderManagement'>;

/**
 * 订单状态选项
 */
const ORDER_STATUS_OPTIONS = [
  { label: '全部订单', value: '' },
  { label: '待发货', value: 'pending' },
  { label: '已发货', value: 'shipped' },
  { label: '已收货', value: 'delivered' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
];

/**
 * 订单状态中文映射
 */
const ORDER_STATUS_MAP: Record<string, string> = {
  pending: '待发货',
  shipped: '已发货',
  delivered: '已收货',
  completed: '已完成',
  cancelled: '已取消'
};

/**
 * 订单项目接口
 */
interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

/**
 * 订单接口
 */
interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  merchantId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  shippingInfo?: {
    carrier: string;
    trackingNumber: string;
  };
  address: {
    receiver: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    detail: string;
  };
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 商家订单管理页面组件
 */
const OrderManagementScreen: React.FC<OrderManagementScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // 从路由参数获取预设状态
  const initialStatus = route.params?.status || '';
  
  // 筛选状态
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [showStatusFilter, setShowStatusFilter] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  
  // 发货模态框状态
  const [showShipModal, setShowShipModal] = useState<boolean>(false);
  const [shippingOrderId, setShippingOrderId] = useState<string>('');
  const [carrier, setCarrier] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');

  // 设置页面标题
  React.useLayoutEffect(() => {
    // 根据筛选状态设置标题
    const statusTitle = selectedStatus ? 
      `${ORDER_STATUS_MAP[selectedStatus] || ''}订单` : 
      '订单管理';
      
    navigation.setOptions({
      title: statusTitle,
    });
  }, [navigation, selectedStatus]);

  // 初次加载
  useEffect(() => {
    if (user?._id) {
      loadOrders();
    }
  }, [user]);
  
  // 当路由参数中的status变化时更新筛选
  useEffect(() => {
    if (route.params?.status !== undefined) {
      setSelectedStatus(route.params.status);
      loadOrders(1, false, route.params.status);
    }
  }, [route.params?.status]);

  /**
   * 加载订单列表
   */
  const loadOrders = async (page: number = 1, isRefreshing: boolean = false, status?: string) => {
    if (!user?._id) return;
    
    if (isRefreshing) {
      setRefreshing(true);
    } else if (page === 1) {
      setLoading(true);
    }
    
    try {
      // 调用API获取商家订单
      const response = await orderService.getMerchantOrders({
        merchantId: user._id,
        status: status !== undefined ? status : selectedStatus,
        page,
        limit: 10,
        search: searchText
      });
      
      if (response && response.data) {
        if (page === 1) {
          setOrders(response.data.orders || []);
        } else {
          setOrders(prevOrders => [...prevOrders, ...(response.data.orders || [])]);
        }
        
        setTotalOrders(response.data.total || 0);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('加载订单列表失败:', error);
      Alert.alert('加载失败', '无法加载订单列表，请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * 下拉刷新
   */
  const handleRefresh = () => {
    loadOrders(1, true);
  };

  /**
   * 加载更多
   */
  const handleLoadMore = () => {
    if (orders.length < totalOrders && !loading) {
      loadOrders(currentPage + 1);
    }
  };

  /**
   * 应用筛选
   */
  const applyFilter = () => {
    loadOrders(1);
  };

  /**
   * 搜索订单
   */
  const handleSearch = () => {
    applyFilter();
  };

  /**
   * 显示发货模态框
   */
  const showShippingModal = (orderId: string) => {
    setShippingOrderId(orderId);
    setCarrier('');
    setTrackingNumber('');
    setShowShipModal(true);
  };

  /**
   * 处理发货
   */
  const handleShipOrder = async () => {
    if (!carrier.trim() || !trackingNumber.trim()) {
      Alert.alert('提示', '请填写物流公司和物流单号');
      return;
    }

    try {
      await orderService.shipOrder({
        orderId: shippingOrderId,
        merchantId: user!._id,
        carrier,
        trackingNumber
      });
      
      // 关闭模态框
      setShowShipModal(false);
      
      // 刷新订单列表
      loadOrders(1, true);
      
      Alert.alert('发货成功', '订单已成功发货');
    } catch (error) {
      console.error('订单发货失败:', error);
      Alert.alert('发货失败', '无法完成订单发货，请稍后重试');
    }
  };

  /**
   * 处理订单状态变更
   */
  const handleOrderStatusChange = (order: Order, newStatus: 'pending' | 'shipped' | 'delivered' | 'completed' | 'cancelled') => {
    // 根据不同状态执行不同操作
    switch (newStatus) {
      case 'shipped':
        showShippingModal(order._id);
        break;
      case 'cancelled':
        Alert.alert(
          '取消订单',
          '确定要取消此订单吗？',
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '确定', 
              style: 'destructive',
              onPress: async () => {
                try {
                  await orderService.cancelOrder(order._id, user!._id, '商家取消订单');
                  loadOrders(1, true);
                  Alert.alert('成功', '订单已取消');
                } catch (error) {
                  console.error('取消订单失败:', error);
                  Alert.alert('失败', '无法取消订单，请稍后重试');
                }
              }
            }
          ]
        );
        break;
      default:
        Alert.alert('暂不支持', `暂不支持将订单更改为${ORDER_STATUS_MAP[newStatus]}状态`);
    }
  };

  /**
   * 渲染订单项
   */
  const renderOrderItem = ({ item }: { item: Order }) => {
    const totalItems = item.items.reduce((sum, item) => sum + item.quantity, 0);
    
    return (
      <View style={styles.orderItem}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>订单号: {item.orderNumber}</Text>
          <Text style={[
            styles.orderStatus,
            item.status === 'pending' && styles.statusPending,
            item.status === 'shipped' && styles.statusShipped,
            item.status === 'delivered' && styles.statusDelivered,
            item.status === 'completed' && styles.statusCompleted,
            item.status === 'cancelled' && styles.statusCancelled
          ]}>
            {ORDER_STATUS_MAP[item.status]}
          </Text>
        </View>
        
        <View style={styles.orderInfo}>
          <Text style={styles.orderDate}>下单时间: {new Date(item.createdAt).toLocaleString()}</Text>
          <Text style={styles.orderItems}>商品: {totalItems}件</Text>
          <Text style={styles.orderTotal}>总金额: ¥{item.totalAmount.toFixed(2)}</Text>
        </View>
        
        <View style={styles.addressInfo}>
          <Text style={styles.addressText}>
            收货人: {item.address.receiver} ({item.address.phone})
          </Text>
          <Text style={styles.addressText}>
            地址: {item.address.province}{item.address.city}{item.address.district}{item.address.detail}
          </Text>
        </View>
        
        <View style={styles.orderActions}>
          {/* 根据订单状态显示不同的操作按钮 */}
          {item.status === 'pending' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.shipButton]}
                onPress={() => handleOrderStatusChange(item, 'shipped')}
              >
                <Text style={styles.actionButtonText}>发货</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleOrderStatusChange(item, 'cancelled')}
              >
                <Text style={styles.actionButtonText}>取消</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {item.status === 'shipped' && (
            <View style={styles.shippingInfo}>
              <Text style={styles.shippingText}>
                物流: {item.shippingInfo?.carrier} ({item.shippingInfo?.trackingNumber})
              </Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.detailButton}
            onPress={() => navigation.navigate('OrderDetail', { id: item._id })}
          >
            <Text style={styles.detailButtonText}>查看详情</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /**
   * 渲染页脚（加载更多）
   */
  const renderFooter = () => {
    if (!loading || refreshing) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#1677ff" />
        <Text style={styles.footerText}>正在加载更多...</Text>
      </View>
    );
  };

  /**
   * 渲染空列表状态
   */
  const renderEmptyList = () => {
    if (loading && !refreshing) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暂无订单</Text>
        <Text style={styles.emptySubText}>{selectedStatus ? `暂无${ORDER_STATUS_MAP[selectedStatus]}订单` : '暂无订单'}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索订单号/收货人"
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>搜索</Text>
        </TouchableOpacity>
      </View>
      
      {/* 筛选栏 */}
      <View style={styles.filterBar}>
        <TouchableOpacity 
          style={styles.filterItem}
          onPress={() => setShowStatusFilter(!showStatusFilter)}
        >
          <Text style={styles.filterText}>
            {selectedStatus === '' 
              ? '全部订单' 
              : ORDER_STATUS_MAP[selectedStatus] + '订单'}
          </Text>
          <Text style={styles.filterArrow}>▼</Text>
        </TouchableOpacity>
      </View>
      
      {/* 状态筛选下拉框 */}
      {showStatusFilter && (
        <View style={styles.filterDropdown}>
          {ORDER_STATUS_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterOption,
                selectedStatus === option.value && styles.selectedFilterOption
              ]}
              onPress={() => {
                setSelectedStatus(option.value);
                setShowStatusFilter(false);
                applyFilter();
              }}
            >
              <Text 
                style={[
                  styles.filterOptionText,
                  selectedStatus === option.value && styles.selectedFilterOptionText
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* 订单列表 */}
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1677ff']}
            tintColor="#1677ff"
          />
        }
        ListEmptyComponent={renderEmptyList}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
      />
      
      {/* 发货模态框 */}
      <Modal
        visible={showShipModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowShipModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>订单发货</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>物流公司</Text>
              <TextInput
                style={styles.modalInput}
                value={carrier}
                onChangeText={setCarrier}
                placeholder="请输入物流公司名称"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>物流单号</Text>
              <TextInput
                style={styles.modalInput}
                value={trackingNumber}
                onChangeText={setTrackingNumber}
                placeholder="请输入物流单号"
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowShipModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleShipOrder}
              >
                <Text style={styles.modalConfirmButtonText}>确认发货</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#1677ff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 4,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  filterArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  filterDropdown: {
    position: 'absolute',
    top: 108, // 搜索框高度 + 筛选栏高度
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 100,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedFilterOption: {
    backgroundColor: '#f0f8ff',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedFilterOptionText: {
    color: '#1677ff',
  },
  listContainer: {
    paddingVertical: 10,
    minHeight: '100%',
  },
  orderItem: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderNumber: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusPending: {
    color: '#fa8c16',
  },
  statusShipped: {
    color: '#1677ff',
  },
  statusDelivered: {
    color: '#52c41a',
  },
  statusCompleted: {
    color: '#52c41a',
  },
  statusCancelled: {
    color: '#f5222d',
  },
  orderInfo: {
    marginBottom: 10,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  orderItems: {
    fontSize: 13,
    color: '#333',
    marginBottom: 5,
  },
  orderTotal: {
    fontSize: 14,
    color: '#f50',
    fontWeight: '500',
  },
  addressInfo: {
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    marginBottom: 10,
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  orderActions: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 10,
  },
  shipButton: {
    backgroundColor: '#1677ff',
  },
  cancelButton: {
    backgroundColor: '#ff4d4f',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  shippingInfo: {
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 4,
    marginBottom: 10,
  },
  shippingText: {
    fontSize: 13,
    color: '#1677ff',
  },
  detailButton: {
    alignItems: 'flex-end',
  },
  detailButtonText: {
    fontSize: 14,
    color: '#1677ff',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  modalInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  modalCancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  modalCancelButtonText: {
    color: '#666',
  },
  modalConfirmButton: {
    backgroundColor: '#1677ff',
  },
  modalConfirmButtonText: {
    color: '#fff',
  },
});

export default OrderManagementScreen; 