/**
 * 物流控制器
 * 处理物流相关业务逻辑
 */
const { Order, Logistics } = require('../database/Logistics');
const { Merchant } = require('../database/Merchant');
const User = require('../database/user');

/**
 * 获取物流信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getLogisticsInfo = async (req, res) => {
  try {
    const { logisticsId } = req.params;
    
    // 查询物流信息
    const logistics = await Logistics.findById(logisticsId)
      .populate('orderId', 'orderNo status items totalAmount')
      .exec();
    
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
};

/**
 * 根据订单ID获取物流信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getLogisticsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // 查询物流信息
    const logistics = await Logistics.findOne({ orderId })
      .populate('orderId', 'orderNo status items totalAmount')
      .exec();
    
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
};

/**
 * 根据物流单号获取物流信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getLogisticsByNo = async (req, res) => {
  try {
    const { logisticsNo } = req.params;
    
    // 查询物流信息
    const logistics = await Logistics.findOne({ logisticsNo })
      .populate('orderId', 'orderNo status items totalAmount')
      .exec();
    
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
};

/**
 * 查询用户的所有物流信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getUserLogistics = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    
    // 查找用户的所有订单
    const orders = await Order.find({ userId }).select('_id');
    const orderIds = orders.map(order => order._id);
    
    // 构建查询条件
    const query = { orderId: { $in: orderIds } };
    if (status) {
      query.status = status;
    }
    
    // 计算分页
    const skip = (page - 1) * limit;
    
    // 查询物流信息
    const logistics = await Logistics.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('orderId', 'orderNo status items totalAmount')
      .exec();
    
    // 查询物流总数
    const total = await Logistics.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        logistics,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
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
};

/**
 * 查询商家的所有物流信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getMerchantLogistics = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    
    // 查找商家的所有订单
    const orders = await Order.find({ merchantId }).select('_id');
    const orderIds = orders.map(order => order._id);
    
    // 构建查询条件
    const query = { orderId: { $in: orderIds } };
    if (status) {
      query.status = status;
    }
    
    // 计算分页
    const skip = (page - 1) * limit;
    
    // 查询物流信息
    const logistics = await Logistics.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('orderId', 'orderNo status items totalAmount userId')
      .exec();
    
    // 查询物流总数
    const total = await Logistics.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        logistics,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
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
};

/**
 * 添加物流跟踪信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.addTrackingInfo = async (req, res) => {
  try {
    const { logisticsId } = req.params;
    const { description, location } = req.body;
    
    // 验证必填字段
    if (!description) {
      return res.status(400).json({
        success: false,
        message: '物流跟踪描述不能为空'
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
    
    // 添加跟踪记录
    logistics.trackingInfo.push({
      time: new Date(),
      description,
      location: location || ''
    });
    
    // 根据描述信息可能更新物流状态
    if (description.includes('已签收') || description.includes('已送达') || description.includes('已完成')) {
      logistics.status = 'delivered';
      logistics.actualDeliveryTime = new Date();
    } else if (description.includes('运输中') || description.includes('派送中')) {
      logistics.status = 'in_transit';
    }
    
    await logistics.save();
    
    res.json({
      success: true,
      message: '物流跟踪信息添加成功',
      data: logistics.trackingInfo[logistics.trackingInfo.length - 1]
    });
  } catch (error) {
    console.error('添加物流跟踪信息错误:', error);
    res.status(500).json({
      success: false,
      message: '添加物流跟踪信息失败',
      error: error.message
    });
  }
};

/**
 * 更新物流状态
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.updateLogisticsStatus = async (req, res) => {
  try {
    const { logisticsId } = req.params;
    const { status, description } = req.body;
    
    // 验证状态值
    const validStatuses = [
      'pending', 'shipped', 'in_transit', 'delivered', 'failed', 'returned'
    ];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `无效的物流状态，必须为 ${validStatuses.join(', ')} 之一`
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
    
    // 更新物流状态
    logistics.status = status;
    
    // 更新时间节点
    if (status === 'shipped' && !logistics.shippingTime) {
      logistics.shippingTime = new Date();
    } else if (status === 'delivered' && !logistics.actualDeliveryTime) {
      logistics.actualDeliveryTime = new Date();
    }
    
    // 添加跟踪记录
    if (description) {
      logistics.trackingInfo.push({
        time: new Date(),
        description: description || `物流状态更新为: ${status}`,
        location: ''
      });
    }
    
    await logistics.save();
    
    // 如果物流状态变为已送达，可能需要更新订单状态
    if (status === 'delivered') {
      const order = await Order.findById(logistics.orderId);
      if (order && order.status === 'shipped') {
        order.status = 'delivered';
        await order.save();
      }
    }
    
    res.json({
      success: true,
      message: '物流状态更新成功',
      data: {
        logisticsId,
        status
      }
    });
  } catch (error) {
    console.error('更新物流状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新物流状态失败',
      error: error.message
    });
  }
}; 