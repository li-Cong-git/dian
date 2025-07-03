/**
 * 环境配置文件
 * 用于管理不同环境下的API端点等配置
 */

// 定义不同环境的API基础URL
const API_BASE_URL = {
  // 本地开发环境
  development: 'http://localhost:3000/api/v1',
  // 模拟器环境 - Android模拟器通过10.0.2.2访问宿主机
  emulator: 'http://10.0.2.2:3000/api/v1',
  // 使用宿主机实际IP地址 - 适用于某些网络配置下的模拟器
  hostIp: 'http://192.168.145.116:3000/api/v1',
  // 测试环境
  testing: 'https://api-test.goshop.com/api/v1',
  // 生产环境
  production: 'https://api.goshop.com/api/v1',
};

// 当前环境
// 根据构建或运行时环境变量设置，默认为使用宿主机IP的环境
const CURRENT_ENV = process.env.NODE_ENV || 'hostIp';

// 判断是否在模拟器中运行的函数
const isRunningInEmulator = () => {
  // 在实际应用中，可以添加更多的检测逻辑
  return true; // 当前默认为模拟器环境
};

// 获取当前应该使用的API基础URL
const getApiBaseUrl = () => {
  // 如果在模拟器中运行，使用宿主机IP环境的URL
  if (isRunningInEmulator()) {
    return API_BASE_URL.hostIp;
  }
  // 否则根据环境变量选择URL
  return API_BASE_URL[CURRENT_ENV as keyof typeof API_BASE_URL] || API_BASE_URL.development;
};

// 导出配置
export default {
  // API基础URL
  apiBaseUrl: getApiBaseUrl(),
  
  // 是否为开发环境
  isDevelopment: CURRENT_ENV === 'development',
  
  // 是否为测试环境
  isTesting: CURRENT_ENV === 'testing',
  
  // 是否为生产环境
  isProduction: CURRENT_ENV === 'production',
  
  // 其他环境配置
  config: {
    // 请求超时时间(毫秒)
    apiTimeout: 10000,
    
    // 上传文件路径
    uploadPath: '/uploads',
    
    // 是否启用日志
    enableLog: CURRENT_ENV !== 'production',
    
    // 语音助手配置
    voiceAssistant: {
      // 语音识别超时时间(毫秒)
      recognizeTimeout: 30000,
      // 语音合成超时时间(毫秒)
      synthesizeTimeout: 30000,
    },
    
    // Coze工作流配置
    coze: {
      // 请求超时时间(毫秒)
      timeout: 30000,
    },
  }
}; 