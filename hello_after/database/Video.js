const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * 视频数据模型
 */
const videoSchema = new Schema({
  // 标题
  title: {
    type: String,
    required: true,
    trim: true
  },
  // 描述
  description: {
    type: String,
    trim: true
  },
  // 视频URL
  videoUrl: {
    type: String,
    required: true
  },
  // 视频文件名
  fileName: {
    type: String
  },
  // 缩略图URL
  thumbnailUrl: {
    type: String,
    default: ''
  },
  // 上传商家ID
  merchantId: {
    type: Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true
  },
  // 关联商品ID列表
  productIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  // 标签列表
  tags: [{
    type: String,
    trim: true
  }],
  // 浏览次数
  views: {
    type: Number,
    default: 0
  },
  // 视频状态
  status: {
    type: String,
    enum: ['draft', 'published', 'removed'],
    default: 'published'
  },
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  },
  // 更新时间
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新前自动更新时间
videoSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Video', videoSchema); 