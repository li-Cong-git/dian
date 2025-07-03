var express = require('express');
var router = express.Router();
const { Merchant, Product } = require('../database/Merchant');
const { Order, Logistics } = require('../database/Logistics');
const crypto = require('crypto');

/**
 * 商家认证相关路由
 */
// 商家注册
router.post('/register', async (req, res) => {
  try {
    const { 
      username, 
      password, 
      phone, 
      email, 
      shopName, 
      businessLicense, 
      contactName 
    } = req.body;
    
    // 验证必填字段
    if (!username || !password || !phone || !shopName || !businessLicense) {
      return res.status(400).json({
        success: false,
        message: '用户名、密码、手机号、店铺名称和营业执照为必填项'
      });
    }
    
    // 检查用户名是否已存在
    const existingMerchant = await Merchant.findOne({ username });
    if (existingMerchant) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }
    
    // 密码加密
    const hashedPassword = crypto
      .createHash('md5')
      .update(password)
      .digest('hex');
    
    // 创建新商家
    const newMerchant = new Merchant({
      username,
      password: hashedPassword,
      phone,
      email: email || '',
      shopInfo: {
        shopName,
        businessLicense,
        contactName: contactName || username,
        description: '',
        logo: '',
        status: 'pending' // 默认为待审核状态
      }
    });
    
    await newMerchant.save();
    
    // 返回成功响应（不包含密码）
    const merchantWithoutPassword = newMerchant.toObject();
    delete merchantWithoutPassword.password;
    
    res.status(201).json({
      success: true,
      message: '注册成功，等待审核',
      data: merchantWithoutPassword
    });
  } catch (error) {
    console.error('商家注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: error.message
    });
  }
});

// 商家登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码为必填项'
      });
    }
    
    // 查找商家
    const merchant = await Merchant.findOne({ username });
    if (!merchant) {
      return res.status(400).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 验证密码
    const hashedPassword = crypto
      .createHash('md5')
      .update(password)
      .digest('hex');
    
    if (merchant.password !== hashedPassword) {
      return res.status(400).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 检查账户状态
    if (merchant.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: merchant.status === 'pending' 
          ? '账户正在审核中，请耐心等待' 
          : '账户已被禁用'
      });
    }
    
    // 检查店铺状态
    if (merchant.shopInfo.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: merchant.shopInfo.status === 'pending'
          ? '店铺正在审核中，请耐心等待'
          : '店铺已被禁用'
      });
    }
    
    // 登录成功，返回商家信息（不包含密码）
    const merchantWithoutPassword = merchant.toObject();
    delete merchantWithoutPassword.password;
    
    res.json({
      success: true,
      message: '登录成功',
      data: merchantWithoutPassword
    });
  } catch (error) {
    console.error('商家登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
});

/**
 * 商家信息相关路由
 */
// 获取商家信息
router.post('/profile/get', async (req, res) => {
  try {
    const { merchantId } = req.body;
    
    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: '缺少商家ID参数'
      });
    }
    
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: '商家不存在'
      });
    }
    
    // 返回商家信息（不包含密码）
    const merchantWithoutPassword = merchant.toObject();
    delete merchantWithoutPassword.password;
    
    res.json({
      success: true,
      data: merchantWithoutPassword
    });
  } catch (error) {
    console.error('获取商家信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取商家信息失败',
      error: error.message
    });
  }
});

// 更新商家信息
router.post('/profile/update', async (req, res) => {
  try {
    const { merchantId, ...updateData } = req.body;
    
    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: '缺少商家ID参数'
      });
    }
    
    // 不允许更新敏感字段
    delete updateData.password;
    delete updateData.role;
    delete updateData.status;
    delete updateData.shopInfo?.status;
    
    const updatedMerchant = await Merchant.findByIdAndUpdate(
      merchantId,
      { $set: updateData },
      { new: true }
    );
    
    if (!updatedMerchant) {
      return res.status(404).json({
        success: false,
        message: '商家不存在'
      });
    }
    
    // 返回更新后的商家信息（不包含密码）
    const merchantWithoutPassword = updatedMerchant.toObject();
    delete merchantWithoutPassword.password;
    
    res.json({
      success: true,
      message: '商家信息更新成功',
      data: merchantWithoutPassword
    });
  } catch (error) {
    console.error('更新商家信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新商家信息失败',
      error: error.message
    });
  }
});

/**
 * 商品管理相关路由
 */
