/**
 * 商家控制器
 * 处理商家相关业务逻辑
 */
const { Merchant, Product } = require('../database/Merchant');
const { Order, Logistics } = require('../database/Logistics');
const crypto = require('crypto');

/**
 * 商家注册
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.register = async (req, res) => {
  try {
    const { 
      name, 
      accountName, 
      password, 
      phone, 
      email, 
      address,
      description,
      businessLicense,
      businessScope
    } = req.body;
    
    // 验证必填字段
    if (!name || !accountName || !password || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: '店铺名称、账户名、密码、手机号和地址为必填项'
      });
    }
    
    // 验证地址字段
    if (!address.province || !address.city || !address.district || !address.detail) {
      return res.status(400).json({
        success: false,
        message: '地址信息不完整'
      });
    }
    
    // 检查账户名是否已存在
    const existingMerchant = await Merchant.findOne({ accountName });
    if (existingMerchant) {
      return res.status(400).json({
        success: false,
        message: '账户名已存在'
      });
    }
    
    // 密码加密
    const hashedPassword = crypto
      .createHash('md5')
      .update(password)
      .digest('hex');
    
    // 创建新商家
    const newMerchant = new Merchant({
      name,
      accountName,
      password: hashedPassword,
      phone,
      email: email || '',
      address,
      description: description || '',
      businessLicense: businessLicense || '',
      businessScope: businessScope || ''
    });
    
    await newMerchant.save();
    
    // 返回成功响应（不包含密码）
    const merchantWithoutPassword = newMerchant.toObject();
    delete merchantWithoutPassword.password;
    
    res.status(201).json({
      success: true,
      message: '商家注册成功',
      data: merchantWithoutPassword
    });
  } catch (error) {
    console.error('商家注册错误:', error);
    res.status(500).json({
      success: false,
      message: '商家注册失败',
      error: error.message
    });
  }
};

/**
 * 商家登录
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.login = async (req, res) => {
  try {
    const { accountName, password } = req.body;
    
    // 验证必填字段
    if (!accountName || !password) {
      return res.status(400).json({
        success: false,
        message: '账户名和密码为必填项'
      });
    }
    
    // 查找商家
    const merchant = await Merchant.findOne({ accountName });
    if (!merchant) {
      return res.status(400).json({
        success: false,
        message: '账户名或密码错误'
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
        message: '账户名或密码错误'
      });
    }
    
    // 检查账户状态
    if (merchant.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '账户已被暂停或关闭'
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
};

/**
 * 获取商家信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getMerchantProfile = async (req, res) => {
  try {
    const merchantId = req.params.merchantId;
    
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
};

/**
 * 更新商家信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.updateMerchantProfile = async (req, res) => {
  try {
    const merchantId = req.params.merchantId;
    const updateData = req.body;
    
    // 不允许更新敏感字段
    delete updateData.password;
    delete updateData.status;
    delete updateData.accountName;
    
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
};

/**
 * 创建新商品
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.createProduct = async (req, res) => {
  try {
    const merchantId = req.params.merchantId;
    const productData = req.body;
    
    // 验证必填字段
    if (!productData.name || !productData.price || !productData.category) {
      return res.status(400).json({
        success: false,
        message: '商品名称、价格和分类为必填项'
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
    
    // 创建新商品
    const newProduct = new Product({
      ...productData,
      merchantId,
      status: productData.status || 'off_shelf', // 默认为下架状态
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newProduct.save();
    
    // 更新商家的商品数量
    merchant.productCount += 1;
    await merchant.save();
    
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
};

/**
 * 获取商家的商品列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getMerchantProducts = async (req, res) => {
  try {
    const merchantId = req.params.merchantId;
    const { status, category, search, page = 1, limit = 10 } = req.query;
    
    // 构建查询条件
    const query = { merchantId };
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 计算分页
    const skip = (page - 1) * limit;
    
    // 查询商品
    const products = await Product.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // 查询商品总数
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
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
};

/**
 * 获取商品详情
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getProductDetail = async (req, res) => {
  try {
    const { merchantId, productId } = req.params;
    
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
};

/**
 * 更新商品信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.updateProduct = async (req, res) => {
  try {
    const { merchantId, productId } = req.params;
    const updateData = req.body;
    
    // 确保不会意外更改商家ID
    delete updateData.merchantId;
    
    // 更新商品
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        merchantId
      },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      { new: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }
    
    res.json({
      success: true,
      message: '商品更新成功',
      data: updatedProduct
    });
  } catch (error) {
    console.error('更新商品错误:', error);
    res.status(500).json({
      success: false,
      message: '更新商品失败',
      error: error.message
    });
  }
};

/**
 * 商品上架/下架
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.changeProductStatus = async (req, res) => {
  try {
    const { merchantId, productId } = req.params;
    const { status } = req.body;
    
    // 验证状态值
    if (!status || !['on_sale', 'off_shelf'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的商品状态，必须为 on_sale 或 off_shelf'
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
    
    // 如果要上架，检查库存
    if (status === 'on_sale' && product.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: '库存不足，无法上架'
      });
    }
    
    // 更新商品状态
    product.status = status;
    product.updatedAt = new Date();
    await product.save();
    
    res.json({
      success: true,
      message: status === 'on_sale' ? '商品上架成功' : '商品下架成功',
      data: {
        productId,
        status
      }
    });
  } catch (error) {
    console.error('更改商品状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更改商品状态失败',
      error: error.message
    });
  }
};

/**
 * 删除商品
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { merchantId, productId } = req.params;
    
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
    
    // 检查商品是否可以删除（不在订单中）
    const orderWithProduct = await Order.findOne({
      'items.productId': productId
    });
    
    if (orderWithProduct) {
      return res.status(400).json({
        success: false,
        message: '商品已被下单，无法删除'
      });
    }
    
    // 删除商品
    await Product.findByIdAndDelete(productId);
    
    // 更新商家的商品数量
    const merchant = await Merchant.findById(merchantId);
    if (merchant) {
      merchant.productCount = Math.max(0, merchant.productCount - 1);
      await merchant.save();
    }
    
    res.json({
      success: true,
      message: '商品删除成功',
      data: {
        productId
      }
    });
  } catch (error) {
    console.error('删除商品错误:', error);
    res.status(500).json({
      success: false,
      message: '删除商品失败',
      error: error.message
    });
  }
};

/**
 * 获取商家订单列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getMerchantOrders = async (req, res) => {
  try {
    const merchantId = req.params.merchantId;
    const { status, page = 1, limit = 10 } = req.query;
    
    // 构建查询条件
    const query = { merchantId };
    if (status) {
      query.status = status;
    }
    
    // 计算分页
    const skip = (page - 1) * limit;
    
    // 查询订单
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'username nickname phone');
    
    // 查询订单总数
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取商家订单错误:', error);
    res.status(500).json({
      success: false,
      message: '获取商家订单失败',
      error: error.message
    });
  }
};

/**
 * 获取订单详情
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getOrderDetail = async (req, res) => {
  try {
    const { merchantId, orderId } = req.params;
    
    // 查询订单
    const order = await Order.findOne({
      _id: orderId,
      merchantId
    }).populate('userId', 'username nickname phone');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    // 查询物流信息
    const logistics = await Logistics.findOne({ orderId });
    
    res.json({
      success: true,
      data: {
        order,
        logistics
      }
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单详情失败',
      error: error.message
    });
  }
};

/**
 * 处理订单状态变更
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { merchantId, orderId } = req.params;
    const { status } = req.body;
    
    // 验证状态值
    const validStatuses = [
      'processing', 'shipped', 'completed', 'cancelled'
    ];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `无效的订单状态，必须为 ${validStatuses.join(', ')} 之一`
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
    
    // 检查状态变更的合法性
    if (order.status === 'cancelled' || order.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: '已完成或已取消的订单不能再变更状态'
      });
    }
    
    // 更新订单状态
    order.status = status;
    await order.save();
    
    // 更新物流状态（如果需要）
    if (status === 'shipped' || status === 'completed') {
      const logistics = await Logistics.findOne({ orderId });
      if (logistics) {
        logistics.status = status === 'shipped' ? 'shipped' : 'delivered';
        await logistics.save();
      }
    }
    
    res.json({
      success: true,
      message: '订单状态更新成功',
      data: {
        orderId,
        status
      }
    });
  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新订单状态失败',
      error: error.message
    });
  }
};

/**
 * 发货处理
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.shipOrder = async (req, res) => {
  try {
    const { merchantId, orderId } = req.params;
    const { 
      logisticsCompany, 
      logisticsNo,
      contact,
      remark 
    } = req.body;
    
    // 验证必填字段
    if (!logisticsCompany || !logisticsNo) {
      return res.status(400).json({
        success: false,
        message: '物流公司和物流单号为必填项'
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
    
    // 检查订单状态
    if (order.status !== 'paid' && order.status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: '只有已付款或处理中的订单才能发货'
      });
    }
    
    // 查询商家信息
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: '商家不存在'
      });
    }
    
    // 查询物流信息
    let logistics = await Logistics.findOne({ orderId });
    
    if (!logistics) {
      // 如果没有物流记录，创建一个
      logistics = new Logistics({
        orderId,
        orderNo: order.orderNo,
        logisticsNo: '',
        logisticsCompany: '',
        status: 'pending'
      });
    }
    
    // 更新订单状态
    order.status = 'shipped';
    await order.save();
    
    // 更新物流信息
    logistics.logisticsNo = logisticsNo;
    logistics.logisticsCompany = logisticsCompany;
    logistics.status = 'shipped';
    logistics.shippingTime = new Date();
    
    // 添加发货地址信息
    logistics.shipFrom = {
      merchantId,
      merchantName: merchant.name,
      address: `${merchant.address.province}${merchant.address.city}${merchant.address.district}${merchant.address.detail}`,
      contact: contact || merchant.name,
      phone: merchant.phone
    };
    
    // 添加收货地址信息
    logistics.shipTo = {
      userId: order.userId,
      name: order.shippingAddress.name,
      phone: order.shippingAddress.phone,
      address: `${order.shippingAddress.province}${order.shippingAddress.city}${order.shippingAddress.district}${order.shippingAddress.address}`
    };
    
    // 添加物流跟踪记录
    logistics.trackingInfo.push({
      time: new Date(),
      description: '商家已发货',
      location: `${merchant.address.city}${merchant.address.district}`
    });
    
    // 添加商家操作记录
    logistics.merchantActions.push({
      action: 'ship',
      time: new Date(),
      remark: remark || '商家发货'
    });
    
    await logistics.save();
    
    res.json({
      success: true,
      message: '发货成功',
      data: {
        orderId,
        logisticsNo,
        logisticsCompany,
        status: 'shipped'
      }
    });
  } catch (error) {
    console.error('发货错误:', error);
    res.status(500).json({
      success: false,
      message: '发货失败',
      error: error.message
    });
  }
};

/**
 * 更新物流信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.updateLogistics = async (req, res) => {
  try {
    const { merchantId, orderId } = req.params;
    const { 
      logisticsCompany, 
      logisticsNo,
      trackingInfo,
      remark
    } = req.body;
    
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
    
    // 查询物流信息
    const logistics = await Logistics.findOne({ orderId });
    
    if (!logistics) {
      return res.status(404).json({
        success: false,
        message: '物流信息不存在'
      });
    }
    
    // 更新物流信息
    if (logisticsCompany) {
      logistics.logisticsCompany = logisticsCompany;
    }
    
    if (logisticsNo) {
      logistics.logisticsNo = logisticsNo;
    }
    
    // 添加物流跟踪记录
    if (trackingInfo) {
      logistics.trackingInfo.push({
        time: trackingInfo.time || new Date(),
        description: trackingInfo.description,
        location: trackingInfo.location
      });
    }
    
    // 添加商家操作记录
    logistics.merchantActions.push({
      action: 'modify_logistics',
      time: new Date(),
      remark: remark || '商家更新物流信息'
    });
    
    await logistics.save();
    
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
}; 