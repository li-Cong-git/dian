// 商家信息 包含了 物品的上架等操作。
const mongoose = require('./db');
const Schema = mongoose.Schema;

/**
 * 商品模型
 */
const productSchema = new Schema({
  // 商品基本信息
  name: { type: String, required: true }, // 商品名称
  description: { type: String, default: '' }, // 商品描述
  price: { type: Number, required: true }, // 价格
  originalPrice: { type: Number }, // 原价，用于显示折扣
  images: [{ type: String }], // 商品图片URL列表
  thumbnail: { type: String }, // 缩略图URL
  
  // 商品分类
  category: { type: String, required: true }, // 商品分类
  tags: [{ type: String }], // 商品标签
  
  // 库存信息
  stock: { type: Number, default: 0 }, // 库存数量
  sold: { type: Number, default: 0 }, // 已售数量
  
  // 商品状态
  status: { 
    type: String, 
    enum: ['on_sale', 'off_shelf', 'sold_out'], 
    default: 'off_shelf' 
  }, // 商品状态：在售、下架、售罄
  
  // 商品详情
  specifications: [{ 
    name: String, // 规格名称，如"颜色"、"尺寸"
    values: [String] // 规格值，如["红色", "蓝色"]或["S", "M", "L"]
  }],
  
  // 关联商家
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
  
  // 时间戳
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

/**
 * 商家模型
 * 商家可以管理商品、处理订单、发货等
 */
const merchantSchema = new Schema({
  // 基本信息
  name: { type: String, required: true }, // 店铺名称
  logo: { type: String }, // 店铺logo
  description: { type: String, default: '' }, // 店铺描述
  
  // 账户信息
  accountName: { type: String, required: true, unique: true }, // 账户名
  password: { type: String, required: true }, // 密码
  phone: { type: String, required: true }, // 联系电话
  email: { type: String }, // 邮箱
  
  // 店铺地址
  address: {
    province: { type: String, required: true }, // 省份
    city: { type: String, required: true }, // 城市
    district: { type: String, required: true }, // 区/县
    detail: { type: String, required: true }, // 详细地址
  },
  
  // 经营信息
  businessLicense: { type: String }, // 营业执照号
  businessScope: { type: String }, // 经营范围
  
  // 店铺状态
  status: { 
    type: String, 
    enum: ['active', 'suspended', 'closed'], 
    default: 'active' 
  }, // 店铺状态：正常、暂停、关闭
  
  // 统计数据
  productCount: { type: Number, default: 0 }, // 商品数量
  orderCount: { type: Number, default: 0 }, // 订单数量
  salesAmount: { type: Number, default: 0 }, // 销售额
  
  // 时间戳
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// 创建模型
const Product = mongoose.model('Product', productSchema);
const Merchant = mongoose.model('Merchant', merchantSchema);

module.exports = {
  Product,
  Merchant
};