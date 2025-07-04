/**
 * 聊天控制器
 * 处理聊天相关的API请求
 */
const chatService = require('../services/chat.service');
const ChatRoom = require('../database/ChatRoom');
const ChatMessage = require('../database/ChatMessage');
const mongoose = require('mongoose');

/**
 * 获取或创建聊天室
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getOrCreateChatRoom = async (req, res) => {
  try {
    const { userId, merchantId } = req.body;
    
    // 验证参数
    if (!userId || !merchantId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: userId, merchantId'
      });
    }
    
    // 获取或创建聊天室
    const chatRoom = await chatService.getOrCreateChatRoom(userId, merchantId);
    
    res.json({
      success: true,
      data: chatRoom
    });
  } catch (error) {
    console.error('获取聊天室错误:', error);
    res.status(500).json({
      success: false,
      message: '获取聊天室失败: ' + error.message
    });
  }
};

/**
 * 获取用户的聊天室列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getUserChatRooms = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 验证参数
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: userId'
      });
    }
    
    // 获取聊天室列表
    const chatRooms = await chatService.getUserChatRooms(userId);
    
    res.json({
      success: true,
      data: chatRooms
    });
  } catch (error) {
    console.error('获取用户聊天室列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取聊天室列表失败: ' + error.message
    });
  }
};

/**
 * 获取商家的聊天室列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getMerchantChatRooms = async (req, res) => {
  try {
    const { merchantId } = req.params;
    
    // 验证参数
    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: merchantId'
      });
    }
    
    // 获取聊天室列表
    const chatRooms = await chatService.getMerchantChatRooms(merchantId);
    
    res.json({
      success: true,
      data: chatRooms
    });
  } catch (error) {
    console.error('获取商家聊天室列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取聊天室列表失败: ' + error.message
    });
  }
};

/**
 * 获取聊天历史记录
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    
    // 验证参数
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: roomId'
      });
    }
    
    // 获取聊天历史记录
    const messages = await chatService.getChatHistory(
      roomId,
      parseInt(limit),
      parseInt(skip)
    );
    
    // 按时间升序排序（旧消息在前）
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );
    
    res.json({
      success: true,
      data: sortedMessages
    });
  } catch (error) {
    console.error('获取聊天历史记录错误:', error);
    res.status(500).json({
      success: false,
      message: '获取聊天历史记录失败: ' + error.message
    });
  }
};

/**
 * 发送消息（REST API方式，作为WebSocket的备选）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.sendMessage = async (req, res) => {
  try {
    const { roomId, senderId, senderType, content, receiverId, messageType = 'text', metadata = {} } = req.body;
    
    // 验证参数
    if (!roomId || !senderId || !content || !receiverId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // 确定接收者类型
    const receiverType = senderType === 'user' ? 'merchant' : 'user';
    
    // 创建消息
    const message = new ChatMessage({
      messageId: ChatMessage.generateMessageId(),
      roomId,
      senderId: mongoose.Types.ObjectId(senderId),
      senderType,
      receiverId: mongoose.Types.ObjectId(receiverId),
      receiverType,
      content,
      messageType,
      metadata
    });
    
    // 保存消息
    await message.save();
    
    // 更新聊天室的最后一条消息和未读计数
    const updateData = {
      lastMessage: {
        content,
        senderId,
        senderType,
        timestamp: new Date()
      }
    };
    
    // 更新未读计数
    if (senderType === 'user') {
      updateData.$inc = { 'unreadCount.merchant': 1 };
    } else {
      updateData.$inc = { 'unreadCount.user': 1 };
    }
    
    // 更新聊天室
    await ChatRoom.findOneAndUpdate({ roomId }, updateData);
    
    // 如果有WebSocket连接，通过WebSocket发送通知
    const io = req.app.get('io');
    if (io) {
      // 发送给接收方
      io.to(`${receiverType}_${receiverId}`).emit('new_message', message);
      
      // 发送通知
      io.to(`${receiverType}_${receiverId}`).emit('notification', {
        type: 'new_message',
        roomId,
        senderId,
        senderType,
        message: content
      });
    }
    
    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('发送消息错误:', error);
    res.status(500).json({
      success: false,
      message: '发送消息失败: ' + error.message
    });
  }
};

/**
 * 标记消息为已读（REST API方式）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.markAsRead = async (req, res) => {
  try {
    const { roomId, readerId, readerType } = req.body;
    
    // 验证参数
    if (!roomId || !readerId || !readerType) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // 更新未读消息计数
    if (readerType === 'user') {
      await ChatRoom.findOneAndUpdate(
        { roomId, 'userId': mongoose.Types.ObjectId(readerId) },
        { $set: { 'unreadCount.user': 0 } }
      );
      
      // 更新消息状态
      await ChatMessage.updateMany(
        { 
          roomId,
          receiverId: mongoose.Types.ObjectId(readerId),
          receiverType: 'user',
          isRead: false
        },
        { $set: { isRead: true, status: 'read' } }
      );
    } else if (readerType === 'merchant') {
      await ChatRoom.findOneAndUpdate(
        { roomId, 'merchantId': mongoose.Types.ObjectId(readerId) },
        { $set: { 'unreadCount.merchant': 0 } }
      );
      
      // 更新消息状态
      await ChatMessage.updateMany(
        { 
          roomId,
          receiverId: mongoose.Types.ObjectId(readerId),
          receiverType: 'merchant',
          isRead: false
        },
        { $set: { isRead: true, status: 'read' } }
      );
    }
    
    // 如果有WebSocket连接，通过WebSocket发送通知
    const io = req.app.get('io');
    if (io) {
      // 通知聊天室内的其他成员
      io.to(roomId).emit('messages_read', {
        roomId,
        readerId,
        readerType
      });
    }
    
    res.json({
      success: true,
      message: '消息已标记为已读'
    });
  } catch (error) {
    console.error('标记消息已读错误:', error);
    res.status(500).json({
      success: false,
      message: '标记消息已读失败: ' + error.message
    });
  }
};

/**
 * 获取用户未读消息数量
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getUserUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 验证参数
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: userId'
      });
    }
    
    // 获取未读消息数量
    const unreadCount = await chatService.getUserUnreadCount(userId);
    
    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('获取未读消息数量错误:', error);
    res.status(500).json({
      success: false,
      message: '获取未读消息数量失败: ' + error.message
    });
  }
};

/**
 * 获取商家未读消息数量
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getMerchantUnreadCount = async (req, res) => {
  try {
    const { merchantId } = req.params;
    
    // 验证参数
    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: merchantId'
      });
    }
    
    // 获取未读消息数量
    const unreadCount = await chatService.getMerchantUnreadCount(merchantId);
    
    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('获取未读消息数量错误:', error);
    res.status(500).json({
      success: false,
      message: '获取未读消息数量失败: ' + error.message
    });
  }
}; 