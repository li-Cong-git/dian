const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * 认证中间件 - 验证用户身份
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 从请求头获取token
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: '未提供认证令牌，访问被拒绝' });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 查找用户
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: '用户不存在或令牌无效' });
    }

    // 将用户信息添加到请求中
    req.user = user;
    next();
  } catch (error) {
    console.error('认证中间件错误:', error.message);
    res.status(401).json({ message: '认证失败', error: error.message });
  }
};

module.exports = { authMiddleware };
