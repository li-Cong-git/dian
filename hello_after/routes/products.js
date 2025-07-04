 /**
 * 商品相关路由
 */
const express = require('express');
const router = express.Router();
const { Product, Merchant } = require('../database/Merchant');

// 获取商品列表
router.post('/list', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      sort = 'createdAt', 
      order = 'desc',
      minPrice,
      maxPrice
    } = req.body;
    
    // 构建查询条件
    const query = { status: 'on_sale' }; // 默认只返回在售商品
    
    // 价格筛选
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }
    
    // 分类筛选
    if (category) {
      query.category = category;
    }
    
    // 构建排序
    const sortOption = {};
    sortOption[sort] = order === 'desc' ? -1 : 1;
    
    // 分页查询
    const skip = (page - 1) * limit;
    
    // 执行查询
    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
      
    // 获取总数
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        products,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取商品列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取商品列表失败',
      error: error.message
    });
  }
});

// 获取商品详情
router.post('/detail', async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: '缺少商品ID参数'
      });
    }
    
    console.log('获取公共商品详情API:', productId);
    
    // 查询商品
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }
    
    // 查询商家信息
    const merchant = await Merchant.findById(product.merchantId, 'name logo description');
    
    // 返回商品详情和商家信息
    res.json({
      success: true,
      data: {
        ...product.toObject(),
        merchant: merchant || null
      }
    });
  } catch (error) {
    console.error('获取商品详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取商品详情失败',
      error: error.message
    });
  }
});

// 搜索商品
router.post('/search', async (req, res) => {
  try {
    const { 
      keyword, 
      page = 1, 
      limit = 10, 
      category, 
      sort = 'createdAt', 
      order = 'desc',
      minPrice,
      maxPrice
    } = req.body;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词不能为空'
      });
    }
    
    // 构建搜索条件
    const query = { 
      status: 'on_sale',  // 只搜索在售商品
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ]
    };
    
    // 价格筛选
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }
    
    // 分类筛选
    if (category) {
      query.category = category;
    }
    
    // 构建排序
    const sortOption = {};
    sortOption[sort] = order === 'desc' ? -1 : 1;
    
    // 分页查询
    const skip = (page - 1) * limit;
    
    // 执行查询
    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
      
    // 获取总数
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        products,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('搜索商品错误:', error);
    res.status(500).json({
      success: false,
      message: '搜索商品失败',
      error: error.message
    });
  }
});

module.exports = router;