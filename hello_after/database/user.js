// 用户表 包含 用户的物流信息
const mongoose = require('./db');
const Schema = mongoose.Schema;

/**
 * 用户模型
 * 普通用户只能查看、购买商品，确认收货，催促发货
 */
const userSchema = new Schema({
  // 基本信息
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nickname: { type: String, default: '' },
  phone: { type: String, required: true },
  email: { 
    type: String, 
    default: '',
    unique: true,
    sparse: true // 只有当字段存在且不为空时才应用唯一性约束
  },
  avatar: { type: String, default: '' }, // 头像URL
  
  // 角色和权限
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  // 收货地址列表
  addresses: [{
    name: { type: String, required: true }, // 收货人姓名
    phone: { type: String, required: true }, // 收货人手机号
    province: { type: String, required: true }, // 省份
    city: { type: String, required: true }, // 城市
    district: { type: String, required: true }, // 区/县
    address: { type: String, required: true }, // 详细地址
    isDefault: { type: Boolean, default: false }, // 是否默认地址
  }],
  
  // 购物车
  cart: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product' }, // 商品ID，关联商品模型
    quantity: { type: Number, default: 1 }, // 数量
    selected: { type: Boolean, default: true }, // 是否选中
    addTime: { type: Date, default: Date.now } // 加入购物车时间
  }],
  
  // 账户状态
  status: { type: String, enum: ['active', 'disabled'], default: 'active' },
  
  // 时间戳
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true // 自动管理createdAt和updatedAt字段
});

// 创建用户模型
const User = mongoose.model('User', userSchema);

module.exports = User;