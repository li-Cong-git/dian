/**
 * 订单和物流服务
 * 实现订单创建、支付和物流跟踪等功能
 */
import { apiClient, API_PATHS } from './api';

// 定义类型
interface OrderData {
  userId: string;
  products: Array<{
    productId: string;
    quantity: number;
    price: number;
    [key: string]: any;
  }>;
  address: {
    province: string;
    city: string;
    district: string;
    detail: string;
    receiver: string;
    phone: string;
    [key: string]: any;
  };
  paymentMethod: string;
  [key: string]: any;
}

interface OrderQueryParams {
  userId: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface PaymentData {
  orderId: string;
  userId: string;
  method: string;
  [key: string]: any;
}

interface LogisticsParams {
  trackingNumber: string;
  carrier?: string;
}

interface ReviewData {
  orderId: string;
  userId: string;
  items: Array<{
    productId: string;
    rating: number;
    content: string;
    images?: string[];
  }>;
}

interface RefundData {
  orderId: string;
  userId: string;
  reason: string;
  description: string;
  images?: string[];
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: any;
}

/**
 * 订单服务类
 */
class OrderService {
  /**
   * 创建订单
   * @param {OrderData} orderData - 订单数据
   * @returns {Promise<ApiResponse>} - 创建结果
   */
  async createOrder(orderData: OrderData): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.ORDER.CREATE, orderData);
      return response;
    } catch (error) {
      console.error('创建订单失败:', error);
      throw error;
    }
  }

  /**
   * 获取订单列表
   * @param {OrderQueryParams} params - 查询参数
   * @returns {Promise<ApiResponse>} - 订单列表
   */
  async getOrders(params: OrderQueryParams): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.ORDER.LIST, params);
      return response;
    } catch (error) {
      console.error('获取订单列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取订单详情
   * @param {string} orderId - 订单ID
   * @param {string} userId - 用户ID
   * @returns {Promise<ApiResponse>} - 订单详情
   */
  async getOrderDetail(orderId: string, userId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.ORDER.DETAIL, { orderId, userId });
      return response;
    } catch (error) {
      console.error('获取订单详情失败:', error);
      throw error;
    }
  }

  /**
   * 取消订单
   * @param {string} orderId - 订单ID
   * @param {string} userId - 用户ID
   * @param {string} reason - 取消原因(可选)
   * @returns {Promise<ApiResponse>} - 取消结果
   */
  async cancelOrder(orderId: string, userId: string, reason: string = ''): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.ORDER.CANCEL, { 
        orderId, 
        userId,
        reason 
      });
      return response;
    } catch (error) {
      console.error('取消订单失败:', error);
      throw error;
    }
  }

  /**
   * 支付订单
   * @param {PaymentData} paymentData - 支付数据
   * @returns {Promise<ApiResponse>} - 支付结果
   */
  async payOrder(paymentData: PaymentData): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/users/orders/pay', paymentData);
      return response;
    } catch (error) {
      console.error('支付订单失败:', error);
      throw error;
    }
  }

  /**
   * 确认收货
   * @param {string} orderId - 订单ID
   * @param {string} userId - 用户ID
   * @returns {Promise<ApiResponse>} - 操作结果
   */
  async confirmReceived(orderId: string, userId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/users/orders/confirm', { orderId, userId });
      return response;
    } catch (error) {
      console.error('确认收货失败:', error);
      throw error;
    }
  }

  /**
   * 查询物流信息
   * @param {string} trackingNumber - 物流单号
   * @param {string} carrier - 物流公司代码(可选)
   * @returns {Promise<ApiResponse>} - 物流信息
   */
  async trackLogistics(trackingNumber: string, carrier?: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.LOGISTICS.TRACK, { 
        trackingNumber,
        carrier 
      });
      return response;
    } catch (error) {
      console.error('查询物流失败:', error);
      throw error;
    }
  }

  /**
   * 评价订单
   * @param {ReviewData} reviewData - 评价数据
   * @returns {Promise<ApiResponse>} - 评价结果
   */
  async reviewOrder(reviewData: ReviewData): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/users/orders/review', reviewData);
      return response;
    } catch (error) {
      console.error('评价订单失败:', error);
      throw error;
    }
  }

  /**
   * 申请退款
   * @param {RefundData} refundData - 退款数据
   * @returns {Promise<ApiResponse>} - 退款申请结果
   */
  async requestRefund(refundData: RefundData): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/users/orders/refund', refundData);
      return response;
    } catch (error) {
      console.error('申请退款失败:', error);
      throw error;
    }
  }
}

export default new OrderService(); 