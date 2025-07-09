const Product = require('../models/product.model');

// 获取所有产品
exports.getAllProducts = async (req, res) => {
  try {
    const {
      keyword = '',
      category = '',
      page = 1,
      limit = 10,
      sort = '-createdAt',
      minPrice,
      maxPrice,
      brand = '',
      inStock,
      featured
    } = req.query;

    // 构建查询条件
    const query = {};

    // 关键词搜索
    if (keyword) {
      query.$text = { $search: keyword };
    }

    // 分类过滤
    if (category) {
      query.category = category;
    }

    // 品牌过滤
    if (brand) {
      query.brand = brand;
    }

    // 价格过滤
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // 库存过滤
    if (inStock === 'true') {
      query.countInStock = { $gt: 0 };
    }

    // 特色产品
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // 分页
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // 查询产品
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNumber);

    // 总数量
    const totalProducts = await Product.countDocuments(query);

    res.json({
      products,
      page: pageNumber,
      pages: Math.ceil(totalProducts / limitNumber),
      total: totalProducts,
    });
  } catch (error) {
    res.status(500).json({ message: '获取产品列表失败', error: error.message });
  }
};

// 获取单个产品详情
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: '产品未找到' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: '获取产品详情失败', error: error.message });
  }
};

// 创建产品评论
exports.createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    // 验证评论数据
    if (!rating || !comment) {
      return res.status(400).json({ message: '请提供评分和评论内容' });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: '产品未找到' });
    }

    // 假设用户信息从身份验证中间件中获取
    const user = req.user;

    // 检查用户是否已经评论过该产品
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: '您已经评论过该产品' });
    }

    // 创建新评论
    const review = {
      name: user.name,
      rating: Number(rating),
      comment,
      user: user._id,
    };

    // 添加到评论数组
    product.reviews.push(review);

    // 更新评分统计信息
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    // 保存产品
    await product.save();

    res.status(201).json({ message: '评论添加成功', review });
  } catch (error) {
    res.status(500).json({ message: '添加评论失败', error: error.message });
  }
};

// 获取推荐产品
exports.getRecommendedProducts = async (req, res) => {
  try {
    const { category, limit = 6 } = req.query;
    const productId = req.params.id;

    // 获取相同分类的产品，排除当前产品
    const recommendedProducts = await Product.find({
      _id: { $ne: productId },
      ...(category ? { category } : {}),
    })
      .sort({ salesCount: -1, rating: -1 })
      .limit(parseInt(limit));

    res.json(recommendedProducts);
  } catch (error) {
    res.status(500).json({ message: '获取推荐产品失败', error: error.message });
  }
};

// 获取热门分类
exports.getTopCategories = async (req, res) => {
  try {
    // 聚合产品，按分类分组并计算每个分类的产品数量
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: '获取热门分类失败', error: error.message });
  }
}; 