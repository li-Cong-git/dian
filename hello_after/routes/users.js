var express = require('express');
var router = express.Router();
const User = require('../database/user');
const { Order, Logistics } = require('../database/Logistics');
const { Product } = require('../database/Merchant');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth.middleware');
const jwtConfig = require('../config/jwt.config');

/**
 * 用户认证相关路由
 */
// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, phone, email, nickname } = req.body;
    
    // 验证必填字段
    if (!username || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: '用户名、密码和手机号为必填项'
      });
    }
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }
    
    // 检查邮箱是否已存在（如果提供了邮箱）
    if (email && email.trim() !== '') {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: '该邮箱已被注册'
        });
      }
    }
    
    // 密码加密
    const hashedPassword = crypto
      .createHash('md5')
      .update(password)
      .digest('hex');
    
    // 创建新用户
    const newUser = new User({
      username,
      password: hashedPassword,
      phone,
      email: email || '',
      nickname: nickname || username
    });
    
    await newUser.save();
    
    // 返回成功响应（不包含密码）
    const userWithoutPassword = newUser.toObject();
    delete userWithoutPassword.password;
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('用户注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: error.message
    });
  }
});

// 用户登录
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
    
    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
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
    
    if (user.password !== hashedPassword) {
      return res.status(400).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 检查账户状态
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用'
      });
    }
    
    // 登录成功，生成JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role
      },
      jwtConfig.secret,
      jwtConfig.options
    );
    
    // 返回用户信息（不包含密码）和token
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('用户登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
});

/**
 * 用户个人信息相关路由
 * 以下所有路由都需要验证JWT令牌
 */
// 获取用户个人信息
router.post('/profile/get', verifyToken, async (req, res) => {
  try {
    // 从JWT令牌中获取用户ID，而不是从请求体中获取
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 返回用户信息（不包含密码）
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;
    
    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
});

// 更新用户个人信息
router.post('/profile/update', verifyToken, async (req, res) => {
  try {
    // 从JWT令牌中获取用户ID，而不是从请求体中获取
    const userId = req.user.userId;
    const updateData = req.body;
    
    // 不允许更新敏感字段
    delete updateData.password;
    delete updateData.role;
    delete updateData.status;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 返回更新后的用户信息（不包含密码）
    const userWithoutPassword = updatedUser.toObject();
    delete userWithoutPassword.password;
    
    res.json({
      success: true,
      message: '用户信息更新成功',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败',
      error: error.message
    });
  }
});

/**
 * 收货地址相关路由
 */
// 管理收货地址（添加、更新、删除、设置默认）
router.post('/address/manage', verifyToken, async (req, res) => {
  try {
    // 从JWT令牌中获取用户ID
    const userId = req.user.userId;
    const { action, addressData, addressId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    let result;
    switch (action) {
      case 'add':
        // 添加新地址
        if (!addressData) {
          return res.status(400).json({
            success: false,
            message: '缺少地址数据'
          });
        }
        
        // 如果是第一个地址，设为默认
        if (user.addresses.length === 0) {
          addressData.isDefault = true;
        }
        
        // 如果设置为默认，先将其他地址设为非默认
        if (addressData.isDefault) {
          user.addresses.forEach(addr => {
            addr.isDefault = false;
          });
        }
        
        user.addresses.push(addressData);
        result = await user.save();
        
        res.json({
          success: true,
          message: '地址添加成功',
          data: result.addresses
        });
        break;
      
      case 'update':
        // 更新地址
        if (!addressId || !addressData) {
          return res.status(400).json({
            success: false,
            message: '缺少地址ID或地址数据'
          });
        }
        
        const addressIndex = user.addresses.findIndex(
          addr => addr._id.toString() === addressId
        );
        
        if (addressIndex === -1) {
          return res.status(404).json({
            success: false,
            message: '地址不存在'
          });
        }
        
        // 如果设置为默认，先将其他地址设为非默认
        if (addressData.isDefault) {
          user.addresses.forEach(addr => {
            addr.isDefault = false;
          });
        }
        
        // 更新地址信息
        user.addresses[addressIndex] = {
          ...user.addresses[addressIndex].toObject(),
          ...addressData
        };
        
        result = await user.save();
        
        res.json({
          success: true,
          message: '地址更新成功',
          data: result.addresses
        });
        break;
      
      case 'delete':
        // 删除地址
        if (!addressId) {
          return res.status(400).json({
            success: false,
            message: '缺少地址ID'
          });
        }
        
        const deletedAddressIndex = user.addresses.findIndex(
          addr => addr._id.toString() === addressId
        );
        
        if (deletedAddressIndex === -1) {
          return res.status(404).json({
            success: false,
            message: '地址不存在'
          });
        }
        
        // 检查是否删除的是默认地址
        const isDefaultDeleted = user.addresses[deletedAddressIndex].isDefault;
        
        // 删除地址
        user.addresses.splice(deletedAddressIndex, 1);
        
        // 如果删除的是默认地址，且还有其他地址，则将第一个地址设为默认
        if (isDefaultDeleted && user.addresses.length > 0) {
          user.addresses[0].isDefault = true;
        }
        
        result = await user.save();
        
        res.json({
          success: true,
          message: '地址删除成功',
          data: result.addresses
        });
        break;
      
      case 'setDefault':
        // 设置默认地址
        if (!addressId) {
          return res.status(400).json({
            success: false,
            message: '缺少地址ID'
          });
        }
        
        // 将所有地址设为非默认
        user.addresses.forEach(addr => {
          addr.isDefault = false;
        });
        
        // 找到目标地址并设为默认
        const targetAddressIndex = user.addresses.findIndex(
          addr => addr._id.toString() === addressId
        );
        
        if (targetAddressIndex === -1) {
          return res.status(404).json({
            success: false,
            message: '地址不存在'
          });
        }
        
        user.addresses[targetAddressIndex].isDefault = true;
        
        result = await user.save();
        
        res.json({
          success: true,
          message: '默认地址设置成功',
          data: result.addresses
        });
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: '无效的操作类型'
        });
    }
  } catch (error) {
    console.error('管理收货地址错误:', error);
    res.status(500).json({
      success: false,
      message: '管理收货地址失败',
      error: error.message
    });
  }
});

