/**
 * 聊天消息数据模型
 * 用于存储聊天消息内容
 */
const mongoose = require('mongoose');

// 聊天消息模式
const chatMessageSchema = new mongoose.Schema({
  // 消息ID
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  
  // 聊天室ID，关联ChatRoom
  roomId: {
    type: String,
    required: true,
    index: true
  },
  
  // 发送者ID
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  
  // 发送者类型（用户或商家）
  senderType: {
    type: String,
    enum: ['user', 'merchant'],
    required: true
  },
  
  // 接收者ID
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  
  // 接收者类型（用户或商家）
  receiverType: {
    type: String,
    enum: ['user', 'merchant'],
    required: true
  },
  
  // 消息内容
  content: {
    type: String,
    required: true
  },
  
  // 消息类型
  messageType: {
    type: String,
    enum: ['text', 'image', 'product', 'order', 'system'],
    default: 'text'
  },
  
  // 附加数据（针对不同类型的消息）
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // 消息状态
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // 是否已读
  isRead: {
    type: Boolean,
    default: false
  },
  
  // 是否已删除（软删除）
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  // 创建时间（消息发送时间）
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // 更新时间（消息状态更新时间）
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 在保存前更新updatedAt字段
chatMessageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 索引
chatMessageSchema.index({ roomId: 1, createdAt: -1 });
chatMessageSchema.index({ senderId: 1, receiverId: 1 });
chatMessageSchema.index({ receiverId: 1, isRead: 1 });

// 静态方法：生成唯一的消息ID
chatMessageSchema.statics.generateMessageId = function() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 创建聊天消息模型
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage; 