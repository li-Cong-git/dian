 /**
 * 订单数据模型
 */
const mongoose = require('mongoose');

// 创建订单模型
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'shipped', 'delivered', 'completed', 'cancelled'],
    default: 'pending'
  },
  shippingInfo: {
    carrier: String,
    trackingNumber: String
  },
  address: {
    receiver: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    province: String,
    city: String,
    district: String,
    detail: String
  },
  paymentMethod: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时自动更新updatedAt字段
orderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 创建订单号的静态方法
orderSchema.statics.generateOrderNumber = function() {
  const now = new Date();
  const year = now.getFullYear().toString().substr(2, 2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}${random}`;
};

// 检查模型是否已存在，如果存在则使用现有的
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

module.exports = Order;