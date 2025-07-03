/**
 * 认证中间件
 * 验证请求头中的JWT令牌
 */
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');

/**
 * 验证JWT令牌中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
const verifyToken = (req, res, next) => {
  try {
    // 获取请求头中的Authorization字段
    const authHeader = req.headers.authorization;
    
    // 检查Authorization头是否存在
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }
    
    // 检查Authorization格式是否正确
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '认证令牌格式不正确，应为Bearer token'
      });
    }
    
    // 提取token
    const token = authHeader.split(' ')[1];
    
    // 验证token
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // 将解码后的用户信息添加到请求对象中
    req.user = decoded;
    
    // 继续下一个中间件
    next();
  } catch (error) {
    console.error('令牌验证错误:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌'
      });
    }
    
    res.status(500).json({
      success: false,
      message: '认证过程中发生错误',
      error: error.message
    });
  }
};

module.exports = {
  verifyToken
}; 