/**
 * 聊天服务
 * 提供WebSocket聊天功能和消息处理
 */
const ChatRoom = require('../database/ChatRoom');
const ChatMessage = require('../database/ChatMessage');
const User = require('../database/user');
const Merchant = require('../database/Merchant');
const mongoose = require('mongoose');

// 在线用户和商家映射表
const connectedClients = {
  users: new Map(), // userId -> socket
  merchants: new Map(), // merchantId -> socket
};

// 初始化Socket.io服务
exports.initSocketServer = (io) => {
  console.log('初始化WebSocket聊天服务...');
  
  // 中间件 - 身份验证
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('未提供认证令牌'));
      }
      
      // 从token中提取用户信息
      const userType = socket.handshake.auth.userType;
      const userId = socket.handshake.auth.userId;
      
      if (!userType || !userId) {
        return next(new Error('缺少用户类型或ID'));
      }
      
      // 将用户信息附加到socket对象
      socket.userInfo = {
        id: userId,
        type: userType // 'user' 或 'merchant'
      };
      
      next();
    } catch (error) {
      console.error('WebSocket认证错误:', error);
      next(new Error('认证失败'));
    }
  });
  
  // 连接处理
  io.on('connection', (socket) => {
    const { id: userId, type: userType } = socket.userInfo;
    
    console.log(`新的WebSocket连接: ${userType} ID=${userId}`);
    
    // 将用户添加到对应的连接表中
    if (userType === 'user') {
      connectedClients.users.set(userId, socket);
      // 加入用户私有房间
      socket.join(`user_${userId}`);
    } else if (userType === 'merchant') {
      connectedClients.merchants.set(userId, socket);
      // 加入商家私有房间
      socket.join(`merchant_${userId}`);
    }
    
    // 客户端请求加入特定聊天室
    socket.on('join_room', async (data) => {
      try {
        const { roomId } = data;
        if (!roomId) {
          socket.emit('error', { message: '缺少房间ID' });
          return;
        }
        
        console.log(`${userType} ID=${userId} 加入房间: ${roomId}`);
        socket.join(roomId);
        
        // 如果是用户，将用户未读消息标记为已读
        if (userType === 'user') {
          await ChatRoom.findOneAndUpdate(
            { roomId, 'userId': mongoose.Types.ObjectId(userId) },
            { $set: { 'unreadCount.user': 0 } }
          );
        }
        // 如果是商家，将商家未读消息标记为已读
        else if (userType === 'merchant') {
          await ChatRoom.findOneAndUpdate(
            { roomId, 'merchantId': mongoose.Types.ObjectId(userId) },
            { $set: { 'unreadCount.merchant': 0 } }
          );
        }
        
        // 通知客户端已成功加入
        socket.emit('joined_room', { roomId });
        
        // 加载历史消息
        const messages = await ChatMessage.find(
          { roomId, isDeleted: false },
          null,
          { sort: { createdAt: 1 }, limit: 50 }
        );
        
        socket.emit('history_messages', { roomId, messages });
      } catch (error) {
        console.error('加入房间错误:', error);
        socket.emit('error', { message: '加入聊天室失败' });
      }
    });
    
    // 客户端发送消息
    socket.on('send_message', async (data) => {
      try {
        const { roomId, receiverId, content, messageType = 'text', metadata = {} } = data;
        
        if (!roomId || !receiverId || !content) {
          socket.emit('error', { message: '消息格式错误，缺少必要字段' });
          return;
        }
        
        console.log(`收到来自 ${userType} ID=${userId} 的消息: ${content}`);
        
        // 确定接收者类型
        const receiverType = userType === 'user' ? 'merchant' : 'user';
        
        // 创建新消息
        const newMessage = new ChatMessage({
          messageId: ChatMessage.generateMessageId(),
          roomId,
          senderId: mongoose.Types.ObjectId(userId),
          senderType: userType,
          receiverId: mongoose.Types.ObjectId(receiverId),
          receiverType,
          content,
          messageType,
          metadata
        });
        
        // 保存消息
        await newMessage.save();
        
        // 更新聊天室的最后一条消息和未读计数
        const updateData = {
          lastMessage: {
            content,
            senderId: userId,
            senderType: userType,
            timestamp: new Date()
          },
        };
        
        // 更新未读计数
        if (userType === 'user') {
          updateData.$inc = { 'unreadCount.merchant': 1 };
        } else {
          updateData.$inc = { 'unreadCount.user': 1 };
        }
        
        // 更新聊天室
        await ChatRoom.findOneAndUpdate({ roomId }, updateData);
        
        // 广播消息到房间内的所有成员
        io.to(roomId).emit('new_message', newMessage);
        
        // 发送通知给离线用户
        const targetId = receiverId;
        const targetType = receiverType;
        const notificationRoom = `${targetType}_${targetId}`;
        
        // 发送通知，更新列表数据
        io.to(notificationRoom).emit('notification', {
          type: 'new_message',
          roomId,
          senderId: userId,
          senderType: userType,
          message: content
        });
        
      } catch (error) {
        console.error('发送消息错误:', error);
        socket.emit('error', { message: '消息发送失败' });
      }
    });
    
    // 标记消息已读
    socket.on('mark_as_read', async (data) => {
      try {
        const { roomId } = data;
        
        if (!roomId) {
          socket.emit('error', { message: '缺少房间ID' });
          return;
        }
        
        console.log(`${userType} ID=${userId} 标记消息已读: ${roomId}`);
        
        // 更新未读消息计数
        if (userType === 'user') {
          await ChatRoom.findOneAndUpdate(
            { roomId, 'userId': mongoose.Types.ObjectId(userId) },
            { $set: { 'unreadCount.user': 0 } }
          );
          
          // 更新消息状态
          await ChatMessage.updateMany(
            { 
              roomId,
              receiverId: mongoose.Types.ObjectId(userId),
              receiverType: 'user',
              isRead: false
            },
            { $set: { isRead: true, status: 'read' } }
          );
        } else if (userType === 'merchant') {
          await ChatRoom.findOneAndUpdate(
            { roomId, 'merchantId': mongoose.Types.ObjectId(userId) },
            { $set: { 'unreadCount.merchant': 0 } }
          );
          
          // 更新消息状态
          await ChatMessage.updateMany(
            { 
              roomId,
              receiverId: mongoose.Types.ObjectId(userId),
              receiverType: 'merchant',
              isRead: false
            },
            { $set: { isRead: true, status: 'read' } }
          );
        }
        
        // 通知发送方消息已读
        socket.to(roomId).emit('messages_read', { roomId, readerId: userId, readerType: userType });
        
      } catch (error) {
        console.error('标记消息已读错误:', error);
        socket.emit('error', { message: '标记消息已读失败' });
      }
    });
    
    // 断开连接
    socket.on('disconnect', () => {
      console.log(`WebSocket断开连接: ${userType} ID=${userId}`);
      
      // 从连接表中移除
      if (userType === 'user') {
        connectedClients.users.delete(userId);
      } else if (userType === 'merchant') {
        connectedClients.merchants.delete(userId);
      }
    });
  });
};