// 创建新商品
router.post('/products/create', async (req, res) => {
  try {
    const { 
      merchantId, 
      name, 
      description, 
      price, 
      stock, 
      category,
      images,
      attributes
    } = req.body;
    
    if (!merchantId || !name || price === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // 验证商家是否存在
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: '商家不存在'
      });
    }
    
    // 验证商家状态
    if (merchant.status !== 'active' || merchant.shopInfo.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '商家或店铺状态异常，无法创建商品'
      });
    }
    
    // 创建新商品
    const newProduct = new Product({
      merchantId,
      name,
      description: description || '',
      price,
      stock,
      category: category || '其他',
      images: images || [],
      attributes: attributes || {},
      status: 'inactive' // 默认为下架状态
    });
    
    await newProduct.save();
    
    res.status(201).json({
      success: true,
      message: '商品创建成功',
      data: newProduct
    });
  } catch (error) {
    console.error('创建商品错误:', error);
    res.status(500).json({
      success: false,
      message: '创建商品失败',
      error: error.message
    });
  }
});

// 获取商家的商品列表
router.post('/products/list', async (req, res) => {
  try {
    const { 
      merchantId, 
      status, 
      category, 
      name,
      page = 1, 
      limit = 10 
    } = req.body;
    
    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: '缺少商家ID参数'
      });
    }
    
    // 构建查询条件
    const query = { merchantId };
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (name) {
      query.name = { $regex: name, $options: 'i' }; // 名称模糊搜索
    }
    
    // 计算分页
    const skip = (page - 1) * limit;
    
    // 查询商品
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // 获取商品总数
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取商品列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取商品列表失败',
      error: error.message
    });
  }
});

// 获取商品详情
router.post('/products/detail', async (req, res) => {
  try {
    const { merchantId, productId } = req.body;
    
    if (!merchantId || !productId) {
      return res.status(400).json({
        success: false,
        message: '缺少商家ID或商品ID参数'
      });
    }
    
    // 查询商品
    const product = await Product.findOne({
      _id: productId,
      merchantId
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('获取商品详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取商品详情失败',
      error: error.message
    });
  }
});

// 更新商品信息
router.post('/products/update', async (req, res) => {
  try {
    const { 
      merchantId, 
      productId, 
      ...updateData 
    } = req.body;
    
    if (!merchantId || !productId) {
      return res.status(400).json({
        success: false,
        message: '缺少商家ID或商品ID参数'
      });
    }
    
    // 查询商品是否存在
    const product = await Product.findOne({
      _id: productId,
      merchantId
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }
    
    // 更新商品信息
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updateData },
      { new: true }
    );
    
    res.json({
      success: true,
      message: '商品信息更新成功',
      data: updatedProduct
    });
  } catch (error) {
    console.error('更新商品信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新商品信息失败',
      error: error.message
    });
  }
});

// 商品上架/下架
router.post('/products/status', async (req, res) => {
  try {
    const { merchantId, productId, status } = req.body;
    
    if (!merchantId || !productId || !status) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // 验证状态值
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }
    
    // 查询商品是否存在
    const product = await Product.findOne({
      _id: productId,
      merchantId
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }
    
    // 检查库存
    if (status === 'active' && product.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: '库存为零的商品不能上架'
      });
    }
    
    // 更新商品状态
    product.status = status;
    await product.save();
    
    res.json({
      success: true,
      message: status === 'active' ? '商品已上架' : '商品已下架',
      data: product
    });
  } catch (error) {
    console.error('更新商品状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新商品状态失败',
      error: error.message
    });
  }
});

// 删除商品
router.post('/products/delete', async (req, res) => {
  try {
    const { merchantId, productId } = req.body;
    
    if (!merchantId || !productId) {
      return res.status(400).json({
        success: false,
        message: '缺少商家ID或商品ID参数'
      });
    }
    
    // 查询商品是否存在
    const product = await Product.findOne({
      _id: productId,
      merchantId
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }
    
    // 检查商品是否可以删除（可以添加更多条件）
    const hasOrders = await Order.exists({
      'products.productId': productId
    });
    
    if (hasOrders) {
      return res.status(400).json({
        success: false,
        message: '该商品已有订单，不能删除'
      });
    }
    
    // 删除商品
    await Product.findByIdAndDelete(productId);
    
    res.json({
      success: true,
      message: '商品删除成功'
    });
  } catch (error) {
    console.error('删除商品错误:', error);
    res.status(500).json({
      success: false,
      message: '删除商品失败',
      error: error.message
    });
  }
});

/**
 * 订单管理相关路由
 */
// 获取商家订单列表
router.post('/orders/list', async (req, res) => {
  try {
    const { 
      merchantId, 
      status, 
      orderId,
      startDate, 
      endDate,
      page = 1, 
      limit = 10 
    } = req.body;
    
    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: '缺少商家ID参数'
      });
    }
    
    // 构建查询条件
    const query = { merchantId };
    
    if (status) {
      query.status = status;
    }
    
    if (orderId) {
      query.$or = [
        { _id: orderId },
        { orderNo: orderId }
      ];
    }
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }
    
    // 计算分页
    const skip = (page - 1) * limit;
    
    // 查询订单并填充相关信息
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('products.productId')
      .populate('userId', 'username nickname phone')
      .populate('logisticsId');
    
    // 获取订单总数
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取商家订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败',
      error: error.message
    });
  }
});

