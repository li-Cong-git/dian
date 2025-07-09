const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
// 使用自定义的数据库连接
const db = require('../database/db');
require('dotenv').config();

// 导入路由
const productRoutes = require('./routes/product.routes');
const userRoutes = require('./routes/user.routes');
const orderRoutes = require('./routes/order.routes');
const categoryRoutes = require('./routes/category.routes');

// 设置默认环境为生产环境
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// 初始化Express应用
const app = express();
const PORT = process.env.PORT || 5000;

// 详细的CORS配置
const corsOptions = {
  origin: '*', // 允许任何来源
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // 预检请求结果缓存24小时
};

// 中间件
app.use(cors(corsOptions));
app.use(express.json());

// 添加请求记录中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.ip}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// 日志中间件配置
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 开发环境运行中...');
  app.use(morgan('dev'));
} else {
  console.log('🚀 生产环境运行中...');
  app.use(morgan('combined'));
}

// 健康检查端点
app.get('/health', (req, res) => {
  console.log('收到健康检查请求: /health');
  // 返回更详细的健康状态信息
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    clientInfo: {
      ip: req.ip,
      headers: req.headers,
      userAgent: req.get('user-agent')
    }
  });
});

// 添加API健康检查端点
app.get('/api/health', (req, res) => {
  console.log('收到API健康检查请求: /api/health');
  // 返回更详细的健康状态信息
  res.status(200).json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    clientInfo: {
      ip: req.ip,
      headers: req.headers,
      userAgent: req.get('user-agent')
    }
  });
});

// 基础路由
app.get('/', (req, res) => {
  console.log('收到根路径请求: /');
  res.json({
    message: '欢迎使用京东商城API',
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// API路由
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);

// 未找到路由处理
app.use(notFound);

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const startServer = async () => {
  try {
    // 数据库已经通过导入db.js自动连接了

    // 启动服务器，监听所有网络接口
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ 服务器运行在 http://0.0.0.0:${PORT}`);
      console.log(`✅ 本地访问: http://localhost:${PORT}`);
      console.log(`✅ 局域网访问: http://<本机IP>:${PORT}`);
      console.log(`✅ Android模拟器访问: http://10.0.2.2:${PORT}`);
      console.log(`🌎 环境: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error.message);
    process.exit(1);
  }
};

// 处理未捕获的Promise异常
process.on('unhandledRejection', (err) => {
  console.error('❌ 未处理的Promise拒绝:', err.message);
  process.exit(1);
});

startServer(); 