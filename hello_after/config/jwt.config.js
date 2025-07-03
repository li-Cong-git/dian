/**
 * JWT配置文件
 * 管理JWT相关的配置和生成随机密钥
 */
const crypto = require('crypto');

/**
 * 生成随机的JWT密钥
 * @param {number} length - 密钥长度，默认64位
 * @returns {string} 生成的随机密钥
 */
function generateRandomSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// 应用启动时生成随机密钥，确保每次应用重启都会重新生成
// 在生产环境应该使用环境变量设置固定的密钥
const JWT_SECRET = process.env.JWT_SECRET || generateRandomSecret();

// 在控制台显示当前使用的密钥（仅开发环境）
if (process.env.NODE_ENV !== 'production') {
  console.log('\x1b[33m%s\x1b[0m', '警告: 使用随机生成的JWT密钥。在生产环境中应设置环境变量JWT_SECRET');
  console.log('\x1b[36m%s\x1b[0m', `当前JWT密钥: ${JWT_SECRET}`);
}

// JWT配置
const jwtConfig = {
  secret: JWT_SECRET,
  options: {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d', // 默认7天过期
    issuer: process.env.JWT_ISSUER || 'goshop-api',
  },
  refreshToken: {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d', // 刷新令牌30天过期
  }
};

module.exports = jwtConfig; 