const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { reviewValidation } = require('../middlewares/validator.middleware');

// 获取所有产品，支持筛选和搜索
// GET /api/products?keyword=手机&category=电子产品&...
router.get('/', productController.getAllProducts);

// 获取热门分类
// GET /api/products/categories/top
router.get('/categories/top', productController.getTopCategories);

// 获取单个产品详情
// GET /api/products/123
router.get('/:id', productController.getProductById);

// 获取相关推荐产品
// GET /api/products/123/recommended
router.get('/:id/recommended', productController.getRecommendedProducts);

// 添加产品评论
// POST /api/products/123/reviews
router.post('/:id/reviews', authMiddleware, reviewValidation, productController.createProductReview);

module.exports = router; 