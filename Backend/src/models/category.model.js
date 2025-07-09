const mongoose = require('mongoose');
const COLLECTIONS = require('./collections');

/**
 * 分类模型
 * 用于存储商品分类信息
 */
const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String
  },
  image: {
    type: String
  },
  icon: {
    type: String
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isTopLevel: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 创建索引（保留没有重复的索引）
// name和slug已经设置了unique: true，不需要再创建索引
// CategorySchema.index({ name: 1 }, { unique: true });
// CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ parent: 1 });
CategorySchema.index({ isTopLevel: 1 });

// 获取子分类的静态方法
CategorySchema.statics.getChildren = async function (parentId) {
  return this.find({ parent: parentId });
};

// 计算包含子分类的产品总数的虚拟字段
// 这里只是示例，实际使用时可能需要根据具体情况调整
CategorySchema.virtual('productCount').get(function () {
  // 这里需要在实际查询中使用聚合管道计算
  return 0;
});

const Category = mongoose.model('Category', CategorySchema, COLLECTIONS.CATEGORIES);

module.exports = Category;
