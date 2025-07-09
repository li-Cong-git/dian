const Category = require('../models/category.model');
const { AppError } = require('../middlewares/error.middleware');

/**
 * 获取所有分类
 * GET /api/categories
 */
exports.getAllCategories = async (req, res, next) => {
  try {
    const { topLevel, parent, active } = req.query;

    // 构建查询条件
    const query = {};

    // 如果请求顶级分类
    if (topLevel === 'true') {
      query.isTopLevel = true;
    }

    // 如果指定了父分类
    if (parent) {
      query.parent = parent;
    }

    // 如果指定了活动状态
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    // 查询分类
    const categories = await Category.find(query)
      .populate('parent', 'name slug')
      .sort({ order: 1, name: 1 });

    res.json(categories);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取分类详情
 * GET /api/categories/:id
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name slug');

    if (!category) {
      throw new AppError('分类不存在', 404);
    }

    // 获取子分类
    const children = await Category.getChildren(category._id);

    res.json({
      ...category.toObject(),
      children
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取分类树结构
 * GET /api/categories/tree
 */
exports.getCategoryTree = async (req, res, next) => {
  try {
    // 获取所有顶级分类
    const topLevelCategories = await Category.find({ isTopLevel: true })
      .sort({ order: 1, name: 1 });

    // 为每个顶级分类获取子分类
    const categoryTree = await Promise.all(
      topLevelCategories.map(async (category) => {
        const children = await Category.find({ parent: category._id })
          .sort({ order: 1, name: 1 });

        return {
          ...category.toObject(),
          children
        };
      })
    );

    res.json(categoryTree);
  } catch (error) {
    next(error);
  }
};

/**
 * 根据slug获取分类
 * GET /api/categories/slug/:slug
 */
exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug })
      .populate('parent', 'name slug');

    if (!category) {
      throw new AppError('分类不存在', 404);
    }

    // 获取子分类
    const children = await Category.getChildren(category._id);

    res.json({
      ...category.toObject(),
      children
    });
  } catch (error) {
    next(error);
  }
};
