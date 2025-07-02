let mongoose = require("mongoose");

// 添加更详细的连接日志
mongoose.connection.on("connected", () => {
  console.log("MongoDB connected successfully");
});

mongoose.connection.on("error", (err) => {
  console.log("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose
  .connect(
    "mongodb+srv://2264521353:1234567890@six0.hic1spu.mongodb.net/2408B",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("数据库连接成功");
  })
  .catch((err) => {
    console.log("数据库连接失败:", err);
  });

// 地址子文档
const AddressSchema = new mongoose.Schema({
    // 收件人姓名
    recipient: { type: String, required: true },
    // 收件人联系电话
    phone: { type: String, required: true },
    // 详细收货地址
    address: { type: String, required: true },
    // 是否为默认地址
    isDefault: { type: Boolean, default: false }
});

// 用户表
const UserSchema = new mongoose.Schema({
  // 用户名，唯一，用于登录
  username: { type: String, required: true, unique: true },
  // 用户密码，存储加密后的哈希值
  password: { type: String, required: true },
  // 用户头像的URL
  avatar: { type: String, default: "" },
  // 用户的收货地址列表，是一个子文档数组
  addresses: [AddressSchema],
  // 标记用户是否为商家
  isMerchant: { type: Boolean, default: false },
  // 如果是商家，这里会存储对应商家表的引用ID
  merchantInfo: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' }
});

// 商家表
const MerchantSchema = new mongoose.Schema({
    // 商家/店铺的名称
    name: { type: String, required: true },
    // 商家所有者的用户ID，关联到User表
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// 商品表
const ProductSchema = new mongoose.Schema({
  // 商品名称
  name: { type: String, required: true },
  // 商品的详细描述
  description: { type: String, required: true },
  // 商品价格
  price: { type: Number, required: true },
  // 商品库存数量
  stock: { type: Number, required: true, default: 0 },
  // 商品的图片URL列表
  images: [{ type: String }],
  // 商品所属分类
  category: { type: String },
  // 商品所属的商家ID，关联到Merchant表
  merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true }
});

// 购物车表
const CartSchema = new mongoose.Schema({
  // 购物车所属的用户ID，关联到User表
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // 购物车中的商品项目列表
  items: [{
    // 商品的ID，关联到Product表
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    // 该商品的数量
    quantity: { type: Number, required: true, min: 1 }
  }]
});

// 订单表
const OrderSchema = new mongoose.Schema({
  // 下单用户的ID，关联到User表
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // 订单包含的商品列表
  items: [{
    // 商品信息快照：下单时商品的完整信息，防止后续商品信息变动影响历史订单
    product: { type: Object, required: true },
    // 购买的数量
    quantity: { type: Number, required: true }
  }],
  // 订单总金额
  totalAmount: { type: Number, required: true },
  // 收货地址快照：下单时的地址信息，防止用户修改地址影响历史订单
  shippingAddress: { type: Object, required: true },
  // 支付状态
  paymentStatus: { type: String, enum: ['未支付', '已支付'], default: '未支付' },
  // 订单状态：'待付款', '待发货'（已支付）, '已发货', '已完成'（已收货）, '已取消'
  orderStatus: { type: String, enum: ['待付款', '待发货', '已发货', '已完成', '已取消'], default: '待付款' },
  // 订单创建时间
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
    User: mongoose.model('User', UserSchema),
    Merchant: mongoose.model('Merchant', MerchantSchema),
    Product: mongoose.model('Product', ProductSchema),
    Cart: mongoose.model('Cart', CartSchema),
    Order: mongoose.model('Order', OrderSchema)
}