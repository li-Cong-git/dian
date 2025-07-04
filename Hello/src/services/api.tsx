/**
 * API服务配置
 * 统一管理前端对后端的API请求
 */
// @ts-ignore
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
// @ts-ignore
import AsyncStorage from '@react-native-async-storage/async-storage';
// 导入环境配置
import env from '../config/env';

// 基础配置
const BASE_URL = env.apiBaseUrl; // 使用环境配置中的API基础URL
const API_TIMEOUT = env.config.apiTimeout; // 使用环境配置中的超时时间

console.log('=== API配置信息 ===');
console.log('API基础URL:', BASE_URL);
console.log('API超时时间:', API_TIMEOUT);
console.log('当前环境:', env.isDevelopment ? 'development' : env.isTesting ? 'testing' : env.isProduction ? 'production' : 'custom');

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`=== 发送请求 ===`);
    console.log(`${config.method?.toUpperCase()} ${fullUrl}`);
    console.log('请求头:', JSON.stringify(config.headers));
    
    if (config.data) {
      console.log('请求数据:', JSON.stringify(config.data));
    }
    
    // 从AsyncStorage获取token
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('添加认证令牌到请求头');
      }
    } catch (error) {
      console.error('获取token失败:', error);
    }
    return config;
  },
  (error: any) => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`=== 请求成功 ===`);
    console.log(`${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log('状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data).substring(0, 200) + '...');
    return response.data;
  },
  async (error: any) => {
    console.error(`=== 请求失败 ===`);
    
    if (error.config) {
      console.error(`${error.config.method?.toUpperCase()} ${error.config.url}`);
    }
    
    // 网络错误处理
    if (error.message && error.message.includes('Network Error')) {
      console.error('网络连接错误详情:');
      console.error('- 错误消息:', error.message);
      console.error('- 请求配置:', JSON.stringify(error.config));
      console.error('请检查网络设置、后端服务是否正常运行、IP地址和端口是否正确');
      
      // 尝试使用fetch API作为备份
      if (error.config) {
        try {
          console.log('尝试使用fetch API作为备份...');
          const { method, url, data, headers, baseURL } = error.config;
          const fullUrl = `${baseURL || ''}${url}`;
          
          console.log(`Fetch请求: ${method?.toUpperCase()} ${fullUrl}`);
          
          const fetchResponse = await fetch(fullUrl, {
            method: method?.toUpperCase() || 'GET',
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: data ? JSON.stringify(data) : undefined
          });
          
          if (fetchResponse.ok) {
            const responseData = await fetchResponse.json();
            console.log('Fetch请求成功:', responseData);
            return responseData;
          } else {
            console.error('Fetch请求失败:', fetchResponse.status, fetchResponse.statusText);
          }
        } catch (fetchError) {
          console.error('Fetch备份请求也失败:', fetchError);
        }
      }
      
      return Promise.reject({
        ...error,
        message: '网络连接错误，请检查网络设置或后端服务是否正常运行'
      });
    }
    
    // 超时错误处理
    if (error.code === 'ECONNABORTED') {
      console.error('请求超时详情:');
      console.error('- 超时设置:', API_TIMEOUT, 'ms');
      console.error('- 请求配置:', JSON.stringify(error.config));
      return Promise.reject({
        ...error,
        message: '请求超时，请稍后重试'
      });
    }
    
    // 处理401未授权错误
    if (error.response && error.response.status === 401) {
      console.error('未授权访问，需要重新登录');
      // 清除登录状态
      try {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('user_info');
      } catch (storageError) {
        console.error('清除登录状态失败:', storageError);
      }
    }
    
    // 其他HTTP错误处理
    if (error.response) {
      console.error('HTTP错误详情:');
      console.error('- 状态码:', error.response.status);
      console.error('- 响应数据:', JSON.stringify(error.response.data));
      return Promise.reject({
        ...error,
        message: error.response.data?.message || `HTTP错误: ${error.response.status}`
      });
    }
    
    return Promise.reject(error);
  }
);

// API路径
const API_PATHS = {
  // 用户相关
  USER: {
    REGISTER: '/users/register',
    LOGIN: '/users/login',
    PROFILE: '/users/profile/get',
    UPDATE_PROFILE: '/users/profile/update',
    ADDRESS: '/users/address/manage',
    SEND_VERIFICATION_CODE: '/users/password/send-code',
    RESET_PASSWORD: '/users/password/reset'
  },
  // 商家相关
  MERCHANT: {
    REGISTER: '/merchants/register',
    LOGIN: '/merchants/login',
    PROFILE: '/merchants/profile/get',
    UPDATE_PROFILE: '/merchants/profile/update',
    PRODUCTS: '/merchants/products/manage',
    CHANGE_PASSWORD: '/merchants/password/change',
    UPLOAD_LOGO: '/merchants/logo/upload'
  },
  // 商品相关
  PRODUCT: {
    LIST: '/products/list',
    DETAIL: '/products/detail',
    SEARCH: '/products/search',
    CATEGORIES: '/merchants/categories'
  },
  // 订单相关
  ORDER: {
    CREATE: '/orders/create',
    LIST: '/orders/list',
    DETAIL: '/orders/detail',
    CANCEL: '/orders/cancel',
    PAY: '/orders/pay',
    SHIP: '/orders/ship',
    CONFIRM: '/orders/confirm',
    COMPLETE: '/orders/complete',
    MERCHANT: {
      LIST: '/orders/list',
      STATS: '/orders/merchant/stats'
    }
  },
  // 购物车相关
  CART: {
    ADD: '/cart/add',
    UPDATE: '/cart/update',
    REMOVE: '/cart/remove',
    LIST: '/cart/list',
    CLEAR: '/cart/clear'
  },
  // 物流相关
  LOGISTICS: {
    TRACK: '/logistics/track'
  },
  // 语音助手相关
  SPEECH: {
    RECOGNIZE: '/speech/recognize',
    SYNTHESIZE: '/speech/coze-to-speech',
    AUDIO: '/speech/audio'
  },
  // Coze工作流相关
  COZE: {
    EXECUTE: '/coze/execute',
    EXECUTE_WORKFLOW: '/coze/execute',
    INFO: '/coze/info'
  }
};

// 导出API客户端和路径
export { apiClient, API_PATHS };

// 默认导出
export default {
  apiClient,
  API_PATHS
}; 