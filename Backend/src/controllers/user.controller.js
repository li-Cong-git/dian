const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AppError } = require('../middlewares/error.middleware');

/**
 * 生成JWT令牌
 * @param {string} id 用户ID
 * @returns {string} JWT令牌
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // 令牌有效期
  });
};

/**
 * 用户注册
 * POST /api/users/register
 */
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 检查用户是否已存在
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new AppError('该邮箱已被注册', 400);
    }

    // 创建新用户
    const user = await User.create({
      name,
      email,
      password, // 密码会在模型的pre save钩子中被加密
    });

    // 生成令牌
    const token = generateToken(user._id);

    // 返回用户信息和令牌
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 用户登录
 * POST /api/users/login
 */
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('用户不存在', 401);
    }

    // 验证密码
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      throw new AppError('邮箱或密码错误', 401);
    }

    // 生成令牌
    const token = generateToken(user._id);

    // 返回用户信息和令牌
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户个人资料
 * GET /api/users/profile
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    // 用户已由auth中间件加载到req.user
    const user = req.user;

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone,
      addresses: user.addresses,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新用户个人资料
 * PUT /api/users/profile
 */
exports.updateUserProfile = async (req, res, next) => {
  try {
    const { name, email, password, avatar, phone } = req.body;

    // 获取当前用户
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    // 更新字段
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;
    if (avatar) user.avatar = avatar;
    if (phone) user.phone = phone;

    // 保存更新后的用户
    const updatedUser = await user.save();

    // 如果更新了密码或敏感信息，生成新令牌
    const token = generateToken(updatedUser._id);

    // 返回更新后的信息
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      phone: updatedUser.phone,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户地址列表
 * GET /api/users/addresses
 */
exports.getUserAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.addresses);
  } catch (error) {
    next(error);
  }
};

/**
 * 添加用户地址
 * POST /api/users/addresses
 */
exports.addUserAddress = async (req, res, next) => {
  try {
    const address = req.body;
    const user = await User.findById(req.user._id);

    // 使用用户模型中定义的添加地址方法
    await user.addAddress(address);

    res.status(201).json(user.addresses);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新用户地址
 * PUT /api/users/addresses/:id
 */
exports.updateUserAddress = async (req, res, next) => {
  try {
    const addressId = req.params.id;
    const updateData = req.body;
    const user = await User.findById(req.user._id);

    // 查找地址索引
    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      throw new AppError('地址不存在', 404);
    }

    // 如果新地址被设置为默认，则将其他地址的默认标志设为false
    if (updateData.isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // 更新地址
    Object.assign(user.addresses[addressIndex], updateData);

    await user.save();

    res.json(user.addresses);
  } catch (error) {
    next(error);
  }
};

/**
 * 删除用户地址
 * DELETE /api/users/addresses/:id
 */
exports.deleteUserAddress = async (req, res, next) => {
  try {
    const addressId = req.params.id;
    const user = await User.findById(req.user._id);

    user.addresses = user.addresses.filter(
      addr => addr._id.toString() !== addressId
    );

    // 如果删除后还有地址，并且没有默认地址，则将第一个地址设为默认
    if (user.addresses.length > 0 &&
      !user.addresses.some(addr => addr.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({ message: '地址已删除', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

/**
 * 管理用户收藏列表
 * POST /api/users/wishlist
 */
exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    // 添加到收藏列表
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { wishlist: productId } }, // 使用$addToSet确保不重复添加
      { new: true }
    ).populate('wishlist');

    res.json(user.wishlist);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户收藏列表
 * GET /api/users/wishlist
 */
exports.getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user.wishlist);
  } catch (error) {
    next(error);
  }
};

/**
 * 从收藏列表中移除商品
 * DELETE /api/users/wishlist/:id
 */
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const productId = req.params.id;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { wishlist: productId } },
      { new: true }
    ).populate('wishlist');

    res.json(user.wishlist);
  } catch (error) {
    next(error);
  }
};
