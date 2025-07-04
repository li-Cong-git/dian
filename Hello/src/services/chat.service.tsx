/**
 * 聊天服务
 * 提供聊天相关API请求
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/env';
import { apiGet, apiPost, apiPut } from '../utils/apiUtils';
import { ChatMessage, ChatRoom } from '../contexts/ChatContext';

/**
 * 聊天服务类
 */
class ChatService {
  /**
   * 创建或获取聊天室
   * @param {string} userId - 用户ID
   * @param {string} merchantId - 商家ID
   * @returns {Promise<ChatRoom>} 聊天室信息
   */
  async getOrCreateChatRoom(userId: string, merchantId: string) {
    try {
      const url = `${API_BASE_URL}/api/v1/chat/room`;
      console.log('创建/获取聊天室, 用户ID:', userId, '商家ID:', merchantId);
      const response = await apiPost(url, { userId, merchantId });
      console.log('聊天室响应:', response);
      
      return response;
    } catch (error) {
      console.error('获取/创建聊天室失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取用户的聊天室列表
   * @param {string} userId - 用户ID
   * @returns {Promise<ChatRoom[]>} 聊天室列表
   */
  async getUserChatRooms(userId: string) {
    try {
      const url = `${API_BASE_URL}/api/v1/chat/user/${userId}`;
      console.log('获取用户聊天室列表, 用户ID:', userId);
      const response = await apiGet(url);
      console.log('获取到用户聊天室:', response?.data?.length || 0, '个');
      
      return response;
    } catch (error) {
      console.error('获取用户聊天室列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取商家的聊天室列表
   * @param {string} merchantId - 商家ID
   * @returns {Promise<ChatRoom[]>} 聊天室列表
   */
  async getMerchantChatRooms(merchantId: string) {
    try {
      const url = `${API_BASE_URL}/api/v1/chat/merchant/${merchantId}`;
      console.log('获取商家聊天室列表, 商家ID:', merchantId);
      const response = await apiGet(url);
      console.log('获取到商家聊天室:', response?.data?.length || 0, '个');
      
      return response;
    } catch (error) {
      console.error('获取商家聊天室列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取聊天历史记录
   * @param {string} roomId - 聊天室ID
   * @param {number} limit - 消息数量限制
   * @param {number} skip - 跳过的消息数量
   * @returns {Promise<ChatMessage[]>} 消息列表
   */
  async getChatHistory(roomId: string, limit: number = 50, skip: number = 0) {
    try {
      const url = `${API_BASE_URL}/api/v1/chat/history/${roomId}?limit=${limit}&skip=${skip}`;
      console.log('获取聊天历史, 聊天室ID:', roomId);
      const response = await apiGet(url);
      console.log('获取到聊天消息:', response?.data?.length || 0, '条');
      
      return response;
    } catch (error) {
      console.error('获取聊天历史记录失败:', error);
      throw error;
    }
  }
  
  /**
   * 发送消息（REST API方式，作为WebSocket的备选）
   * @param {string} roomId - 聊天室ID
   * @param {string} senderId - 发送者ID
   * @param {string} senderType - 发送者类型
   * @param {string} content - 消息内容
   * @param {string} receiverId - 接收者ID
   * @param {string} messageType - 消息类型
   * @param {any} metadata - 附加数据
   * @returns {Promise<ChatMessage>} 发送的消息
   */
  async sendMessage(
    roomId: string,
    senderId: string,
    senderType: 'user' | 'merchant',
    content: string,
    receiverId: string,
    messageType: string = 'text',
    metadata: any = {}
  ) {
    try {
      const url = `${API_BASE_URL}/api/v1/chat/message`;
      console.log('发送消息:', content, '到聊天室:', roomId);
      const response = await apiPost(url, {
        roomId,
        senderId,
        senderType,
        content,
        receiverId,
        messageType,
        metadata
      });
      console.log('消息发送成功:', response?.data);
      
      return response;
    } catch (error) {
      console.error('发送消息失败:', error);
      throw error;
    }
  }
  
  /**
   * 标记消息为已读
   * @param {string} roomId - 聊天室ID
   * @param {string} readerId - 阅读者ID
   * @param {string} readerType - 阅读者类型
   * @returns {Promise<void>} 操作结果
   */
  async markAsRead(roomId: string, readerId: string, readerType: 'user' | 'merchant') {
    try {
      const url = `${API_BASE_URL}/api/v1/chat/read`;
      console.log('标记消息已读, 聊天室:', roomId, '读者:', readerId);
      const response = await apiPost(url, { roomId, readerId, readerType });
      
      return response;
    } catch (error) {
      console.error('标记消息已读失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取用户未读消息数量
   * @param {string} userId - 用户ID
   * @returns {Promise<number>} 未读消息数量
   */
  async getUserUnreadCount(userId: string) {
    try {
      const url = `${API_BASE_URL}/api/v1/chat/unread/user/${userId}`;
      console.log('获取用户未读消息数量, 用户ID:', userId);
      const response = await apiGet(url);
      console.log('用户未读消息数量:', response?.data?.unreadCount || 0);
      
      return response?.data?.unreadCount || 0;
    } catch (error) {
      console.error('获取用户未读消息数量失败:', error);
      return 0;
    }
  }
  
  /**
   * 获取商家未读消息数量
   * @param {string} merchantId - 商家ID
   * @returns {Promise<number>} 未读消息数量
   */
  async getMerchantUnreadCount(merchantId: string) {
    try {
      const url = `${API_BASE_URL}/api/v1/chat/unread/merchant/${merchantId}`;
      console.log('获取商家未读消息数量, 商家ID:', merchantId);
      const response = await apiGet(url);
      console.log('商家未读消息数量:', response?.data?.unreadCount || 0);
      
      return response?.data?.unreadCount || 0;
    } catch (error) {
      console.error('获取商家未读消息数量失败:', error);
      return 0;
    }
  }
}

// 导出实例
export default new ChatService(); 