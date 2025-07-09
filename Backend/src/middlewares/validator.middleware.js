const { check, validationResult } = require('express-validator');
const { AppError } = require('./error.middleware');

/**
 * 验证结果处理中间件
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // 提取验证错误信息
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg
    }));

    // 创建一个AppError并传递给错误处理中间件
    return next(new AppError('请求数据验证失败', 400, errorMessages));
  }
  next();
};

/**
 * 用户注册验证规则
 */
const userRegisterValidation = [
  check('name')
    .trim()
    .notEmpty().withMessage('用户名不能为空')
    .isLength({ min: 2, max: 30 }).withMessage('用户名长度需在2-30个字符之间'),
  check('email')
    .trim()
    .notEmpty().withMessage('邮箱不能为空')
    .isEmail().withMessage('请提供有效的邮箱地址'),
  check('password')
    .trim()
    .notEmpty().withMessage('密码不能为空')
    .isLength({ min: 6 }).withMessage('密码长度至少为6个字符')
    .matches(/\d/).withMessage('密码必须包含至少一个数字'),
  validate
];

/**
 * 用户登录验证规则
 */
const userLoginValidation = [
  check('email')
    .trim()
    .notEmpty().withMessage('邮箱不能为空')
    .isEmail().withMessage('请提供有效的邮箱地址'),
  check('password')
    .trim()
    .notEmpty().withMessage('密码不能为空'),
  validate
];

/**
 * 评论验证规则
 */
const reviewValidation = [
  check('rating')
    .isInt({ min: 1, max: 5 }).withMessage('评分必须是1-5之间的整数'),
  check('comment')
    .trim()
    .notEmpty().withMessage('评论内容不能为空')
    .isLength({ min: 3 }).withMessage('评论内容至少3个字符'),
  validate
];

/**
 * 地址验证规则
 */
const addressValidation = [
  check('name')
    .trim()
    .notEmpty().withMessage('收件人姓名不能为空'),
  check('phone')
    .trim()
    .notEmpty().withMessage('联系电话不能为空')
    .matches(/^1[3-9]\d{9}$/).withMessage('请提供有效的手机号码'),
  check('province')
    .trim()
    .notEmpty().withMessage('省份不能为空'),
  check('city')
    .trim()
    .notEmpty().withMessage('城市不能为空'),
  check('district')
    .trim()
    .notEmpty().withMessage('区县不能为空'),
  check('address')
    .trim()
    .notEmpty().withMessage('详细地址不能为空'),
  validate
];

module.exports = {
  userRegisterValidation,
  userLoginValidation,
  reviewValidation,
  addressValidation
};
