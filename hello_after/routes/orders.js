/**
 * 订单路由
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// 引入数据库模型
const Order = require('../database/Order');

/**
 * 创建订单
 */
router.post('/create', async (req, res) => {
  try {
    const { userId, merchantId, items, totalAmount, address, paymentMethod } = req.body;
    
    if (!userId || !merchantId || !items || !totalAmount || !address || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: '订单信息不完整'
      });
    }
    
    // 生成订单号
    const orderNumber = Order.generateOrderNumber();
    
    // 创建新订单
    const newOrder = new Order({
      orderNumber,
      userId,
      merchantId,
      items,
      totalAmount,
      address,
      paymentMethod
    });
    
    await newOrder.save();
    
    res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: newOrder
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({
      success: false,
      message: '创建订单失败',
      error: error.message
    });
  }
});

/**
 * 获取订单列表
 */
router.post('/list', async (req, res) => {
  try {
    const { userId, merchantId, status, page = 1, limit = 10, search } = req.body;
    
    if (!userId && !merchantId) {
      return res.status(400).json({
        success: false,
        message: '必须提供用户ID或商家ID'
      });
    }
    
    // 构建查询条件
    const query = {};
    
    // 根据角色查询
    if (userId) {
      query.userId = userId;
    }
    
    if (merchantId) {
      query.merchantId = merchantId;
    }
    
    // 状态筛选
    if (status) {
      query.status = status;
    }
    
    // 搜索功能
    if (search) {
      // 搜索订单号或收货人信息
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'address.receiver': { $regex: search, $options: 'i' } },
        { 'address.phone': { $regex: search, $options: 'i' } }
      ];
    }
    
    // 分页
    const skip = (page - 1) * limit;
    
    // 查询订单
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // 统计总数
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        orders,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败',
      error: error.message
    });
  }
});

/**
 * 获取订单详情
 */
router.post('/detail', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '订单ID不能为空'
      });
    }
    
    // 查询订单详情
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单详情失败',
      error: error.message
    });
  }
});

/**
 * 取消订单
 */
router.post('/cancel', async (req, res) => {
  try {
    const { orderId, userId, reason } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '订单ID不能为空'
      });
    }
    
    // 查找订单
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    // 检查订单状态
    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `订单已${order.status === 'completed' ? '完成' : '取消'}，无法取消`
      });
    }
    
    // 更新订单状态
    order.status = 'cancelled';
    await order.save();
    
    res.json({
      success: true,
      message: '订单已取消',
      data: order
    });
  } catch (error) {
    console.error('取消订单错误:', error);
    res.status(500).json({
      success: false,
      message: '取消订单失败',
      error: error.message
    });
  }
});

/**
 * 订单发货
 */
router.post('/ship', async (req, res) => {
  try {
    const { orderId, merchantId, carrier, trackingNumber } = req.body;
    
    if (!orderId || !merchantId) {
      return res.status(400).json({
        success: false,
        message: '订单ID和商家ID不能为空'
      });
    }
    
    if (!carrier || !trackingNumber) {
      return res.status(400).json({
        success: false,
        message: '物流公司和物流单号不能为空'
      });
    }
    
    // 查找订单
    const order = await Order.findOne({
      _id: orderId,
      merchantId
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在或不属于该商家'
      });
    }
    
    // 检查订单状态
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '只有待发货状态的订单可以发货'
      });
    }
    
    // 更新订单状态和物流信息
    order.status = 'shipped';
    order.shippingInfo = {
      carrier,
      trackingNumber
    };
    
    await order.save();
    
    res.json({
      success: true,
      message: '订单发货成功',
      data: order
    });
  } catch (error) {
    console.error('订单发货错误:', error);
    res.status(500).json({
      success: false,
      message: '订单发货失败',
      error: error.message
    });
  }
});

/**
 * 确认收货
 */
router.post('/confirm', async (req, res) => {
  try {
    const { orderId, userId } = req.body;
    
    if (!orderId || !userId) {
      return res.status(400).json({
        success: false,
        message: '订单ID和用户ID不能为空'
      });
    }
    
    // 查找订单
    const order = await Order.findOne({
      _id: orderId,
      userId
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在或不属于该用户'
      });
    }
    
    // 检查订单状态
    if (order.status !== 'shipped') {
      return res.status(400).json({
        success: false,
        message: '只有已发货状态的订单可以确认收货'
      });
    }
    
    // 更新订单状态
    order.status = 'delivered';
    await order.save();
    
    res.json({
      success: true,
      message: '确认收货成功',
      data: order
    });
  } catch (error) {
    console.error('确认收货错误:', error);
    res.status(500).json({
      success: false,
      message: '确认收货失败',
      error: error.message
    });
  }
});

/**
 * 完成订单
 */
router.post('/complete', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '订单ID不能为空'
      });
    }
    
    // 查找订单
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    // 检查订单状态
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: '只有已收货状态的订单可以完成'
      });
    }
    
    // 更新订单状态
    order.status = 'completed';
    await order.save();
    
    res.json({
      success: true,
      message: '订单已完成',
      data: order
    });
  } catch (error) {
    console.error('完成订单错误:', error);
    res.status(500).json({
      success: false,
      message: '完成订单失败',
      error: error.message
    });
  }
});

/**
 * 商家订单统计
 */
router.post('/merchant/stats', async (req, res) => {
  try {
    const { merchantId } = req.body;
    
    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: '商家ID不能为空'
      });
    }
    
    // 统计不同状态的订单数量
    const stats = await Order.aggregate([
      { $match: { merchantId: new ObjectId(merchantId) } },
      { $group: { 
        _id: '$status', 
        count: { $sum: 1 },
        amount: { $sum: '$totalAmount' }
      }}
    ]);
    
    // 转换为更易于使用的格式
    const result = {
      total: 0,
      totalAmount: 0,
      pending: 0,
      pendingAmount: 0,
      shipped: 0,
      shippedAmount: 0,
      delivered: 0,
      deliveredAmount: 0,
      completed: 0,
      completedAmount: 0,
      cancelled: 0,
      cancelledAmount: 0
    };
    
    stats.forEach(item => {
      result[item._id] = item.count;
      result[item._id + 'Amount'] = item.amount;
      result.total += item.count;
      result.totalAmount += item.amount;
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取商家订单统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取商家订单统计失败',
      error: error.message
    });
  }
});

module.exports = router;