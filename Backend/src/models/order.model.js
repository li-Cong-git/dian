const mongoose = require('mongoose');
const COLLECTIONS = require('./collections');

// 订单商品模式
const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  specifications: {
    type: Map,
    of: String
  }
});

// 订单模式
const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        }
      }
    ],
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      province: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, required: true },
      address: { type: String, required: true },
      postalCode: { type: String }
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['支付宝', '微信支付', '银联', '货到付款']
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String }
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    discountPrice: {
      type: Number,
      default: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false
    },
    paidAt: {
      type: Date
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false
    },
    deliveredAt: {
      type: Date
    },
    trackingNumber: {
      type: String
    },
    orderStatus: {
      type: String,
      required: true,
      enum: ['待付款', '待发货', '已发货', '已完成', '已取消', '已退款'],
      default: '待付款'
    },
    note: {
      type: String
    },
    couponCode: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// 创建索引以提高查询性能
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ isPaid: 1, isDelivered: 1 });

const Order = mongoose.model('Order', OrderSchema, COLLECTIONS.ORDERS);

module.exports = Order; 