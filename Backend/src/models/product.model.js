const mongoose = require('mongoose');
const COLLECTIONS = require('./collections');

// 产品评论模式
const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  images: [String]
}, { timestamps: true });

// 产品模式
const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  originalPrice: {
    type: Number,
    default: 0
  },
  images: [String],
  mainImage: String,
  brand: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subcategory: String,
  tags: [String],
  countInStock: {
    type: Number,
    required: true,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  salePrice: {
    type: Number
  },
  salesCount: {
    type: Number,
    default: 0
  },
  specifications: {
    type: Map,
    of: String
  },
  reviews: [ReviewSchema]
}, {
  timestamps: true
});

// 创建索引以支持搜索
ProductSchema.index({ name: 'text', description: 'text', brand: 'text', category: 'text', tags: 'text' });

const Product = mongoose.model('Product', ProductSchema, COLLECTIONS.PRODUCTS);

module.exports = Product; 