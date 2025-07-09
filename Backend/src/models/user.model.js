const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const COLLECTIONS = require('./collections');

// 地址模式
const AddressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  province: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  postalCode: {
    type: String
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});

// 用户模式
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // 默认查询不返回密码
  },
  avatar: {
    type: String,
    default: 'https://i.pravatar.cc/150'
  },
  phone: {
    type: String,
    trim: true
  },
  addresses: [{
    name: { type: String, required: true },
    phone: { type: String, required: true },
    province: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    address: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  points: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 不需要显式创建索引，因为email字段已经设置了unique: true

// 保存前加密密码
UserSchema.pre('save', async function (next) {
  // 只有当密码被修改时才重新加密
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // 生成salt
    const salt = await bcrypt.genSalt(10);
    // 加密密码
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 验证密码的实例方法
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 添加地址的实例方法
UserSchema.methods.addAddress = function (address) {
  // 如果新地址被设置为默认，则将其他地址的默认标志设为false
  if (address.isDefault) {
    this.addresses.forEach(addr => {
      addr.isDefault = false;
    });
  }

  // 如果这是第一个地址，自动设为默认
  if (this.addresses.length === 0) {
    address.isDefault = true;
  }

  this.addresses.push(address);
  return this.save();
};

const User = mongoose.model('User', UserSchema, COLLECTIONS.USERS);

module.exports = User; 