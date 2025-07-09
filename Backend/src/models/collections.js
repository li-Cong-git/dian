/**
 * MongoDB集合名称常量配置
 * 这个文件用于统一管理MongoDB集合名称，确保团队开发时使用统一的集合名
 */

const COLLECTIONS = {
  // 用户相关
  USERS: 'users',

  // 商品相关
  PRODUCTS: 'products',
  CATEGORIES: 'categories',

  // 订单相关
  ORDERS: 'orders',

  // 其他集合
  REVIEWS: 'reviews',
};

module.exports = COLLECTIONS; 