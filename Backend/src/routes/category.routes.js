const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

// 获取所有分类
// GET /api/categories
router.get('/', categoryController.getAllCategories);

// 获取分类树结构
// GET /api/categories/tree
router.get('/tree', categoryController.getCategoryTree);

// 根据slug获取分类
// GET /api/categories/slug/:slug
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// 获取分类详情
// GET /api/categories/:id
router.get('/:id', categoryController.getCategoryById);

module.exports = router;
