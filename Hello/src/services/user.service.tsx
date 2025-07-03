/**
 * 用户服务
 * 实现用户登录、注册、个人信息管理等功能
 */
import { apiClient, API_PATHS } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROLES } from '../contexts/AuthContext';

// Token存储键名
const TOKEN_KEY = 'auth_token';
const USER_INFO_KEY = 'user_info';

// 定义类型
interface UserData {
  username: string;
  password: string;
  phone: string;
  email?: string;
  nickname?: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface UserInfo {
  _id: string;
  username: string;
  token?: string;
  role?: ROLES;
  [key: string]: any;
}

interface ProfileData {
  userId: string;
  [key: string]: any;
}

interface AddressData {
  userId: string;
  addressId?: string;
  [key: string]: any;
}

interface CartItem {
  userId: string;
  productId: string;
  quantity: number;
  [key: string]: any;
}

interface CartRemoveData {
  userId: string;
  productId: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: any;
}

/**
 * 用户服务类
 */
class UserService {
  /**
   * 用户注册
   * @param {UserData} userData - 用户注册数据
   * @returns {Promise<ApiResponse>} - 注册结果
   */
  async register(userData: UserData): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.USER.REGISTER, userData);
      return response;
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  }

  /**
   * 用户登录
   * @param {LoginCredentials} credentials - 登录凭证
   * @returns {Promise<ApiResponse>} - 登录结果
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.USER.LOGIN, credentials);
      
      if (response.success && response.data) {
        // 存储用户信息
        await this.setUserInfo(response.data);
      }
      
      return response;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  /**
   * 退出登录
   * @returns {Promise<ApiResponse>} - 退出登录结果
   */
  async logout(): Promise<ApiResponse> {
    try {
      // 清除存储的用户数据
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_INFO_KEY);
      return { success: true, message: '已退出登录' };
    } catch (error) {
      console.error('退出登录失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户个人资料
   * @param {string} userId - 用户ID
   * @returns {Promise<ApiResponse>} - 用户资料
   */
  async getProfile(userId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.USER.PROFILE, { userId });
      return response;
    } catch (error) {
      console.error('获取用户资料失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户个人资料
   * @param {ProfileData} profileData - 用户资料数据
   * @returns {Promise<ApiResponse>} - 更新结果
   */
  async updateProfile(profileData: ProfileData): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.USER.UPDATE_PROFILE, profileData);
      
      if (response.success && response.data) {
        // 更新存储的用户信息
        const currentUser = await this.getUserInfo();
        if (currentUser && currentUser._id === profileData.userId) {
          await this.setUserInfo({
            ...currentUser,
            ...response.data
          });
        }
      }
      
      return response;
    } catch (error) {
      console.error('更新用户资料失败:', error);
      throw error;
    }
  }

  /**
   * 管理收货地址(添加、更新、删除、设置默认)
   * @param {AddressData} addressData - 地址数据
   * @param {string} action - 操作类型 (add|update|remove|setDefault)
   * @returns {Promise<ApiResponse>} - 操作结果
   */
  async manageAddress(addressData: AddressData, action: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.USER.ADDRESS, {
        ...addressData,
        action
      });
      return response;
    } catch (error) {
      console.error('管理收货地址失败:', error);
      throw error;
    }
  }

  /**
   * 获取购物车商品列表
   * @param {string} userId - 用户ID
   * @returns {Promise<ApiResponse>} - 购物车商品列表
   */
  async getCart(userId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.CART.LIST, { userId });
      return response;
    } catch (error) {
      console.error('获取购物车失败:', error);
      throw error;
    }
  }

  /**
   * 添加商品到购物车
   * @param {CartItem} cartItem - 购物车项
   * @returns {Promise<ApiResponse>} - 操作结果
   */
  async addToCart(cartItem: CartItem): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.CART.ADD, cartItem);
      return response;
    } catch (error) {
      console.error('添加到购物车失败:', error);
      throw error;
    }
  }

  /**
   * 从购物车中移除商品
   * @param {CartRemoveData} data - 移除数据
   * @returns {Promise<ApiResponse>} - 操作结果
   */
  async removeFromCart(data: CartRemoveData): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.CART.REMOVE, data);
      return response;
    } catch (error) {
      console.error('从购物车移除失败:', error);
      throw error;
    }
  }

  /**
   * 更新购物车商品数量
   * @param {CartItem} data - 更新数据
   * @returns {Promise<ApiResponse>} - 操作结果
   */
  async updateCartItem(data: CartItem): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(API_PATHS.CART.UPDATE, data);
      return response;
    } catch (error) {
      console.error('更新购物车失败:', error);
      throw error;
    }
  }

  /**
   * 存储用户信息到本地
   * @param {UserInfo} userInfo - 用户信息
   * @private
   */
  async setUserInfo(userInfo: UserInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
    } catch (error) {
      console.error('存储用户信息失败:', error);
    }
  }

  /**
   * 从本地获取用户信息
   * @returns {Promise<UserInfo|null>} - 用户信息
   */
  async getUserInfo(): Promise<UserInfo | null> {
    try {
      const userInfo = await AsyncStorage.getItem(USER_INFO_KEY);
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }

  /**
   * 检查用户是否已登录
   * @returns {Promise<boolean>} - 是否已登录
   */
  async isLoggedIn(): Promise<boolean> {
    const userInfo = await this.getUserInfo();
    return !!userInfo;
  }
}

export default new UserService(); 