/**
 * 订单相关路由
 */
// 获取用户订单列表
router.post('/orders/list', verifyToken, async (req, res) => {
  try {
    // 从JWT令牌中获取用户ID
    const userId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.body;
    
    // 构建查询条件
    const query = { userId };
    if (status) {
      query.status = status;
    }
    
    // 计算分页
    const skip = (page - 1) * limit;
    
    // 查询订单并填充商品信息
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('products.productId')
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
    console.error('获取用户订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败',
      error: error.message
    });
  }
});

// 获取订单详情
router.post('/orders/detail', verifyToken, async (req, res) => {
  try {
    // 从JWT令牌中获取用户ID
    const userId = req.user.userId;
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '缺少订单ID参数'
      });
    }
    
    // 查询订单并填充相关信息
    const order = await Order.findOne({
      _id: orderId,
      userId
    })
      .populate('products.productId')
      .populate('logisticsId')
      .populate('merchantId');
    
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

// 创建新订单
router.post('/orders/create', verifyToken, async (req, res) => {
  try {
    // 从JWT令牌中获取用户ID
    const userId = req.user.userId;
    const { 
      products, 
      addressId, 
      paymentMethod,
      remark
    } = req.body;
    
    if (!products || !products.length || !addressId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // 查找用户
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 查找用户地址
    const address = user.addresses.find(
      addr => addr._id.toString() === addressId
    );
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: '收货地址不存在'
      });
    }
    
    // 处理订单商品
    let orderProducts = [];
    let totalAmount = 0;
    let merchantId = null;
    
    // 查询商品信息并计算金额
    for (const item of products) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `商品不存在: ${item.productId}`
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `商品库存不足: ${product.name}`
        });
      }
      
      if (product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `商品已下架: ${product.name}`
        });
      }
      
      // 记录商家ID（假设一个订单只能包含一个商家的商品）
      if (!merchantId) {
        merchantId = product.merchantId;
      } else if (merchantId.toString() !== product.merchantId.toString()) {
        return res.status(400).json({
          success: false,
          message: '一个订单只能包含同一个商家的商品'
        });
      }
      
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      orderProducts.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
        totalPrice: itemTotal
      });
      
      // 更新商品库存
      product.stock -= item.quantity;
      await product.save();
    }
    
    // 创建订单
    const newOrder = new Order({
      orderNo: generateOrderNo(),
      userId,
      merchantId,
      products: orderProducts,
      shippingAddress: address,
      totalAmount,
      paymentMethod: paymentMethod || 'online',
      status: 'pending',
      remark: remark || ''
    });
    
    // 保存订单
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

