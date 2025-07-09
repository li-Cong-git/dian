const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { userRegisterValidation, userLoginValidation } = require('../middlewares/validator.middleware');

// 用户注册
// POST /api/users/register
router.post('/register', userRegisterValidation, userController.registerUser);

// 用户登录
// POST /api/users/login
router.post('/login', userLoginValidation, userController.loginUser);

// 获取用户个人资料
// GET /api/users/profile
router.get('/profile', authMiddleware, userController.getUserProfile);

// 更新用户个人资料
// PUT /api/users/profile
router.put('/profile', authMiddleware, userController.updateUserProfile);

// 获取用户地址列表
// GET /api/users/addresses
router.get('/addresses', authMiddleware, userController.getUserAddresses);

// 添加用户地址
// POST /api/users/addresses
router.post('/addresses', authMiddleware, userController.addUserAddress);

// 更新用户地址
// PUT /api/users/addresses/:id
router.put('/addresses/:id', authMiddleware, userController.updateUserAddress);

// 删除用户地址
// DELETE /api/users/addresses/:id
router.delete('/addresses/:id', authMiddleware, userController.deleteUserAddress);

// 获取用户收藏列表
// GET /api/users/wishlist
router.get('/wishlist', authMiddleware, userController.getWishlist);

// 添加商品到收藏列表
// POST /api/users/wishlist
router.post('/wishlist', authMiddleware, userController.addToWishlist);

// 从收藏列表移除商品
// DELETE /api/users/wishlist/:id
router.delete('/wishlist/:id', authMiddleware, userController.removeFromWishlist);

module.exports = router; 