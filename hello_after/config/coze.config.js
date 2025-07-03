/**
 * Coze工作流配置
 * 用于配置Coze API相关参数
 */
require('dotenv').config();

// Coze API配置
const COZE_CONFIG = {
  // API密钥 - 从环境变量获取，不再硬编码
  COZE_API_KEY: process.env.COZE_API_KEY,
  
  // 空间ID - 从环境变量获取，不再硬编码
  COZE_SPACE_ID: process.env.COZE_SPACE_ID,
  
  // 机器人ID - 从环境变量获取，不再硬编码
  COZE_BOT_ID: process.env.COZE_BOT_ID,
  
  // 工作流ID - 从环境变量获取，不再硬编码
  COZE_WORKFLOW_ID: process.env.COZE_WORKFLOW_ID,
  
  // API版本
  COZE_API_VERSION: process.env.COZE_API_VERSION || 'v1',
  
  // 请求超时时间(毫秒)
  TIMEOUT_MS: parseInt(process.env.COZE_TIMEOUT_MS) || 30000,
  
  // API基础URL
  // 国际版: https://api.coze.com (支持更新的API格式，使用messages数组)
  // 中国版: https://api.coze.cn (可能使用不同的API格式，请根据实际情况调整)
  BASE_URL: process.env.COZE_BASE_URL || 'https://api.coze.com',
  
  // 默认工作流参数
  DEFAULT_PARAMS: {
    // 模型参数
    temperature: parseFloat(process.env.COZE_TEMPERATURE) || 0.7,
    top_p: parseFloat(process.env.COZE_TOP_P) || 0.95,
    max_tokens: parseInt(process.env.COZE_MAX_TOKENS) || 1000,
    
    // 上下文设置
    memory_size: parseInt(process.env.COZE_MEMORY_SIZE) || 10, // 记忆对话轮数
    
    // 响应格式
    response_format: process.env.COZE_RESPONSE_FORMAT || 'text'
  }
};

// 检查必要的配置是否存在
const validateConfig = () => {
  const requiredFields = ['COZE_API_KEY', 'COZE_SPACE_ID', 'COZE_BOT_ID', 'COZE_WORKFLOW_ID'];
  const missingFields = requiredFields.filter(field => !COZE_CONFIG[field]);
  
  if (missingFields.length > 0) {
    console.warn(`Coze配置警告: 缺少关键配置项 ${missingFields.join(', ')}。请在环境变量中提供这些值。`);
    
    // 在开发环境中，如果环境变量不存在，提供警告信息
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`请创建或更新.env文件，添加以下变量:
COZE_API_KEY=您的Coze API密钥
COZE_SPACE_ID=您的Coze空间ID
COZE_BOT_ID=您的Coze机器人ID
COZE_WORKFLOW_ID=您的Coze工作流ID`);
    }
  }
};

// 在非生产环境下验证配置
if (process.env.NODE_ENV !== 'production') {
  validateConfig();
}

module.exports = COZE_CONFIG; 