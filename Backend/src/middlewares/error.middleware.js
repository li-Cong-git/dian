/**
 * 自定义错误类
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true; // 标记为已处理的操作错误

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 请求未找到错误处理中间件
 */
const notFound = (req, res, next) => {
  const error = new Error(`找不到 - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  const isProduction = process.env.NODE_ENV === 'production';

  // 开发环境下记录完整错误，生产环境下只记录必要信息
  if (isProduction) {
    // 生产环境下记录错误但不泄露敏感信息
    console.error('错误类型:', err.name);
    console.error('错误消息:', err.message);
    console.error('请求路径:', req.originalUrl);
    console.error('请求方法:', req.method);
    console.error('客户端IP:', req.ip);

    // 可以添加日志记录到文件或数据库
  } else {
    // 开发环境下记录详细错误
    console.error('错误详情:', err);
  }

  // 设置默认状态码和错误信息
  const statusCode = err.statusCode || 500;
  let message = err.message || '服务器内部错误';
  const errors = err.errors || [];

  // 生产环境下隐藏敏感的错误信息
  if (isProduction && statusCode === 500) {
    message = '服务器内部错误'; // 通用错误信息
  }

  // 返回错误响应
  res.status(statusCode).json({
    message,
    errors: errors.length > 0 ? errors : undefined,
    // 只在非生产环境下返回堆栈信息
    stack: !isProduction ? err.stack : undefined
  });
};

module.exports = {
  AppError,
  notFound,
  errorHandler
};
