/**
 * 身份验证上下文
 * 提供全局的用户身份验证状态和方法
 */
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
// @ts-ignore
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, API_PATHS } from '../services/api';

// 用户角色枚举
export enum ROLES {
  USER = 'user',
  MERCHANT = 'merchant',
  ADMIN = 'admin'
}

// 用户信息类型
interface UserInfo {
  _id: string;
  username: string;
  role: ROLES;
  token?: string;
  // 商家特有字段
  accountName?: string;
  name?: string; // 店铺名称
  [key: string]: any;
}

// API响应类型
interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  [key: string]: any;
}

// 注册/登录响应类型
interface AuthResponse {
  success: boolean;
  error?: string;
  data?: any;
}

// 认证上下文类型
interface AuthContextType {
  isAuthenticated: boolean;
  user: UserInfo | null;
  role: ROLES | null;
  login: (credentials: { username: string; password: string }, userType?: ROLES) => Promise<AuthResponse>;
  register: (userData: any, userType?: ROLES) => Promise<AuthResponse>;
  merchantRegister: (merchantData: any) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

// 创建上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证上下文提供者属性类型
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 认证上下文提供者组件
 * @param {Object} props - 组件属性
 * @returns {JSX.Element} - 上下文提供者组件
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // 状态
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [role, setRole] = useState<ROLES | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化 - 检查本地存储的认证信息
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userInfoStr = await AsyncStorage.getItem('user_info');
        const token = await AsyncStorage.getItem('auth_token');
        
        if (userInfoStr && token) {
          const userInfo = JSON.parse(userInfoStr);
          setUser(userInfo);
          setRole(userInfo.role);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('检查认证状态错误:', err);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  /**
   * 用户登录
   * @param {Object} credentials - 包含用户名和密码的对象
   * @param {ROLES} userType - 用户类型，默认为USER
   * @returns {Promise<AuthResponse>} - 登录结果
   */
  const login = async (
    credentials: { username: string; password: string },
    userType: ROLES = ROLES.USER
  ): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('尝试登录:', credentials.username, '类型:', userType);
      
      // 根据用户类型选择登录端点
      const endpoint = userType === ROLES.MERCHANT 
        ? API_PATHS.MERCHANT.LOGIN 
        : API_PATHS.USER.LOGIN;
      
      // 调用登录API
      // 对于商家登录，将username参数转换为accountName
      const loginData = userType === ROLES.MERCHANT
        ? { accountName: credentials.username, password: credentials.password }
        : credentials;
      
      const response = await apiClient.post(endpoint, loginData) as ApiResponse;
      
      console.log('登录响应:', response);
      
      if (response.success) {
        // 从响应中获取用户数据和token
        // 适应新的响应格式 {user: userObject, token: tokenString}
        const userData = response.data.user || response.data;
        const token = response.data.token || `temp_token_${Date.now()}`;
        
        // 确保设置正确的角色
        userData.role = userType;
        
        console.log('解析的用户数据:', userData);
        console.log('解析的token:', token);
        console.log('设置用户角色为:', userType);
        
        try {
          // 保存认证信息
          await AsyncStorage.setItem('auth_token', token);
          await AsyncStorage.setItem('user_info', JSON.stringify(userData));
          
          // 更新状态
          setUser(userData);
          setRole(userData.role);
          setIsAuthenticated(true);
          
          return {
            success: true,
            data: userData
          };
        } catch (storageError) {
          console.error('保存认证信息错误:', storageError);
          // 即使保存失败，也返回登录成功，但记录错误
          setUser(userData);
          setRole(userData.role);
          setIsAuthenticated(true);
          
          return {
            success: true,
            data: userData,
            error: '登录成功，但保存认证信息失败'
          };
        }
      } else {
        setError(response.message || '登录失败');
        return {
          success: false,
          error: response.message || '登录失败'
        };
      }
    } catch (err: any) {
      console.error('登录错误:', err);
      
      // 处理网络错误
      let errorMsg = '登录过程中发生错误';
      if (err.message && err.message.includes('网络连接错误')) {
        errorMsg = '网络连接错误，请检查网络设置或后端服务是否正常运行';
      } else {
        errorMsg = err.message || '登录过程中发生错误';
      }
      
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * 用户注册
   * @param {Object} userData - 用户数据
   * @param {ROLES} userType - 用户类型，默认为普通用户
   * @returns {Promise<AuthResponse>} - 注册结果，包含success和可能的error
   */
  const register = async (userData: any, userType: ROLES = ROLES.USER): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('尝试注册用户:', userData.username, '类型:', userType);
      
      // 根据用户类型选择注册端点
      const endpoint = userType === ROLES.MERCHANT ? API_PATHS.MERCHANT.REGISTER : API_PATHS.USER.REGISTER;
      
      // 调用注册API
      const response = await apiClient.post(endpoint, userData) as ApiResponse;
      
      console.log('注册响应:', response);
      
      if (response.success) {
        return {
          success: true,
          data: response.data
        };
      } else {
        const errorMsg = response.message || '注册失败';
        setError(errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }
    } catch (err: any) {
      console.error('注册错误:', err);
      
      let errorMsg = '注册过程中发生错误';
      
      // 处理网络错误
      if (err.message && err.message.includes('网络连接错误')) {
        errorMsg = '网络连接错误，请检查网络设置或后端服务是否正常运行';
      } else if (err.response && err.response.status === 400) {
        // 处理400错误，通常是用户输入问题
        errorMsg = err.response.data?.message || '注册信息有误，请检查后重试';
      } else {
        errorMsg = err.message || '注册过程中发生错误';
      }
      
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 商家注册
   * @param {Object} merchantData - 商家数据
   * @returns {Promise<AuthResponse>} - 注册结果，包含success和可能的error
   */
  const merchantRegister = async (merchantData: any): Promise<AuthResponse> => {
    // 确保设置正确的商家角色
    return register(merchantData, ROLES.MERCHANT);
  };

  /**
   * 用户登出
   */
  const logout = async (): Promise<void> => {
    try {
      // 清除本地存储的认证信息
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_info');
      
      // 更新状态
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('登出错误:', err);
    }
  };

  // 提供上下文值
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    role,
    login,
    register,
    merchantRegister,
    logout,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 使用认证上下文的自定义Hook
 * @returns {AuthContextType} - 认证上下文
 * @throws {Error} - 如果在AuthProvider之外使用，将抛出错误
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider内使用');
  }
  return context;
}; 