// 获取订单详情
router.post('/orders/detail', async (req, res) => {
  try {
    const { merchantId, orderId } = req.body;
    
    if (!merchantId || !orderId) {
      return res.status(400).json({
        success: false,
        message: '缺少商家ID或订单ID参数'
      });
    }
    
    // 查询订单并填充相关信息
    const order = await Order.findOne({
      _id: orderId,
      merchantId
    })
      .populate('products.productId')
      .populate('userId', 'username nickname phone email')
      .populate('logisticsId');
    
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

// 处理订单状态变更
router.post('/orders/status', async (req, res) => {
  try {
    const { merchantId, orderId, status, remark } = req.body;
    
    if (!merchantId || !orderId || !status) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // 验证状态值
    const validStatuses = ['processing', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }
    
    // 查询订单
    const order = await Order.findOne({
      _id: orderId,
      merchantId
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    // 验证状态变更是否合法
    if (order.status === 'completed' || order.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: '已完成或已退款的订单不能再更改状态'
      });
    }
    
    if (order.status === 'shipped' && status !== 'refunded') {
      return res.status(400).json({
        success: false,
        message: '已发货的订单只能变更为退款状态'
      });
    }
    
    // 更新订单状态
    order.status = status;
    
    // 记录状态变更时间
    switch (status) {
      case 'processing':
        order.processingAt = new Date();
        break;
      case 'cancelled':
        order.cancelledAt = new Date();
        // 如果订单取消，恢复商品库存
        for (const item of order.products) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: item.quantity } }
          );
        }
        break;
      case 'refunded':
        order.refundedAt = new Date();
        break;
    }
    
    // 添加备注（如果有）
    if (remark) {
      if (!order.remarks) {
        order.remarks = [];
      }
      
      order.remarks.push({
        content: remark,
        createdAt: new Date()
      });
    }
    
    await order.save();
    
    res.json({
      success: true,
      message: '订单状态更新成功',
      data: order
    });
  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新订单状态失败',
      error: error.message
    });
  }
});

/**
 * 物流管理相关路由
 */
// 发货处理
router.post('/orders/ship', async (req, res) => {
  try {
    const { 
      merchantId, 
      orderId, 
      logisticsCompany, 
      logisticsNo,
      remark 
    } = req.body;
    
    if (!merchantId || !orderId || !logisticsCompany || !logisticsNo) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // 查询订单
    const order = await Order.findOne({
      _id: orderId,
      merchantId
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    // 验证订单状态
    if (order.status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: '只有处理中的订单才能发货'
      });
    }
    
    // 创建物流信息
    const logistics = new Logistics({
      orderId,
      merchantId,
      userId: order.userId,
      logisticsCompany,
      logisticsNo,
      status: 'shipping',
      shippingAddress: order.shippingAddress,
      tracking: [
        {
          status: 'shipping',
          description: '商家已发货',
          time: new Date()
        }
      ]
    });
    
    await logistics.save();
    
    // 更新订单状态和物流信息
    order.status = 'shipped';
    order.shippedAt = new Date();
    order.logisticsId = logistics._id;
    
    // 添加备注（如果有）
    if (remark) {
      if (!order.remarks) {
        order.remarks = [];
      }
      
      order.remarks.push({
        content: remark,
        createdAt: new Date()
      });
    }
    
    await order.save();
    
    res.json({
      success: true,
      message: '发货成功',
      data: {
        order,
        logistics
      }
    });
  } catch (error) {
    console.error('发货处理错误:', error);
    res.status(500).json({
      success: false,
      message: '发货失败',
      error: error.message
    });
  }
});

// 更新物流信息
router.post('/logistics/update', async (req, res) => {
  try {
    const { 
      merchantId, 
      logisticsId, 
      status, 
      description 
    } = req.body;
    
    if (!merchantId || !logisticsId || !status) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // 查询物流信息
    const logistics = await Logistics.findOne({
      _id: logisticsId,
      merchantId
    });
    
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
      message: '物流信息更新成功',
      data: logistics
    });
  } catch (error) {
    console.error('更新物流信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新物流信息失败',
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