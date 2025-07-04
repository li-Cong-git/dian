/**
 * 聊天室数据模型
 * 用于存储用户和商家之间的聊天会话信息
 */
const mongoose = require('mongoose');

// 聊天室模式
const chatRoomSchema = new mongoose.Schema({
  // 房间ID，系统自动生成
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  
  // 用户ID
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 商家ID
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true
  },
  
  // 用户信息（冗余存储，避免频繁关联查询）
  userInfo: {
    username: String,
    avatar: String,
    nickname: String
  },
  
  // 商家信息（冗余存储，避免频繁关联查询）
  merchantInfo: {
    name: String, // 店铺名称
    logo: String,
    accountName: String // 账户名称
  },
  
  // 最后一条消息内容（用于列表显示）
  lastMessage: {
    content: String,
    senderId: String,
    senderType: {
      type: String,
      enum: ['user', 'merchant'],
      default: 'user'
    },
    timestamp: Date
  },
  
  // 未读消息计数
  unreadCount: {
    user: {
      type: Number,
      default: 0
    },
    merchant: {
      type: Number,
      default: 0
    }
  },
  
  // 聊天室状态
  status: {
    type: String,
    enum: ['active', 'archived', 'blocked'],
    default: 'active'
  },
  
  // 创建和更新时间
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 在保存前更新updatedAt字段
chatRoomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 索引
chatRoomSchema.index({ userId: 1, merchantId: 1 }, { unique: true });
chatRoomSchema.index({ userId: 1 });
chatRoomSchema.index({ merchantId: 1 });
chatRoomSchema.index({ updatedAt: -1 });

// 静态方法：生成唯一的聊天室ID
chatRoomSchema.statics.generateRoomId = function(userId, merchantId) {
  // 确保userId和merchantId的顺序一致，无论谁发起聊天
  const orderedIds = [userId.toString(), merchantId.toString()].sort();
  return `room_${orderedIds[0]}_${orderedIds[1]}`;
};

// 创建聊天室模型
const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom; 