/**
 * 创建或获取聊天室
 * @param {string} userId - 用户ID
 * @param {string} merchantId - 商家ID
 * @returns {Promise<Object>} 聊天室信息
 */
exports.getOrCreateChatRoom = async (userId, merchantId) => {
  try {
    // 检查参数
    if (!userId || !merchantId) {
      throw new Error('用户ID和商家ID不能为空');
    }
    
    // 生成聊天室ID
    const roomId = ChatRoom.generateRoomId(userId, merchantId);
    
    // 查找现有聊天室
    let chatRoom = await ChatRoom.findOne({ roomId });
    
    // 如果不存在，则创建新聊天室
    if (!chatRoom) {
      // 获取用户信息
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      // 获取商家信息
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        throw new Error('商家不存在');
      }
      
      // 创建新聊天室
      chatRoom = new ChatRoom({
        roomId,
        userId: mongoose.Types.ObjectId(userId),
        merchantId: mongoose.Types.ObjectId(merchantId),
        userInfo: {
          username: user.username,
          avatar: user.avatar || '',
          nickname: user.nickname || user.username
        },
        merchantInfo: {
          name: merchant.name || '',
          logo: merchant.logo || '',
          accountName: merchant.accountName
        }
      });
      
      await chatRoom.save();
    }
    
    return chatRoom;
  } catch (error) {
    console.error('创建/获取聊天室错误:', error);
    throw error;
  }
};

/**
 * 获取用户的聊天室列表
 * @param {string} userId - 用户ID
 * @returns {Promise<Array>} 聊天室列表
 */
exports.getUserChatRooms = async (userId) => {
  try {
    return await ChatRoom.find({ userId: mongoose.Types.ObjectId(userId) })
      .sort({ 'lastMessage.timestamp': -1 });
  } catch (error) {
    console.error('获取用户聊天室错误:', error);
    throw error;
  }
};

/**
 * 获取商家的聊天室列表
 * @param {string} merchantId - 商家ID
 * @returns {Promise<Array>} 聊天室列表
 */
exports.getMerchantChatRooms = async (merchantId) => {
  try {
    return await ChatRoom.find({ merchantId: mongoose.Types.ObjectId(merchantId) })
      .sort({ 'lastMessage.timestamp': -1 });
  } catch (error) {
    console.error('获取商家聊天室错误:', error);
    throw error;
  }
};

/**
 * 获取聊天消息历史
 * @param {string} roomId - 聊天室ID
 * @param {number} limit - 消息数量限制，默认50条
 * @param {number} skip - 跳过的消息数，用于分页
 * @returns {Promise<Array>} 消息列表
 */
exports.getChatHistory = async (roomId, limit = 50, skip = 0) => {
  try {
    return await ChatMessage.find({ roomId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  } catch (error) {
    console.error('获取聊天历史错误:', error);
    throw error;
  }
};

/**
 * 获取用户未读消息数
 * @param {string} userId - 用户ID
 * @returns {Promise<number>} 未读消息数
 */
exports.getUserUnreadCount = async (userId) => {
  try {
    const rooms = await ChatRoom.find({ userId: mongoose.Types.ObjectId(userId) });
    return rooms.reduce((total, room) => total + room.unreadCount.user, 0);
  } catch (error) {
    console.error('获取用户未读消息数错误:', error);
    throw error;
  }
};

/**
 * 获取商家未读消息数
 * @param {string} merchantId - 商家ID
 * @returns {Promise<number>} 未读消息数
 */
exports.getMerchantUnreadCount = async (merchantId) => {
  try {
    const rooms = await ChatRoom.find({ merchantId: mongoose.Types.ObjectId(merchantId) });
    return rooms.reduce((total, room) => total + room.unreadCount.merchant, 0);
  } catch (error) {
    console.error('获取商家未读消息数错误:', error);
    throw error;
  }
}; 