/**
 * Coze工作流服务
 * 负责与Coze API的直接交互
 */
const axios = require('axios');
const config = require('../config/coze.config');

/**
 * 执行Coze工作流
 * @param {Object} inputs - 工作流输入参数
 * @returns {Promise<Object>} 工作流执行结果
 */
exports.executeWorkflow = async (inputs) => {
  try {
    // 构建请求URL - 根据Coze API文档调整
    const apiUrl = `${config.BASE_URL}/space/${config.COZE_SPACE_ID}/bot/${config.COZE_BOT_ID}/chat`;
    
    // 构建请求头 - 根据Coze API文档调整
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.COZE_API_KEY}`,
      // 可能需要其他请求头，如API版本等
    };
    
    console.log('正在调用Coze API:', apiUrl);
    console.log('请求参数:', JSON.stringify(inputs, null, 2));
    
    // 准备请求数据 - 更新为正确的请求格式
    const requestData = {
      messages: [
        {
          role: 'user',
          content: inputs.userQuery || ''
        }
      ],
      stream: false,
      user_id: 'user_' + Date.now()
    };
    
    // 发送请求执行工作流
    const response = await axios.post(apiUrl, requestData, { 
      headers,
      timeout: config.TIMEOUT_MS // 设置超时时间
    });
    
    console.log('Coze API响应状态:', response.status);
    
    // 返回工作流执行结果
    return response.data;
  } catch (error) {
    console.error('Coze工作流执行失败:', error);
    
    // 处理不同类型的错误
    if (error.response) {
      // 服务器响应了错误状态码
      console.error('错误响应数据:', error.response.data);
      console.error('错误响应状态:', error.response.status);
      console.error('错误响应头:', error.response.headers);
      throw new Error(`Coze API错误: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('未收到响应的请求:', error.request);
      throw new Error('无法连接到Coze API服务器');
    } else {
      // 请求设置出错
      console.error('请求配置错误:', error.message);
      throw new Error(`请求配置错误: ${error.message}`);
    }
  }
};

/**
 * 获取Coze工作流信息
 * @returns {Promise<Object>} 工作流信息
 */
exports.getWorkflowInfo = async () => {
  try {
    // 构建请求URL - 根据Coze API文档调整
    const apiUrl = `${config.BASE_URL}/space/${config.COZE_SPACE_ID}/bot/${config.COZE_BOT_ID}`;
    
    // 构建请求头 - 根据Coze API文档调整
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.COZE_API_KEY}`,
      // 可能需要其他请求头，如API版本等
    };
    
    console.log('正在获取Coze机器人信息:', apiUrl);
    
    // 发送请求获取工作流信息
    const response = await axios.get(apiUrl, { 
      headers,
      timeout: config.TIMEOUT_MS // 设置超时时间
    });
    
    console.log('Coze机器人信息API响应状态:', response.status);
    
    // 返回工作流信息
    return response.data;
  } catch (error) {
    console.error('获取Coze机器人信息失败:', error);
    
    // 处理不同类型的错误
    if (error.response) {
      console.error('错误响应数据:', error.response.data);
      console.error('错误响应状态:', error.response.status);
      throw new Error(`Coze API错误: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('未收到响应的请求:', error.request);
      throw new Error('无法连接到Coze API服务器');
    } else {
      console.error('请求配置错误:', error.message);
      throw new Error(`请求配置错误: ${error.message}`);
    }
  }
}; 