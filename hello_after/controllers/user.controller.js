/**
 * 用户控制器
 * 处理用户相关业务逻辑
 */
const User = require('../database/user');
const { Order, Logistics } = require('../database/Logistics');
const { Product } = require('../database/Merchant');
const bcrypt = require('bcryptjs');

/**
 * 用户注册
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.register = async (req, res) => {
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
    
    // 密码加密 - 使用bcryptjs替代MD5
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
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
};

/**
 * 用户登录
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.login = async (req, res) => {
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
    
    // 验证密码 - 使用bcryptjs替代MD5比较
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
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
    
    // 登录成功，返回用户信息（不包含密码）
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;
    
    res.json({
      success: true,
      message: '登录成功',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('用户登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
};

/**
 * 获取用户个人信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    
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
};

/**
 * 更新用户个人信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
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
};

/**
 * 管理收货地址
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.manageAddress = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { action, addressId, addressData } = req.body;
    
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
            message: '地址信息不能为空'
          });
        }
        
        // 如果设置为默认地址，先将其他地址设为非默认
        if (addressData.isDefault) {
          user.addresses.forEach(addr => {
            addr.isDefault = false;
          });
        }
        
        // 如果这是第一个地址，则设为默认
        if (user.addresses.length === 0) {
          addressData.isDefault = true;
        }
        
        user.addresses.push(addressData);
        result = await user.save();
        break;
        
      case 'update':
        // 更新地址
        if (!addressId || !addressData) {
          return res.status(400).json({
            success: false,
            message: '地址ID和地址信息不能为空'
          });
        }
        
        // 查找要更新的地址
        const addressIndex = user.addresses.findIndex(
          addr => addr._id.toString() === addressId
        );
        
        if (addressIndex === -1) {
          return res.status(404).json({
            success: false,
            message: '地址不存在'
          });
        }
        
        // 如果设置为默认地址，先将其他地址设为非默认
        if (addressData.isDefault) {
          user.addresses.forEach(addr => {
            addr.isDefault = false;
          });
        }
        
        // 更新地址
        user.addresses[addressIndex] = {
          ...user.addresses[addressIndex].toObject(),
          ...addressData
        };
        
        result = await user.save();
        break;
        
      case 'delete':
        // 删除地址
        if (!addressId) {
          return res.status(400).json({
            success: false,
            message: '地址ID不能为空'
          });
        }
        
        // 查找要删除的地址
        const addrIndex = user.addresses.findIndex(
          addr => addr._id.toString() === addressId
        );
        
        if (addrIndex === -1) {
          return res.status(404).json({
            success: false,
            message: '地址不存在'
          });
        }
        
        // 如果删除的是默认地址，则将第一个地址设为默认
        const isDefault = user.addresses[addrIndex].isDefault;
        user.addresses.splice(addrIndex, 1);
        
        if (isDefault && user.addresses.length > 0) {
          user.addresses[0].isDefault = true;
        }
        
        result = await user.save();
        break;
        
      case 'setDefault':
        // 设置默认地址
        if (!addressId) {
          return res.status(400).json({
            success: false,
            message: '地址ID不能为空'
          });
        }
        
        // 将所有地址设为非默认
        user.addresses.forEach(addr => {
          addr.isDefault = addr._id.toString() === addressId;
        });
        
        result = await user.save();
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: '无效的操作类型'
        });
    }
    
    // 返回更新后的地址列表
    res.json({
      success: true,
      message: '地址操作成功',
      data: result.addresses
    });
  } catch (error) {
    console.error('管理收货地址错误:', error);
    res.status(500).json({
      success: false,
      message: '管理收货地址失败',
      error: error.message
    });
  }
};

/**
 * 获取用户订单列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { status, page = 1, limit = 10 } = req.query;
    
    // 构建查询条件
    const query = { userId };
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
      .populate('merchantId', 'name logo');
    
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
    console.error('获取用户订单错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户订单失败',
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
    const { userId, orderId } = req.params;
    
    // 查询订单
    const order = await Order.findOne({
      _id: orderId,
      userId
    }).populate('merchantId', 'name logo phone');
    
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
 * 用户确认收货
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.confirmReceipt = async (req, res) => {
  try {
    const { userId, orderId } = req.params;
    const { remark } = req.body;
    
    // 查询订单
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
    if (order.status !== 'shipped' && order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: '只有已发货或已送达的订单才能确认收货'
      });
    }
    
    // 更新订单状态
    order.status = 'completed';
    await order.save();
    
    // 更新物流状态
    const logistics = await Logistics.findOne({ orderId });
    if (logistics) {
      logistics.status = 'delivered';
      logistics.actualDeliveryTime = new Date();
      
      // 添加用户操作记录
      logistics.userActions.push({
        action: 'confirm_receipt',
        time: new Date(),
        remark: remark || '用户确认收货'
      });
      
      await logistics.save();
    }
    
    res.json({
      success: true,
      message: '确认收货成功',
      data: {
        orderId,
        status: 'completed'
      }
    });
  } catch (error) {
    console.error('确认收货错误:', error);
    res.status(500).json({
      success: false,
      message: '确认收货失败',
      error: error.message
    });
  }
};

/**
 * 用户催促发货
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.urgeShipping = async (req, res) => {
  try {
    const { userId, orderId } = req.params;
    const { remark } = req.body;
    
    // 查询订单
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
    if (order.status !== 'paid' && order.status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: '只有已付款或处理中的订单才能催促发货'
      });
    }
    
    // 更新物流记录
    const logistics = await Logistics.findOne({ orderId });
    if (logistics) {
      // 添加用户操作记录
      logistics.userActions.push({
        action: 'urge_shipping',
        time: new Date(),
        remark: remark || '用户催促发货'
      });
      
      await logistics.save();
    }
    
    res.json({
      success: true,
      message: '催促发货成功',
      data: {
        orderId,
        urgeTime: new Date()
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
};

/**
 * 购物车操作
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.manageCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { action, productId, quantity, selected } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    switch (action) {
      case 'add':
        // 添加商品到购物车
        if (!productId || !quantity) {
          return res.status(400).json({
            success: false,
            message: '商品ID和数量不能为空'
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
        
        // 检查商品状态
        if (product.status !== 'on_sale') {
          return res.status(400).json({
            success: false,
            message: '商品已下架或售罄'
          });
        }
        
        // 检查购物车中是否已存在该商品
        const existingItem = user.cart.find(
          item => item.productId.toString() === productId
        );
        
        if (existingItem) {
          // 更新数量
          existingItem.quantity += parseInt(quantity);
          existingItem.selected = true;
        } else {
          // 添加新商品
          user.cart.push({
            productId,
            quantity: parseInt(quantity),
            selected: true,
            addTime: new Date()
          });
        }
        
        await user.save();
        break;
        
      case 'update':
        // 更新购物车商品
        if (!productId) {
          return res.status(400).json({
            success: false,
            message: '商品ID不能为空'
          });
        }
        
        // 查找购物车中的商品
        const itemIndex = user.cart.findIndex(
          item => item.productId.toString() === productId
        );
        
        if (itemIndex === -1) {
          return res.status(404).json({
            success: false,
            message: '购物车中不存在该商品'
          });
        }
        
        // 更新数量
        if (quantity !== undefined) {
          if (parseInt(quantity) <= 0) {
            // 如果数量小于等于0，从购物车中移除
            user.cart.splice(itemIndex, 1);
          } else {
            user.cart[itemIndex].quantity = parseInt(quantity);
          }
        }
        
        // 更新选中状态
        if (selected !== undefined) {
          user.cart[itemIndex].selected = selected;
        }
        
        await user.save();
        break;
        
      case 'remove':
        // 从购物车中移除商品
        if (!productId) {
          return res.status(400).json({
            success: false,
            message: '商品ID不能为空'
          });
        }
        
        // 查找并移除商品
        user.cart = user.cart.filter(
          item => item.productId.toString() !== productId
        );
        
        await user.save();
        break;
        
      case 'clear':
        // 清空购物车
        user.cart = [];
        await user.save();
        break;
        
      case 'selectAll':
        // 全选或全不选
        const selectStatus = req.body.selectAll !== false;
        user.cart.forEach(item => {
          item.selected = selectStatus;
        });
        
        await user.save();
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: '无效的操作类型'
        });
    }
    
    // 查询最新的购物车商品详情
    const cartWithDetails = [];
    for (const item of user.cart) {
      const product = await Product.findById(item.productId);
      if (product) {
        cartWithDetails.push({
          ...item.toObject(),
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            thumbnail: product.thumbnail,
            stock: product.stock
          }
        });
      }
    }
    
    res.json({
      success: true,
      message: '购物车操作成功',
      data: cartWithDetails
    });
  } catch (error) {
    console.error('购物车操作错误:', error);
    res.status(500).json({
      success: false,
      message: '购物车操作失败',
      error: error.message
    });
  }
};

/**
 * 创建新订单
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.createOrder = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { 
      merchantId, 
      items, 
      addressId,
      remark 
    } = req.body;
    
    // 验证必填字段
    if (!merchantId || !items || !items.length || !addressId) {
      return res.status(400).json({
        success: false,
        message: '商家ID、商品信息和收货地址为必填项'
      });
    }
    
    // 查询用户
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 查询收货地址
    const shippingAddress = user.addresses.find(
      addr => addr._id.toString() === addressId
    );
    
    if (!shippingAddress) {
      return res.status(404).json({
        success: false,
        message: '收货地址不存在'
      });
    }
    
    // 准备订单商品
    const orderItems = [];
    let totalAmount = 0;
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `商品不存在: ${item.productId}`
        });
      }
      
      if (product.status !== 'on_sale') {
        return res.status(400).json({
          success: false,
          message: `商品已下架或售罄: ${product.name}`
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `商品库存不足: ${product.name}`
        });
      }
      
      const subtotal = product.price * item.quantity;
      
      orderItems.push({
        productId: product._id,
        productName: product.name,
        productImage: product.thumbnail,
        price: product.price,
        quantity: item.quantity,
        specifications: item.specifications,
        subtotal
      });
      
      totalAmount += subtotal;
      
      // 更新商品库存
      product.stock -= item.quantity;
      product.sold += item.quantity;
      await product.save();
    }
    
    // 生成订单编号
    const orderNo = generateOrderNo();
    
    // 创建订单
    const newOrder = new Order({
      orderNo,
      userId,
      merchantId,
      items: orderItems,
      totalAmount,
      actualPaid: totalAmount, // 这里简化处理，实际金额等于总金额
      shippingAddress: {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        province: shippingAddress.province,
        city: shippingAddress.city,
        district: shippingAddress.district,
        address: shippingAddress.address
      },
      status: 'pending_payment',
      remark: remark || ''
    });
    
    await newOrder.save();
    
    // 创建物流记录
    const newLogistics = new Logistics({
      orderId: newOrder._id,
      orderNo,
      logisticsNo: '', // 发货时才会生成
      logisticsCompany: '',
      status: 'pending',
      // 暂不填写发货和收货信息，等待商家发货
    });
    
    await newLogistics.save();
    
    res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: {
        orderId: newOrder._id,
        orderNo
      }
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({
      success: false,
      message: '创建订单失败',
      error: error.message
    });
  }
};

/**
 * 生成订单编号
 * @returns {string} 订单编号
 */
function generateOrderNo() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `ORD${year}${month}${day}${hours}${minutes}${seconds}${random}`;
} 