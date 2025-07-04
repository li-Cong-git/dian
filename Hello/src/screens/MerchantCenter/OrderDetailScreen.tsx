/**
 * 订单详情页面
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MerchantCenterStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import orderService from '../../services/order.service';

// 定义组件属性类型
type OrderDetailScreenProps = StackScreenProps<MerchantCenterStackParamList, 'OrderDetail'>;

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
 * 订单详情页面组件
 */
const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ navigation, route }) => {
  const { id } = route.params;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [order, setOrder] = useState<Order | null>(null);
  
  // 发货模态框状态
  const [showShipModal, setShowShipModal] = useState<boolean>(false);
  const [carrier, setCarrier] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');

  // 初始加载
  useEffect(() => {
    loadOrderDetail();
  }, [id]);

  // 设置页面标题
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: '订单详情',
    });
  }, [navigation]);

  /**
   * 加载订单详情
   */
  const loadOrderDetail = async () => {
    if (!user?._id || !id) return;
    
    setLoading(true);
    
    try {
      const response = await orderService.getOrderDetail(id, user._id);
      
      if (response && response.data) {
        setOrder(response.data);
      } else {
        Alert.alert('提示', '未找到订单信息');
        navigation.goBack();
      }
    } catch (error) {
      console.error('加载订单详情失败:', error);
      Alert.alert('加载失败', '无法加载订单详情，请稍后重试');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理发货
   */
  const handleShipOrder = async () => {
    if (!order || !user?._id) return;
    
    if (!carrier.trim() || !trackingNumber.trim()) {
      Alert.alert('提示', '请填写物流公司和物流单号');
      return;
    }

    try {
      await orderService.shipOrder({
        orderId: order._id,
        merchantId: user._id,
        carrier,
        trackingNumber
      });
      
      // 关闭模态框
      setShowShipModal(false);
      
      // 刷新订单详情
      loadOrderDetail();
      
      Alert.alert('发货成功', '订单已成功发货');
    } catch (error) {
      console.error('订单发货失败:', error);
      Alert.alert('发货失败', '无法完成订单发货，请稍后重试');
    }
  };

  /**
   * 处理订单状态变更
   */
  const handleOrderStatusChange = (newStatus: 'pending' | 'shipped' | 'delivered' | 'completed' | 'cancelled') => {
    if (!order || !user?._id) return;
    
    // 根据不同状态执行不同操作
    switch (newStatus) {
      case 'shipped':
        setShowShipModal(true);
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
                  await orderService.cancelOrder(order._id, user._id, '商家取消订单');
                  loadOrderDetail();
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
   * 查看物流信息
   */
  const viewLogistics = async () => {
    if (!order?.shippingInfo) return;
    
    try {
      const response = await orderService.trackLogistics(
        order.shippingInfo.trackingNumber,
        order.shippingInfo.carrier
      );
      
      if (response && response.data) {
        // 处理物流信息显示
        navigation.navigate('LogisticsDetail', { 
          logistics: response.data,
          orderNumber: order.orderNumber
        });
      }
    } catch (error) {
      console.error('获取物流信息失败:', error);
      Alert.alert('查询失败', '无法获取物流信息，请稍后重试');
    }
  };

  // 加载中状态
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1677ff" />
        <Text style={styles.loadingText}>正在加载订单详情...</Text>
      </View>
    );
  }

  // 无订单数据
  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>订单不存在或已被删除</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>返回订单列表</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 订单状态 */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>订单状态</Text>
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusText,
            order.status === 'pending' && styles.statusPending,
            order.status === 'shipped' && styles.statusShipped,
            order.status === 'delivered' && styles.statusDelivered,
            order.status === 'completed' && styles.statusCompleted,
            order.status === 'cancelled' && styles.statusCancelled
          ]}>
            {ORDER_STATUS_MAP[order.status]}
          </Text>
        </View>
      </View>
      
      {/* 订单基本信息 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>订单信息</Text>
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>订单编号:</Text>
            <Text style={styles.infoValue}>{order.orderNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>下单时间:</Text>
            <Text style={styles.infoValue}>{new Date(order.createdAt).toLocaleString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>支付方式:</Text>
            <Text style={styles.infoValue}>{order.paymentMethod}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>订单金额:</Text>
            <Text style={[styles.infoValue, styles.priceText]}>¥{order.totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </View>
      
      {/* 收货信息 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>收货信息</Text>
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>收货人:</Text>
            <Text style={styles.infoValue}>{order.address.receiver}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>联系电话:</Text>
            <Text style={styles.infoValue}>{order.address.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>收货地址:</Text>
            <Text style={styles.infoValue}>
              {order.address.province}{order.address.city}{order.address.district}{order.address.detail}
            </Text>
          </View>
        </View>
      </View>
      
      {/* 物流信息 - 仅在已发货时显示 */}
      {order.status === 'shipped' && order.shippingInfo && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>物流信息</Text>
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>物流公司:</Text>
              <Text style={styles.infoValue}>{order.shippingInfo.carrier}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>物流单号:</Text>
              <Text style={styles.infoValue}>{order.shippingInfo.trackingNumber}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.logisticsButton}
            onPress={viewLogistics}
          >
            <Text style={styles.logisticsButtonText}>查看物流详情</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* 商品列表 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>商品信息</Text>
        <View style={styles.productList}>
          {order.items.map((item, index) => (
            <View key={index} style={styles.productItem}>
              <Image 
                source={{ uri: item.image || 'https://via.placeholder.com/80' }}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.productDetails}>
                  <Text style={styles.productPrice}>¥{item.price.toFixed(2)}</Text>
                  <Text style={styles.productQuantity}>x {item.quantity}</Text>
                </View>
                <Text style={styles.productSubtotal}>小计: ¥{(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      
      {/* 操作按钮 - 根据订单状态显示不同操作 */}
      {order.status === 'pending' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.shipButton]}
            onPress={() => handleOrderStatusChange('shipped')}
          >
            <Text style={styles.actionButtonText}>发货</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleOrderStatusChange('cancelled')}
          >
            <Text style={styles.actionButtonText}>取消订单</Text>
          </TouchableOpacity>
        </View>
      )}
      
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4d4f',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
    backgroundColor: '#1677ff',
    borderRadius: 4,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
  },
  statusCard: {
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
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
  card: {
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  cardContent: {
    paddingVertical: 5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  priceText: {
    color: '#f50',
    fontWeight: '500',
  },
  logisticsButton: {
    backgroundColor: '#f0f8ff',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
  },
  logisticsButtonText: {
    color: '#1677ff',
    fontSize: 14,
  },
  productList: {
    marginTop: 5,
  },
  productItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
  },
  productInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 14,
    color: '#f50',
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
  },
  productSubtotal: {
    fontSize: 13,
    color: '#666',
    textAlign: 'right',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 20,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    minWidth: 120,
    alignItems: 'center',
  },
  shipButton: {
    backgroundColor: '#1677ff',
  },
  cancelButton: {
    backgroundColor: '#ff4d4f',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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

export default OrderDetailScreen; 