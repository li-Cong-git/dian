/**
 * 商家服务
 * 处理商家相关API调用
 */
import { apiClient, API_PATHS } from './api';

/**
 * 商品类型定义
 */
export interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  images?: string[];
  thumbnail?: string;
  category: string;
  tags?: string[];
  stock: number;
  sold?: number;
  status: 'on_sale' | 'off_shelf' | 'sold_out';
  specifications?: Array<{
    name: string;
    values: string[];
  }>;
  merchantId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 订单类型定义
 */
export interface Order {
  _id: string;
  orderNo: string;
  userId: string;
  merchantId: string;
  items: Array<{
    productId: string;
    productName: string;
    productImage?: string;
    price: number;
    quantity: number;
    specifications?: any;
    subtotal: number;
  }>;
  totalAmount: number;
  actualPaid: number;
  shippingAddress: {
    name: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    address: string;
  };
  status: string;
  paymentMethod?: string;
  paymentTime?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 物流信息类型
 */
export interface Logistics {
  _id: string;
  orderId: string;
  orderNo: string;
  logisticsNo: string;
  logisticsCompany: string;
  status: string;
  shipFrom: {
    merchantId: string;
    merchantName: string;
    address: string;
    contact: string;
    phone: string;
  };
  shipTo: {
    userId: string;
    name: string;
    phone: string;
    address: string;
  };
  trackingInfo: Array<{
    time: string;
    description: string;
    location?: string;
  }>;
  shippingTime?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 商家信息类型
 */
export interface MerchantInfo {
  _id: string;
  name: string;
  logo?: string;
  description?: string;
  accountName: string;
  phone: string;
  email?: string;
  address?: {
    province: string;
    city: string;
    district: string;
    detail: string;
  };
  businessLicense?: string;
  businessScope?: string;
  status: 'active' | 'suspended' | 'closed';
  productCount?: number;
  orderCount?: number;
  salesAmount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 商家统计数据类型
 */
export interface MerchantStats {
  todaySales: number;
  weekSales: number;
  monthSales: number;
  totalSales: number;
  todayOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  completedOrders: number;
  todayVisitors: number;
  totalProducts: number;
  productsSoldOut: number;
  productsOnSale: number;
}

/**
 * 分页响应类型
 */
interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  pages: number;
  data: T[];
}

/**
 * 商家服务类
 */
class MerchantServiceClass {
  /**
   * 获取商家信息
   * @param {string} merchantId - 商家ID
   * @returns {Promise<MerchantInfo>} - 商家信息
   */
  async getMerchantInfo(merchantId: string): Promise<MerchantInfo> {
    try {
      const response = await apiClient.post(API_PATHS.MERCHANT.PROFILE, {
        merchantId
      });
      
      // API响应已经在拦截器中处理过，直接访问data
      if (!response || !response.data) {
        throw new Error('获取商家信息失败');
      }
      
      return response.data;
    } catch (error) {
      console.error('获取商家信息失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取商家统计数据
   * @param {string} merchantId - 商家ID
   * @returns {Promise<MerchantStats>} - 商家统计数据
   */
  async getMerchantStats(merchantId: string): Promise<MerchantStats> {
    try {
      // 使用真实的API接口获取数据
      const response = await apiClient.post(API_PATHS.ORDER.MERCHANT.STATS, {
        merchantId
      });
      
      // API响应已经在拦截器中处理过，直接访问data
      if (!response || !response.data) {
        throw new Error('获取商家统计数据失败');
      }
      
      const orderStats = response.data;
      
      // 商品统计数据变量
      let productsOnSale = 0;
      let productsSoldOut = 0;
      let totalProducts = 0;
      
      try {
        // 获取商品数据，用于统计在售商品和售罄商品
        const productsResponse = await this.getProducts({ 
          merchantId, 
          limit: 1000 // 获取大量商品以便统计
        });
        
        // 如果成功获取到商品数据，则计算统计信息
        if (productsResponse && productsResponse.data) {
          productsOnSale = productsResponse.data.filter(p => p.status === 'on_sale').length;
          productsSoldOut = productsResponse.data.filter(p => p.status === 'sold_out').length;
          totalProducts = productsResponse.data.length;
        }
      } catch (productError) {
        console.error('获取商品列表失败，使用默认值:', productError);
        // 商品API调用失败时使用默认值
        productsOnSale = 0;
        productsSoldOut = 0;
        totalProducts = 0;
      }
      
      // 计算今日、本周、本月的销售额
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // 今日订单数据
      let todayOrders = [];
      let todaySalesAmount = 0;
      
      try {
      // 获取包含时间信息的订单列表 - 注意：后端可能不支持timeRange参数
      const todayOrdersResponse = await apiClient.post(API_PATHS.ORDER.LIST, {
        merchantId,
        status: 'completed'
        // 移除了timeRange参数，因为后端可能不支持
      });
        
        if (todayOrdersResponse && todayOrdersResponse.data && todayOrdersResponse.data.orders) {
          todayOrders = todayOrdersResponse.data.orders;
          todaySalesAmount = todayOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);
        }
      } catch (orderError) {
        console.error('获取今日订单失败，使用默认值:', orderError);
        todayOrders = [];
        todaySalesAmount = 0;
      }
      
      // 构建统计数据
      const stats: MerchantStats = {
        // 销售额数据
        todaySales: todaySalesAmount,
        weekSales: orderStats.completedAmount || 0, // 简化处理，使用总完成订单金额作为周销售额
        monthSales: orderStats.completedAmount || 0, // 简化处理，使用总完成订单金额作为月销售额
        totalSales: orderStats.totalAmount || 0,
        
        // 订单数据
        todayOrders: todayOrders.length,
        pendingOrders: orderStats.pending || 0,
        shippedOrders: orderStats.shipped || 0,
        completedOrders: orderStats.completed || 0,
        
        // 访客数据 - 这个可能需要单独的API或服务来提供
        todayVisitors: 0, // 改为0，因为没有实际的访客统计API
        
        // 商品数据
        totalProducts: totalProducts,
        productsSoldOut: productsSoldOut,
        productsOnSale: productsOnSale
      };
      
      return stats;
    } catch (error) {
      console.error('获取商家统计数据失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新商家信息
   * @param {Object} options - 更新选项
   * @returns {Promise<MerchantInfo>} - 更新后的商家信息
   */
  async updateMerchantInfo(options: {
    merchantId: string;
    data: Partial<MerchantInfo>;
  }): Promise<MerchantInfo> {
    try {
      const { merchantId, data } = options;
      
      const response = await apiClient.post(API_PATHS.MERCHANT.UPDATE_PROFILE, {
        merchantId,
        ...data
      });
      
      // API响应已经在拦截器中处理过，直接访问data
      if (!response || !response.data) {
        throw new Error('更新商家信息失败');
      }
      
      return response.data;
    } catch (error) {
      console.error('更新商家信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取商家的商品列表
   * @param {Object} options - 查询选项
   * @returns {Promise<PaginatedResponse<Product>>} - 分页商品列表
   */
  async getProducts(options: {
    merchantId: string;
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Product>> {
    try {
      const { merchantId, status, category, search, page = 1, limit = 10 } = options;
      
      // 使用商品列表POST接口而不是GET
      const response = await apiClient.post(API_PATHS.PRODUCT.LIST, {
        merchantId, // 添加商家ID作为过滤条件
        status,
        category,
        keyword: search,
        page,
        limit
      });
      
      if (!response || !response.data) {
        throw new Error('获取商品列表失败');
      }
      
      // 适配返回格式
      return {
        total: response.data.total || 0,
        page: response.data.page || page,
        limit: response.data.limit || limit,
        pages: response.data.pages || 0,
        data: response.data.products || []
      };
    } catch (error) {
      console.error('获取商品列表失败:', error);
      // 返回空数据而不是抛出错误，这样UI不会崩溃
      return {
        total: 0,
        page: 1,
        limit: 10,
        pages: 0,
        data: []
      };
    }
  }
  
  /**
   * 创建新商品
   * @param {Object} productData - 商品数据
   * @returns {Promise<Product>} - 创建的商品
   */
  async createProduct(productData: {
    merchantId: string;
    name: string;
    description?: string;
    price: number;
    originalPrice?: number;
    images?: string[];
    thumbnail?: string;
    category: string;
    tags?: string[];
    stock: number;
    specifications?: Array<{
      name: string;
      values: string[];
    }>;
  }): Promise<Product> {
    try {
      const endpoint = `${API_PATHS.MERCHANT.PRODUCTS}/create/${productData.merchantId}`;
      const response = await apiClient.post(endpoint, productData);
      
      return response.data;
    } catch (error) {
      console.error('创建商品失败:', error);
      throw error;
    }
  }
  
  /**
   * 上传商品图片
   * @param {Object} options - 上传选项
   * @returns {Promise<string[]>} - 上传后的图片URL列表
   */
  async uploadProductImages(options: {
    merchantId: string;
    images: FormData;
  }): Promise<string[]> {
    try {
      const { merchantId, images } = options;
      
      const endpoint = `${API_PATHS.MERCHANT.PRODUCTS}/upload-images/${merchantId}`;
      const response = await apiClient.post(endpoint, images, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.imageUrls;
    } catch (error) {
      console.error('上传商品图片失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新商品
   * @param {Object} options - 更新选项
   * @returns {Promise<Product>} - 更新后的商品
   */
  async updateProduct(options: {
    merchantId: string;
    productId: string;
    data: Partial<Product>;
  }): Promise<Product> {
    try {
      const { merchantId, productId, data } = options;
      
      const endpoint = `${API_PATHS.MERCHANT.PRODUCTS}/update/${merchantId}/${productId}`;
      const response = await apiClient.put(endpoint, data);
      
      return response.data;
    } catch (error) {
      console.error('更新商品失败:', error);
      throw error;
    }
  }
  
  /**
   * 上下架商品
   * @param {Object} options - 操作选项
   * @returns {Promise<{status: string}>} - 更新后的状态
   */
  async changeProductStatus(options: {
    merchantId: string;
    productId: string;
    status: 'on_sale' | 'off_shelf';
  }): Promise<{status: string}> {
    try {
      const { merchantId, productId, status } = options;
      
      const endpoint = `${API_PATHS.MERCHANT.PRODUCTS}/status/${merchantId}/${productId}`;
      const response = await apiClient.patch(endpoint, { status });
      
      return response.data;
    } catch (error) {
      console.error('更改商品状态失败:', error);
      throw error;
    }
  }
  
  /**
   * 删除商品
   * @param {Object} options - 操作选项
   * @returns {Promise<{success: boolean}>} - 操作结果
   */
  async deleteProduct(options: {
    merchantId: string;
    productId: string;
  }): Promise<{success: boolean}> {
    try {
      const { merchantId, productId } = options;
      
      const endpoint = `${API_PATHS.MERCHANT.PRODUCTS}/delete/${merchantId}/${productId}`;
      const response = await apiClient.delete(endpoint);
      
      return response.data;
    } catch (error) {
      console.error('删除商品失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取商家的订单列表
   * @param {Object} options - 查询选项
   * @returns {Promise<PaginatedResponse<Order>>} - 分页订单列表
   */
  async getOrders(options: {
    merchantId: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Order>> {
    try {
      const { merchantId, status, page = 1, limit = 10 } = options;
      
      const queryParams = new URLSearchParams();
      if (status) queryParams.append('status', status);
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      const endpoint = `${API_PATHS.MERCHANT.PRODUCTS}/orders/${merchantId}?${queryParams.toString()}`;
      const response = await apiClient.get(endpoint);
      
      return response.data;
    } catch (error) {
      console.error('获取订单列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取订单详情
   * @param {Object} options - 查询选项
   * @returns {Promise<{order: Order, logistics: Logistics | null}>} - 订单和物流详情
   */
  async getOrderDetail(options: {
    merchantId: string;
    orderId: string;
  }): Promise<{order: Order, logistics: Logistics | null}> {
    try {
      const { merchantId, orderId } = options;
      
      const endpoint = `${API_PATHS.MERCHANT.PRODUCTS}/orders/${merchantId}/${orderId}`;
      const response = await apiClient.get(endpoint);
      
      return response.data;
    } catch (error) {
      console.error('获取订单详情失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新订单状态
   * @param {Object} options - 操作选项
   * @returns {Promise<{success: boolean, status: string}>} - 操作结果
   */
  async updateOrderStatus(options: {
    merchantId: string;
    orderId: string;
    status: string;
  }): Promise<{success: boolean, status: string}> {
    try {
      const { merchantId, orderId, status } = options;
      
      const endpoint = `${API_PATHS.MERCHANT.PRODUCTS}/orders/status/${merchantId}/${orderId}`;
      const response = await apiClient.patch(endpoint, { status });
      
      return response.data;
    } catch (error) {
      console.error('更新订单状态失败:', error);
      throw error;
    }
  }
  
  /**
   * 订单发货
   * @param {Object} options - 操作选项
   * @returns {Promise<{success: boolean, logisticsInfo: Logistics}>} - 操作结果
   */
  async shipOrder(options: {
    merchantId: string;
    orderId: string;
    logisticsCompany: string;
    logisticsNo: string;
    contact?: string;
    remark?: string;
  }): Promise<{success: boolean, logisticsInfo: Logistics}> {
    try {
      const { merchantId, orderId, ...shipData } = options;
      
      const endpoint = `${API_PATHS.MERCHANT.PRODUCTS}/orders/ship/${merchantId}/${orderId}`;
      const response = await apiClient.post(endpoint, shipData);
      
      return response.data;
    } catch (error) {
      console.error('订单发货失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新物流信息
   * @param {Object} options - 操作选项
   * @returns {Promise<{success: boolean, logistics: Logistics}>} - 操作结果
   */
  async updateLogistics(options: {
    merchantId: string;
    orderId: string;
    logisticsCompany?: string;
    logisticsNo?: string;
    trackingInfo?: {
      time?: Date;
      description: string;
      location?: string;
    };
    remark?: string;
  }): Promise<{success: boolean, logistics: Logistics}> {
    try {
      const { merchantId, orderId, ...logisticsData } = options;
      
      const endpoint = `${API_PATHS.MERCHANT.PRODUCTS}/logistics/update/${merchantId}/${orderId}`;
      const response = await apiClient.put(endpoint, logisticsData);
      
      return response.data;
    } catch (error) {
      console.error('更新物流信息失败:', error);
      throw error;
    }
  }
  
  /**
   * 上传视频
   * @param {Object} options - 上传选项
   * @returns {Promise<{success: boolean, videoUrl: string}>} - 上传结果
   */
  async uploadVideo(options: {
    merchantId: string;
    videoFile: FormData;
    title: string;
    description?: string;
    productIds?: string[];
    tags?: string[];
  }): Promise<{success: boolean, videoUrl: string}> {
    try {
      const { merchantId, videoFile, ...videoData } = options;
      
      // 合并表单数据
      const formData = new FormData();
      formData.append('video', videoFile);
      
      // 添加其他数据
      Object.entries(videoData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // 对于数组，我们需要将每个项作为单独的条目添加
          value.forEach(item => {
            formData.append(`${key}[]`, item);
          });
        } else if (value !== undefined) {
          formData.append(key, value as string);
        }
      });
      
      const endpoint = `${API_PATHS.MERCHANT.PRODUCTS}/videos/upload/${merchantId}`;
      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('上传视频失败:', error);
      throw error;
    }
  }

  /**
   * 修改商家密码
   * @param {Object} options - 修改密码选项
   * @returns {Promise<{success: boolean; message: string}>} - 修改结果
   */
  async changePassword(options: {
    merchantId: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<{success: boolean; message: string}> {
    try {
      const { merchantId, currentPassword, newPassword } = options;
      
      const response = await apiClient.post(API_PATHS.MERCHANT.CHANGE_PASSWORD, {
        merchantId,
        currentPassword,
        newPassword
      });
      
      return {
        success: true,
        message: '密码修改成功'
      };
    } catch (error: any) {
      console.error('修改密码失败:', error);
      
      // 处理特定错误
      if (error.message === '当前密码不正确') {
        return {
          success: false,
          message: '当前密码不正确'
        };
      }
      
      throw error;
    }
  }

  /**
   * 上传商家Logo
   * @param {Object} options - 上传选项
   * @returns {Promise<{success: boolean; logoUrl: string}>} - 上传结果
   */
  async uploadLogo(options: {
    merchantId: string;
    logoBase64: string;
  }): Promise<{success: boolean; logoUrl: string}> {
    try {
      // 模拟上传过程
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟返回一个随机的Logo URL
      const timestamp = Date.now();
      const logoUrl = `https://via.placeholder.com/150/0000FF/FFFFFF?text=Logo${timestamp}`;
      
      return {
        success: true,
        logoUrl
      };
    } catch (error) {
      console.error('上传Logo失败:', error);
      throw error;
    }
  }
}

// 创建实例并导出
const merchantService = new MerchantServiceClass();
export default merchantService; 