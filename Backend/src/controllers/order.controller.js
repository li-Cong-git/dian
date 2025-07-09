const Order = require('../models/order.model');
const Product = require('../models/product.model');
const { AppError } = require('../middlewares/error.middleware');

/**
 * 创建新订单
 * POST /api/orders
 */
exports.createOrder = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice
    } = req.body;

    // 验证购物车不为空
    if (!orderItems || orderItems.length === 0) {
      throw new AppError('购物车为空', 400);
    }

    // 验证商品库存
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new AppError(`商品不存在: ${item.name}`, 404);
      }
      if (product.countInStock < item.qty) {
        throw new AppError(`${product.name} 库存不足`, 400);
      }
    }

    // 创建新订单
    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    });

    // 保存订单
    const createdOrder = await order.save();

    // 更新商品库存
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      product.countInStock -= item.qty;
      product.salesCount += item.qty;
      await product.save();
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取当前用户的所有订单
 * GET /api/orders
 */
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取订单详情
 * GET /api/orders/:id
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email');

    // 验证订单是否存在
    if (!order) {
      throw new AppError('订单不存在', 404);
    }

    // 验证用户是否有权限查看此订单（只能查看自己的订单）
    if (order.user._id.toString() !== req.user._id.toString()) {
      throw new AppError('没有权限查看此订单', 403);
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新订单为已支付状态
 * PUT /api/orders/:id/pay
 */
exports.updateOrderToPaid = async (req, res, next) => {
  try {
    const { paymentResult } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError('订单不存在', 404);
    }

    // 验证用户是否有权限更新此订单（只能更新自己的订单）
    if (order.user.toString() !== req.user._id.toString()) {
      throw new AppError('没有权限更新此订单', 403);
    }

    // 更新订单状态
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = paymentResult;

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新订单为已发货状态（管理员）
 * PUT /api/orders/:id/deliver
 */
exports.updateOrderToDelivered = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError('订单不存在', 404);
    }

    // 更新订单状态
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取所有订单（管理员）
 * GET /api/orders/admin
 */
exports.getOrders = async (req, res, next) => {
  try {
    // 分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 查询所有订单
    const orders = await Order.find({})
      .populate('user', 'id name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // 计算总订单数
    const totalOrders = await Order.countDocuments();

    res.json({
      orders,
      page,
      pages: Math.ceil(totalOrders / limit),
      total: totalOrders,
    });
  } catch (error) {
    next(error);
  }
};
