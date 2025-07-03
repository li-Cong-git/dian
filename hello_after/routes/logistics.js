var express = require('express');
var router = express.Router();
const { Logistics, Order } = require('../database/Logistics');
const { Merchant } = require('../database/Merchant');
const User = require('../database/user');

/**
 * 物流信息查询路由
 */
// 根据物流ID获取物流信息
router.post('/info', async (req, res) => {
  try {
    const { logisticsId } = req.body;
    
    if (!logisticsId) {
      return res.status(400).json({
        success: false,
        message: '缺少物流ID参数'
      });
    }
    
    const logistics = await Logistics.findById(logisticsId)
      .populate('orderId')
      .populate('merchantId', 'username shopInfo')
      .populate('userId', 'username nickname');
    
    if (!logistics) {
      return res.status(404).json({
        success: false,
        message: '物流信息不存在'
      });
    }
    
    res.json({
      success: true,
      data: logistics
    });
  } catch (error) {
    console.error('获取物流信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取物流信息失败',
      error: error.message
    });
  }
});

// 根据订单ID获取物流信息
router.post('/order-info', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '缺少订单ID参数'
      });
    }
    
    // 先查询订单，获取物流ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    if (!order.logisticsId) {
      return res.status(404).json({
        success: false,
        message: '该订单暂无物流信息，可能尚未发货'
      });
    }
    
    // 查询物流信息
    const logistics = await Logistics.findById(order.logisticsId)
      .populate('merchantId', 'username shopInfo')
      .populate('userId', 'username nickname');
    
    if (!logistics) {
      return res.status(404).json({
        success: false,
        message: '物流信息不存在'
      });
    }
    
    res.json({
      success: true,
      data: logistics
    });
  } catch (error) {
    console.error('获取订单物流信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单物流信息失败',
      error: error.message
    });
  }
});

// 根据物流单号获取物流信息
router.post('/tracking', async (req, res) => {
  try {
    const { logisticsNo, logisticsCompany } = req.body;
    
    if (!logisticsNo) {
      return res.status(400).json({
        success: false,
        message: '缺少物流单号参数'
      });
    }
    
    // 构建查询条件
    const query = { logisticsNo };
    
    if (logisticsCompany) {
      query.logisticsCompany = logisticsCompany;
    }
    
    const logistics = await Logistics.findOne(query)
      .populate('orderId')
      .populate('merchantId', 'username shopInfo')
      .populate('userId', 'username nickname');
    
    if (!logistics) {
      return res.status(404).json({
        success: false,
        message: '物流信息不存在'
      });
    }
    
    res.json({
      success: true,
      data: logistics
    });
  } catch (error) {
    console.error('获取物流信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取物流信息失败',
      error: error.message
    });
  }
});

/**
 * 用户物流信息查询
 */
// 获取用户的所有物流信息
router.post('/user-logistics', async (req, res) => {
  try {
    const { userId, status, page = 1, limit = 10 } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少用户ID参数'
      });
    }
    
    // 检查用户是否存在
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 构建查询条件
    const query = { userId };
    
    if (status) {
      query.status = status;
    }
    
    // 计算分页
    const skip = (page - 1) * limit;
    
    // 查询物流信息
    const logistics = await Logistics.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('orderId')
      .populate('merchantId', 'username shopInfo');
    
    // 获取物流信息总数
    const total = await Logistics.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        logistics,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取用户物流信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户物流信息失败',
      error: error.message
    });
  }
});

/**
 * 商家物流信息查询
 */
// 获取商家的所有物流信息
router.post('/merchant-logistics', async (req, res) => {
  try {
    const { merchantId, status, logisticsNo, page = 1, limit = 10 } = req.body;
    
    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: '缺少商家ID参数'
      });
    }
    
    // 检查商家是否存在
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: '商家不存在'
      });
    }
    
    // 构建查询条件
    const query = { merchantId };
    
    if (status) {
      query.status = status;
    }
    
    if (logisticsNo) {
      query.logisticsNo = logisticsNo;
    }
    
    // 计算分页
    const skip = (page - 1) * limit;
    
    // 查询物流信息
    const logistics = await Logistics.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('orderId')
      .populate('userId', 'username nickname phone');
    
    // 获取物流信息总数
    const total = await Logistics.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        logistics,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取商家物流信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取商家物流信息失败',
      error: error.message
    });
  }
});

/**
 * 物流状态更新路由
 */
// 添加物流跟踪信息
router.post('/tracking/add', async (req, res) => {
  try {
    const { logisticsId, status, description } = req.body;
    
    if (!logisticsId || !status) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // 查询物流信息
    const logistics = await Logistics.findById(logisticsId);
    if (!logistics) {
      return res.status(404).json({
        success: false,
        message: '物流信息不存在'
      });
    }
    
    // 验证状态值
    const validStatuses = ['shipping', 'arrived', 'delivered', 'exception'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的物流状态'
      });
    }
    
    // 添加物流跟踪记录
    logistics.tracking.push({
      status,
      description: description || getDefaultDescription(status),
      time: new Date()
    });
    
    // 更新物流状态
    logistics.status = status;
    await logistics.save();
    
    // 如果物流状态为"已送达"，同时更新订单状态
    if (status === 'delivered') {
      const order = await Order.findById(logistics.orderId);
      if (order && order.status === 'shipped') {
        order.status = 'completed';
        order.completedAt = new Date();
        await order.save();
      }
    }
    
    res.json({
      success: true,
      message: '物流跟踪信息添加成功',
      data: logistics
    });
  } catch (error) {
    console.error('添加物流跟踪信息错误:', error);
    res.status(500).json({
      success: false,
      message: '添加物流跟踪信息失败',
      error: error.message
    });
  }
});

// 更新物流状态
router.post('/status/update', async (req, res) => {
  try {
    const { logisticsId, status, description } = req.body;
    
    if (!logisticsId || !status) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // 查询物流信息
    const logistics = await Logistics.findById(logisticsId);
    if (!logistics) {
      return res.status(404).json({
        success: false,
        message: '物流信息不存在'
      });
    }
    
    // 验证状态值
    const validStatuses = ['shipping', 'arrived', 'delivered', 'exception'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的物流状态'
      });
    }
    
    // 更新物流状态
    logistics.status = status;
    
    // 添加物流跟踪记录
    logistics.tracking.push({
      status,
      description: description || getDefaultDescription(status),
      time: new Date()
    });
    
    await logistics.save();
    
    // 如果物流状态为"已送达"，同时更新订单状态
    if (status === 'delivered') {
      const order = await Order.findById(logistics.orderId);
      if (order && order.status === 'shipped') {
        order.status = 'completed';
        order.completedAt = new Date();
        await order.save();
      }
    }
    
    res.json({
      success: true,
      message: '物流状态更新成功',
      data: logistics
    });
  } catch (error) {
    console.error('更新物流状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新物流状态失败',
      error: error.message
    });
  }
});

/**
 * 辅助函数 - 根据物流状态获取默认描述
 */
function getDefaultDescription(status) {
  switch (status) {
    case 'shipping':
      return '包裹正在运输中';
    case 'arrived':
      return '包裹已到达目的地';
    case 'delivered':
      return '包裹已成功送达';
    case 'exception':
      return '物流异常，请联系快递公司';
    default:
      return '物流状态更新';
  }
}

module.exports = router; 