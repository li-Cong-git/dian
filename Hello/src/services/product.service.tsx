/**
 * 商品服务
 * 实现与后端商品API的交互
 */
import { apiClient, API_PATHS } from './api';

// 定义类型
interface ProductParams {
  page?: number;
  limit?: number;
  category?: string;
  sort?: string;
  order?: string;
}

interface SearchParams {
  keyword: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

interface ProductDetailParams {
  productId: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: any;
}

/**
 * 商品服务类
 */
class ProductService {
  /**
   * 获取商品列表
   * @param {ProductParams} params - 查询参数
   * @returns {Promise<ApiResponse>} - 商品列表
   */
  async getProducts(params: ProductParams = {}): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.PRODUCT.LIST, params);
      return response;
    } catch (error) {
      console.error('获取商品列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取商品详情
   * @param {string} productId - 商品ID
   * @returns {Promise<ApiResponse>} - 商品详情
   */
  async getProductDetail(productId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.PRODUCT.DETAIL, { productId });
      return response;
    } catch (error) {
      console.error('获取商品详情失败:', error);
      throw error;
    }
  }

  /**
   * 搜索商品
   * @param {SearchParams} params - 搜索参数
   * @returns {Promise<ApiResponse>} - 搜索结果
   */
  async searchProducts(params: SearchParams): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.PRODUCT.SEARCH, params);
      return response;
    } catch (error) {
      console.error('搜索商品失败:', error);
      throw error;
    }
  }

  /**
   * 获取热门商品
   * @param {number} limit - 数量限制
   * @returns {Promise<ApiResponse>} - 热门商品列表
   */
  async getHotProducts(limit: number = 10): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.PRODUCT.LIST, {
        sort: 'sold',
        order: 'desc',
        limit
      });
      return response;
    } catch (error) {
      console.error('获取热门商品失败:', error);
      throw error;
    }
  }

  /**
   * 获取新品
   * @param {number} limit - 数量限制
   * @returns {Promise<ApiResponse>} - 新品列表
   */
  async getNewProducts(limit: number = 10): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.PRODUCT.LIST, {
        sort: 'createdAt',
        order: 'desc',
        limit
      });
      return response;
    } catch (error) {
      console.error('获取新品失败:', error);
      throw error;
    }
  }

  /**
   * 获取商品分类列表
   * @returns {Promise<ApiResponse>} - 分类列表
   */
  async getCategories(): Promise<ApiResponse> {
    try {
      const response = await apiClient.get('/merchants/categories');
      return response;
    } catch (error) {
      console.error('获取分类列表失败:', error);
      throw error;
    }
  }
}

export default new ProductService(); 