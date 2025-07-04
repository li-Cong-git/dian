var express = require('express');
var router = express.Router();
const { Merchant, Product } = require('../database/Merchant');
const { Order, Logistics } = require('../database/Logistics');
const crypto = require('crypto');

/**
 * 商品分类相关路由
 */
// 获取商品分类列表
router.get('/categories', async (req, res) => {
  try {
    // 定义默认分类列表
    const defaultCategories = [
      { id: 'clothing', name: '服装' },
      { id: 'electronics', name: '电子产品' },
      { id: 'food', name: '食品' },
      { id: 'furniture', name: '家具' },
      { id: 'books', name: '图书' },
      { id: 'beauty', name: '美妆' },
      { id: 'sports', name: '运动户外' },
      { id: 'toys', name: '玩具' },
      { id: 'health', name: '健康保健' },
      { id: 'others', name: '其他' }
    ];
    
    // 返回分类列表
    res.json({
      success: true,
      data: defaultCategories
    });
  } catch (error) {
    console.error('获取商品分类错误:', error);
    res.status(500).json({
      success: false,
      message: '获取商品分类失败',
      error: error.message
    });
  }
});

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
    const { accountName, password } = req.body;
    
    // 验证必填字段
    if (!accountName || !password) {
      return res.status(400).json({
        success: false,
        message: '账户名和密码为必填项'
      });
    }
    // 查找商家
    const merchant = await Merchant.find({accountName: accountName});
    console.log(merchant);
    
    
    if (!merchant[0]) {
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
    
    if (merchant[0].password !== hashedPassword) {
      console.log(hashedPassword);
      
      return res.status(400).json({
        success: false,
        message: '账户名或密码错误'
      });
    }
    
    // 检查账户状态
    if (merchant[0].status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '账户已被暂停或关闭'
      });
    }
    
    // 登录成功，返回商家信息（不包含密码）
    const merchantWithoutPassword = merchant[0].toObject();
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
// 商品管理统一接口
router.post('/products/manage', async (req, res) => {
  try {
    const { action, merchantId, productId, product, productData, page = 1, limit = 10, status, category, sort, order } = req.body;
    
    if (!action) {
      return res.status(400).json({
        success: false,
        message: '缺少action参数'
      });
    }
    
    // 商品列表查询
    if (action === 'list') {
      if (!merchantId) {
        return res.status(400).json({
          success: false,
          message: '缺少merchantId参数'
        });
      }
      
      // 构建查询条件
      const query = { merchantId };
      if (status) query.status = status;
      if (category) query.category = category;
      
      // 构建排序
      const sortOption = {};
      if (sort && order) {
        sortOption[sort] = order === 'desc' ? -1 : 1;
      } else {
        sortOption.createdAt = -1; // 默认按创建时间倒序
      }
      
      // 分页查询
      const skip = (page - 1) * limit;
      
      // 执行查询
      const products = await Product.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit));
        
      // 获取总数
      const total = await Product.countDocuments(query);
      
      return res.json({
        success: true,
        data: {
          products,
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      });
    }
    
    // 添加商品
    if (action === 'add') {
      console.log('添加商品请求数据:', product);
      
      if (!product || !product.merchantId) {
        return res.status(400).json({
          success: false,
          message: '商品信息不完整'
        });
      }
      
      try {
        // 确保images是字符串数组
        if (product.images && Array.isArray(product.images)) {
          // 检查数组中是否有对象，如果有则将其转换为字符串
          product.images = product.images.map(img => {
            if (typeof img === 'object' && img !== null && img.url) {
              console.log('转换image对象为URL:', img);
              return img.url;
            }
            return String(img);
          });
        } else if (!product.images) {
          product.images = [];
        }
        
        console.log('处理后的images数据:', product.images);
        
        const newProduct = new Product(product);
        console.log('准备保存的商品数据:', newProduct);
        await newProduct.save();
        
        return res.status(201).json({
          success: true,
          message: '商品添加成功',
          data: newProduct
        });
      } catch (err) {
        console.error('保存商品时出错:', err);
        return res.status(500).json({
          success: false,
          message: '保存商品失败',
          error: err.message
        });
      }
    }
    
    // 更新商品
    if (action === 'update') {
      if (!productId || !productData) {
        return res.status(400).json({
          success: false,
          message: '缺少productId或更新数据'
        });
      }
      
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $set: productData },
        { new: true }
      );
      
      if (!updatedProduct) {
        return res.status(404).json({
          success: false,
          message: '商品不存在'
        });
      }
      
      return res.json({
        success: true,
        message: '商品更新成功',
        data: updatedProduct
      });
    }
    
    // 删除商品
    if (action === 'delete') {
      if (!productId || !merchantId) {
        return res.status(400).json({
          success: false,
          message: '缺少productId或merchantId参数'
        });
      }
      
      // 检查商品是否属于该商家
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: '商品不存在'
        });
      }
      
      if (product.merchantId.toString() !== merchantId) {
        return res.status(403).json({
          success: false,
          message: '无权操作此商品'
        });
      }
      
      // 物理删除商品
      await Product.findByIdAndDelete(productId);
      
      return res.json({
        success: true,
        message: '商品删除成功'
      });
    }
    
    // 获取商品详情
    if (action === 'detail') {
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: '缺少productId参数'
        });
      }
      
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: '商品不存在'
        });
      }
      
      return res.json({
        success: true,
        data: product
      });
    }
    
    // 未知操作
    return res.status(400).json({
      success: false,
      message: '不支持的action类型'
    });
    
  } catch (error) {
    console.error('商品管理操作错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败',
      error: error.message
    });
  }
});

