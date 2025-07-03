// 物流信息 包含了商家信息 订单信息 物流信息 
const mongoose = require('./db');
const Schema = mongoose.Schema;

/**
 * 订单模型
 */
const orderSchema = new Schema({
  // 订单基本信息
  orderNo: { type: String, required: true, unique: true }, // 订单编号
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // 用户ID
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true }, // 商家ID
  
  // 订单商品
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, // 商品ID
    productName: { type: String, required: true }, // 商品名称
    productImage: { type: String }, // 商品图片
    price: { type: Number, required: true }, // 购买时价格
    quantity: { type: Number, required: true, min: 1 }, // 数量
    specifications: { type: Object }, // 选择的规格
    subtotal: { type: Number, required: true } // 小计金额
  }],
  
  // 订单金额
  totalAmount: { type: Number, required: true }, // 订单总金额
  actualPaid: { type: Number, required: true }, // 实际支付金额
  
  // 收货信息
  shippingAddress: {
    name: { type: String, required: true }, // 收货人姓名
    phone: { type: String, required: true }, // 收货人电话
    province: { type: String, required: true }, // 省份
    city: { type: String, required: true }, // 城市
    district: { type: String, required: true }, // 区/县
    address: { type: String, required: true }, // 详细地址
  },
  
  // 订单状态
  status: { 
    type: String, 
    enum: [
      'pending_payment', // 待付款
      'paid', // 已付款
      'processing', // 处理中
      'shipped', // 已发货
      'delivered', // 已送达
      'completed', // 已完成
      'cancelled', // 已取消
      'refunding', // 退款中
      'refunded' // 已退款
    ], 
    default: 'pending_payment' 
  },
  
  // 支付信息
  paymentMethod: { type: String }, // 支付方式
  paymentTime: { type: Date }, // 支付时间
  transactionId: { type: String }, // 支付交易号
  
  // 备注
  remark: { type: String }, // 订单备注
  
  // 时间戳
  createdAt: { type: Date, default: Date.now }, // 创建时间
  updatedAt: { type: Date, default: Date.now } // 更新时间
}, {
  timestamps: true
});

/**
 * 物流模型
 */
const logisticsSchema = new Schema({
  // 关联订单
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true }, // 订单ID
  orderNo: { type: String, required: true }, // 订单编号
  
  // 物流基本信息
  logisticsNo: { type: String, required: true }, // 物流单号
  logisticsCompany: { type: String, required: true }, // 物流公司
  
  // 发货信息
  shipFrom: {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true }, // 商家ID
    merchantName: { type: String, required: true }, // 商家名称
    address: { type: String, required: true }, // 发货地址
    contact: { type: String, required: true }, // 联系人
    phone: { type: String, required: true } // 联系电话
  },
  
  // 收货信息
  shipTo: {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // 用户ID
    name: { type: String, required: true }, // 收货人姓名
    phone: { type: String, required: true }, // 收货人电话
    address: { type: String, required: true } // 完整收货地址
  },
  
  // 物流状态
  status: { 
    type: String, 
    enum: [
      'pending', // 待发货
      'shipped', // 已发货
      'in_transit', // 运输中
      'delivered', // 已送达
      'failed', // 配送失败
      'returned' // 已退回
    ], 
    default: 'pending' 
  },
  
  // 物流跟踪记录
  trackingInfo: [{
    time: { type: Date, required: true }, // 时间
    description: { type: String, required: true }, // 描述
    location: { type: String } // 位置
  }],
  
  // 物流时间节点
  shippingTime: { type: Date }, // 发货时间
  estimatedDeliveryTime: { type: Date }, // 预计送达时间
  actualDeliveryTime: { type: Date }, // 实际送达时间
  
  // 用户操作记录
  userActions: [{
    action: { 
      type: String, 
      enum: ['confirm_receipt', 'extend_receipt_time', 'urge_shipping'] 
    }, // 用户操作：确认收货、延长收货时间、催促发货
    time: { type: Date, default: Date.now }, // 操作时间
    remark: { type: String } // 备注
  }],
  
  // 商家操作记录
  merchantActions: [{
    action: { 
      type: String, 
      enum: ['ship', 'modify_logistics', 'cancel_shipping'] 
    }, // 商家操作：发货、修改物流、取消发货
    time: { type: Date, default: Date.now }, // 操作时间
    remark: { type: String } // 备注
  }],
  
  // 时间戳
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// 创建模型
const Order = mongoose.model('Order', orderSchema);
const Logistics = mongoose.model('Logistics', logisticsSchema);

module.exports = {
  Order,
  Logistics
}; 