// 确认收货
router.post('/orders/confirm-receipt', verifyToken, async (req, res) => {
  try {
    // 从JWT令牌中获取用户ID
    const userId = req.user.userId;
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '缺少订单ID参数'
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
        message: '订单不存在'
      });
    }
    
    // 检查订单状态
    if (order.status !== 'shipped') {
      return res.status(400).json({
        success: false,
        message: '只有已发货的订单才能确认收货'
      });
    }
    
    // 更新订单状态
    order.status = 'completed';
    order.completedAt = new Date();
    await order.save();
    
    // 如果有物流信息，也更新物流状态
    if (order.logisticsId) {
      const logistics = await Logistics.findById(order.logisticsId);
      if (logistics) {
        logistics.status = 'delivered';
        logistics.tracking.push({
          status: 'delivered',
          description: '包裹已送达，用户已确认收货',
          time: new Date()
        });
        await logistics.save();
      }
    }
    
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

// 催促发货
router.post('/orders/urge-shipping', verifyToken, async (req, res) => {
  try {
    // 从JWT令牌中获取用户ID
    const userId = req.user.userId;
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '缺少订单ID参数'
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
        message: '订单不存在'
      });
    }
    
    // 检查订单状态
    if (order.status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: '只有处理中的订单才能催促发货'
      });
    }
    
    // 记录催促信息
    if (!order.urgeCount) {
      order.urgeCount = 0;
    }
    
    order.urgeCount += 1;
    order.lastUrgeTime = new Date();
    await order.save();
    
    // 这里可以添加通知商家的逻辑
    
    res.json({
      success: true,
      message: '已成功催促商家发货',
      data: {
        urgeCount: order.urgeCount,
        lastUrgeTime: order.lastUrgeTime
      }
    });
  } catch (error) {
    console.error('催促发货错误:', error);
    res.status(500).json({
      success: false,
      message: '催促发货失败',
      error: error.message
    });
  }
});

/**
 * 购物车相关路由
 */