// 获取商品分类
router.get('/categories', async (req, res) => {
  try {
    // 返回预定义的商品分类
    const categories = [
      { id: 'food', name: '食品' },
      { id: 'clothing', name: '服装' },
      { id: 'electronics', name: '电子产品' },
      { id: 'home', name: '家居用品' },
      { id: 'beauty', name: '美妆个护' },
      { id: 'sports', name: '运动户外' },
      { id: 'toys', name: '玩具' },
      { id: 'books', name: '图书' },
      { id: 'digital', name: '数码产品' },
      { id: 'other', name: '其他' }
    ];
    
    return res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取商品分类错误:', error);
    res.status(500).json({
      success: false,
      message: '获取商品分类失败',
      error: error.message
    });
  }
});

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
    const { productId, merchantId } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: '缺少商品ID参数'
      });
    }
    
    console.log('获取商品详情请求:', { productId, merchantId });
    
    let query = { _id: productId };
    // 如果提供了商家ID，则添加到查询条件
    if (merchantId) {
      query.merchantId = merchantId;
    }
    
    // 查询商品
    const product = await Product.findOne(query);
    
    if (!product) {
      console.log('商品不存在:', productId);
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }
    
    console.log('找到商品:', product.name);
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

// 修改密码
router.post('/password/change', async (req, res) => {
  try {
    const { merchantId, currentPassword, newPassword } = req.body;
    
    if (!merchantId || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // 查找商家
    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: '商家不存在'
      });
    }
    
    // 验证当前密码
    const hashedCurrentPassword = crypto
      .createHash('md5')
      .update(currentPassword)
      .digest('hex');
    
    if (merchant.password !== hashedCurrentPassword) {
      return res.status(400).json({
        success: false,
        message: '当前密码不正确'
      });
    }
    
    // 生成新密码的哈希
    const hashedNewPassword = crypto
      .createHash('md5')
      .update(newPassword)
      .digest('hex');
    
    // 更新密码
    merchant.password = hashedNewPassword;
    await merchant.save();
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败',
      error: error.message
    });
  }
});

// 上传商家Logo
router.post('/logo/upload', async (req, res) => {
  try {
    const { merchantId, logoBase64 } = req.body;
    
    if (!merchantId || !logoBase64) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // 查找商家
    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: '商家不存在'
      });
    }
    
    // 在实际应用中，这里应该处理图片上传到云存储
    // 例如上传到OSS、S3等服务，并获取URL
    // 为了演示，我们假设已经处理好了，直接返回一个模拟的URL
    
    // 模拟上传延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 生成一个随机的logo URL
    const timestamp = Date.now();
    const logoUrl = `https://example.com/merchant-logos/${merchantId}_${timestamp}.jpg`;
    
    // 更新商家Logo
    merchant.logo = logoUrl;
    await merchant.save();
    
    res.json({
      success: true,
      message: 'Logo上传成功',
      data: {
        logoUrl
      }
    });
  } catch (error) {
    console.error('上传Logo错误:', error);
    res.status(500).json({
      success: false,
      message: '上传Logo失败',
      error: error.message
    });
  }
});

module.exports = router; 