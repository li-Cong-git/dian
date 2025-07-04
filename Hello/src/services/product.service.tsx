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

// API响应接口
interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: any;
  [key: string]: any;
}

// 商品图片接口
export interface ProductImage {
  url: string;
  isMain?: boolean;
}

// 商品规格接口
export interface ProductSpec {
  name: string;
  price: number;
  stock: number;
  sku?: string;
}

// 商品接口
export interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: string;
  images: string[]; // 字符串数组，每个元素是图片的URL
  thumbnail?: string;
  tags?: string[];
  sold?: number;
  status: 'on_sale' | 'off_shelf' | 'sold_out';
  specifications?: Array<{
    name: string;
    values: string[];
  }>;
  merchantId: string;
  createdAt?: string;
  updatedAt?: string;
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
      const response = await apiClient.get(API_PATHS.PRODUCT.CATEGORIES);
      return response;
    } catch (error) {
      console.error('获取分类列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取商家的商品列表
   * @param {string} merchantId - 商家ID
   * @param {Object} params - 查询参数
   * @returns {Promise<ApiResponse>} - 商品列表
   */
  async getMerchantProducts(merchantId: string, params: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    sort?: string;
    order?: string;
  } = {}): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.MERCHANT.PRODUCTS, {
        merchantId,
        action: 'list',
        ...params
      });
      return response;
    } catch (error) {
      console.error('获取商家商品列表失败:', error);
      throw error;
    }
  }

  /**
   * 添加商品
   * @param {Product} product - 商品信息
   * @returns {Promise<ApiResponse>} - 添加结果
   */
  async addProduct(product: Product): Promise<ApiResponse> {
    try {
      // 确保images是字符串数组
      const processedProduct = {
        ...product,
        images: Array.isArray(product.images) ? 
          product.images.map(img => typeof img === 'string' ? img : String(img)) : 
          []
      };
      
      console.log('正在添加商品，请求数据:', {
        action: 'add',
        product: processedProduct
      });
      
      const response = await apiClient.post(API_PATHS.MERCHANT.PRODUCTS, {
        action: 'add',
        product: processedProduct
      });
      
      console.log('添加商品响应:', response);
      return response;
    } catch (error) {
      console.error('添加商品失败:', error);
      console.error('错误详情:', JSON.stringify(error));
      throw error;
    }
  }

  /**
   * 更新商品
   * @param {string} productId - 商品ID
   * @param {Partial<Product>} productData - 需要更新的商品数据
   * @returns {Promise<ApiResponse>} - 更新结果
   */
  async updateProduct(productId: string, productData: Partial<Product>): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.MERCHANT.PRODUCTS, {
        action: 'update',
        productId,
        productData
      });
      return response;
    } catch (error) {
      console.error('更新商品失败:', error);
      throw error;
    }
  }

  /**
   * 删除商品
   * @param {string} productId - 商品ID
   * @param {string} merchantId - 商家ID
   * @returns {Promise<ApiResponse>} - 删除结果
   */
  async deleteProduct(productId: string, merchantId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.MERCHANT.PRODUCTS, {
        action: 'delete',
        productId,
        merchantId
      });
      return response;
    } catch (error) {
      console.error('删除商品失败:', error);
      throw error;
    }
  }

  /**
   * 上传商品图片
   * @param {Object} options - 上传选项
   * @returns {Promise<ApiResponse>} - 上传结果
   */
  async uploadProductImage(options: {
    productId?: string;
    merchantId: string;
    imageBase64: string;
    isMain?: boolean;
  }): Promise<ApiResponse> {
    try {
      // 模拟图片上传
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 生成随机图片URL
      const timestamp = Date.now();
      const imageUrl = `https://via.placeholder.com/500x500?text=Product${timestamp}`;
      
      return {
        success: true,
        imageUrl
      };
    } catch (error) {
      console.error('上传商品图片失败:', error);
      throw error;
    }
  }
}

export default new ProductService(); 