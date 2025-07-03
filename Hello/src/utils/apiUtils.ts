/**
 * API工具函数
 * 提供统一的API响应处理逻辑
 */

// Coze响应格式类型定义
interface CozeResponseContent {
  type: string;
  text?: string;
  [key: string]: any;
}

interface CozeResponseMessage {
  content: string | CozeResponseContent[];
  role: string;
}

interface CozeResponseData {
  message?: CozeResponseMessage;
  messages?: CozeResponseMessage[];
  output?: string;
  [key: string]: any;
}

/**
 * 处理Coze响应数据
 * 统一处理不同格式的Coze响应
 * @param {any} response - 原始响应数据
 * @returns {string} 提取的文本内容
 */
export const extractCozeResponseText = (response: any): string => {
  if (!response) {
    return '';
  }

  // 处理字符串类型响应
  if (typeof response === 'string') {
    return response;
  }

  try {
    // 处理新格式 - message.content
    if (response.message && response.message.content) {
      const content = response.message.content;
      // 处理字符串格式的content
      if (typeof content === 'string') {
        return content;
      }
      // 处理数组格式的content
      else if (Array.isArray(content)) {
        return content
          .filter(item => item.type === 'text' && item.text)
          .map(item => item.text)
          .join('\n');
      }
    }
    
    // 处理旧格式 - data.output 或 output
    else if (response.data && response.data.output) {
      return response.data.output;
    } 
    else if (response.output) {
      return response.output;
    }
    
    // 处理响应本身是数组的情况
    else if (Array.isArray(response)) {
      return response
        .filter(item => typeof item === 'string' || (item.type === 'text' && item.text))
        .map(item => typeof item === 'string' ? item : item.text)
        .join('\n');
    }
    
    // 如果无法提取，则返回JSON字符串
    return JSON.stringify(response);
    
  } catch (error) {
    console.error('提取Coze响应文本出错:', error);
    // 如果处理失败，则返回原始响应的字符串表示
    return typeof response === 'object' ? JSON.stringify(response) : String(response);
  }
};

/**
 * 统一处理API响应错误
 * @param {any} error - 错误对象
 * @returns {string} 格式化的错误消息
 */
export const formatApiError = (error: any): string => {
  if (!error) {
    return '未知错误';
  }

  // 处理Axios错误
  if (error.response) {
    // 服务器响应了错误状态码
    const serverError = error.response.data;
    if (serverError && serverError.message) {
      return serverError.message;
    }
    return `服务器错误 (${error.response.status}): ${error.response.statusText || '请稍后再试'}`;
  } 
  else if (error.request) {
    // 请求已发出但没有收到响应
    return '无法连接到服务器，请检查网络连接';
  } 
  else if (error.message) {
    // 其他错误
    return error.message;
  }
  
  // 未知错误
  return '发生未知错误';
};

/**
 * 检查API响应是否成功
 * @param {any} response - API响应
 * @returns {boolean} 是否成功
 */
export const isSuccessResponse = (response: any): boolean => {
  if (!response) return false;
  
  // 直接检查success字段
  if (response.success === true) return true;
  
  // 检查status字段
  if (response.status === 'success' || response.status === 200) return true;
  
  // 检查code字段
  if (response.code === 0 || response.code === 200) return true;
  
  // 默认假定有data字段且无错误信息时为成功
  return !!response.data && !response.error && !response.message;
}; 