// 购物车操作（添加、更新、删除、清空、全选）
router.post('/cart/manage', verifyToken, async (req, res) => {
  try {
    // 从JWT令牌中获取用户ID
    const userId = req.user.userId;
    const { action, productId, quantity, selected } = req.body;
    
    // 查找用户
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 如果用户没有购物车，初始化一个
    if (!user.cart) {
      user.cart = {
        items: [],
        totalQuantity: 0
      };
    }
    
    let result;
    switch (action) {
      case 'add':
        // 添加商品到购物车
        if (!productId || !quantity) {
          return res.status(400).json({
            success: false,
            message: '缺少商品ID或数量'
          });
        }
        
        // 检查商品是否存在
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: '商品不存在'
          });
        }
        
        // 检查商品是否已下架
        if (product.status !== 'active') {
          return res.status(400).json({
            success: false,
            message: '商品已下架'
          });
        }
        
        // 检查库存
        if (product.stock < quantity) {
          return res.status(400).json({
            success: false,
            message: '商品库存不足'
          });
        }
        
        // 检查购物车中是否已有此商品
        const existingItemIndex = user.cart.items.findIndex(
          item => item.productId.toString() === productId
        );
        
        if (existingItemIndex > -1) {
          // 更新现有商品数量
          user.cart.items[existingItemIndex].quantity += quantity;
          
          // 检查更新后的数量是否超过库存
          if (user.cart.items[existingItemIndex].quantity > product.stock) {
            user.cart.items[existingItemIndex].quantity = product.stock;
          }
        } else {
          // 添加新商品到购物车
          user.cart.items.push({
            productId,
            quantity,
            selected: true
          });
        }
        
        // 更新购物车总数量
        user.cart.totalQuantity = user.cart.items.reduce(
          (total, item) => total + item.quantity,
          0
        );
        
        result = await user.save();
        
        // 填充商品信息后返回
        await User.populate(result, {
          path: 'cart.items.productId',
          model: 'Product'
        });
        
        res.json({
          success: true,
          message: '商品已添加到购物车',
          data: result.cart
        });
        break;
      
      case 'update':
        // 更新购物车商品数量或选中状态
        if (!productId) {
          return res.status(400).json({
            success: false,
            message: '缺少商品ID'
          });
        }
        
        // 查找商品在购物车中的位置
        const itemIndex = user.cart.items.findIndex(
          item => item.productId.toString() === productId
        );
        
        if (itemIndex === -1) {
          return res.status(404).json({
            success: false,
            message: '购物车中没有此商品'
          });
        }
        
        // 更新数量
        if (quantity !== undefined) {
          if (quantity <= 0) {
            // 如果数量为0或负数，从购物车中移除
            user.cart.items.splice(itemIndex, 1);
          } else {
            // 检查库存
            const productToUpdate = await Product.findById(productId);
            if (!productToUpdate) {
              return res.status(404).json({
                success: false,
                message: '商品不存在'
              });
            }
            
            if (quantity > productToUpdate.stock) {
              return res.status(400).json({
                success: false,
                message: '商品库存不足'
              });
            }
            
            user.cart.items[itemIndex].quantity = quantity;
          }
        }
        
        // 更新选中状态
        if (selected !== undefined) {
          user.cart.items[itemIndex].selected = selected;
        }
        
        // 更新购物车总数量
        user.cart.totalQuantity = user.cart.items.reduce(
          (total, item) => total + item.quantity,
          0
        );
        
        result = await user.save();
        
        // 填充商品信息后返回
        await User.populate(result, {
          path: 'cart.items.productId',
          model: 'Product'
        });
        
        res.json({
          success: true,
          message: '购物车已更新',
          data: result.cart
        });
        break;
      
      case 'remove':
        // 从购物车中移除商品
        if (!productId) {
          return res.status(400).json({
            success: false,
            message: '缺少商品ID'
          });
        }
        
        // 过滤掉要删除的商品
        user.cart.items = user.cart.items.filter(
          item => item.productId.toString() !== productId
        );
        
        // 更新购物车总数量
        user.cart.totalQuantity = user.cart.items.reduce(
          (total, item) => total + item.quantity,
          0
        );
        
        result = await user.save();
        
        // 填充商品信息后返回
        await User.populate(result, {
          path: 'cart.items.productId',
          model: 'Product'
        });
        
        res.json({
          success: true,
          message: '商品已从购物车中移除',
          data: result.cart
        });
        break;
      
      case 'clear':
        // 清空购物车
        user.cart.items = [];
        user.cart.totalQuantity = 0;
        
        result = await user.save();
        
        res.json({
          success: true,
          message: '购物车已清空',
          data: result.cart
        });
        break;
      
      case 'selectAll':
        // 全选/取消全选
        const selectStatus = req.body.selectAll !== undefined
          ? req.body.selectAll
          : true;
        
        user.cart.items.forEach(item => {
          item.selected = selectStatus;
        });
        
        result = await user.save();
        
        // 填充商品信息后返回
        await User.populate(result, {
          path: 'cart.items.productId',
          model: 'Product'
        });
        
        res.json({
          success: true,
          message: selectStatus ? '全部商品已选中' : '全部商品已取消选中',
          data: result.cart
        });
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: '无效的操作类型'
        });
    }
  } catch (error) {
    console.error('购物车操作错误:', error);
    res.status(500).json({
      success: false,
      message: '购物车操作失败',
      error: error.message
    });
  }
});

/**
 * 辅助函数 - 生成订单编号
 */
function generateOrderNo() {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `ORD${year}${month}${day}${hours}${minutes}${seconds}${random}`;
}

module.exports = router;
