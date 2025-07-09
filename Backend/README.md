# 京东商城 API 后端服务

基于 Node.js、Express 和 MongoDB 构建的电商平台后端 API。

## 技术栈

- **框架**: Express
- **数据库**: MongoDB + Mongoose
- **认证**: JSON Web Tokens (JWT)
- **验证**: express-validator
- **日志**: morgan / winston
- **跨域**: cors

## 项目结构

```
src/
  config/             # 配置文件
  controllers/        # 业务逻辑控制器
  middlewares/        # Express 中间件
  models/             # MongoDB 模型定义
  routes/             # API 路由定义
  index.js            # 入口文件
```

## 功能列表

### 用户管理
- 注册/登录
- 个人资料查看/更新
- 地址管理
- 收藏夹管理

### 商品功能
- 商品列表/详情
- 商品分类
- 商品搜索/筛选
- 商品评价

### 订单功能
- 创建订单
- 订单支付
- 订单查询

## 本地开发

### 前提条件

- Node.js 14+
- MongoDB

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env` 文件，添加以下内容：

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/jd_shop
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

### 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## API 文档

### 用户 API

| 方法   | 端点                     | 描述               | 权限 |
| ------ | ------------------------ | ------------------ | ---- |
| POST   | /api/users/register      | 用户注册           | 公开 |
| POST   | /api/users/login         | 用户登录           | 公开 |
| GET    | /api/users/profile       | 获取用户个人资料   | 用户 |
| PUT    | /api/users/profile       | 更新用户个人资料   | 用户 |
| GET    | /api/users/addresses     | 获取用户地址列表   | 用户 |
| POST   | /api/users/addresses     | 添加用户地址       | 用户 |
| PUT    | /api/users/addresses/:id | 更新用户地址       | 用户 |
| DELETE | /api/users/addresses/:id | 删除用户地址       | 用户 |
| GET    | /api/users/wishlist      | 获取用户收藏列表   | 用户 |
| POST   | /api/users/wishlist      | 添加商品到收藏列表 | 用户 |
| DELETE | /api/users/wishlist/:id  | 从收藏列表移除商品 | 用户 |

### 商品 API

| 方法 | 端点                          | 描述         | 权限 |
| ---- | ----------------------------- | ------------ | ---- |
| GET  | /api/products                 | 获取商品列表 | 公开 |
| GET  | /api/products/:id             | 获取商品详情 | 公开 |
| GET  | /api/products/categories/top  | 获取热门分类 | 公开 |
| GET  | /api/products/:id/recommended | 获取推荐商品 | 公开 |
| POST | /api/products/:id/reviews     | 添加商品评价 | 用户 |

### 订单 API

| 方法 | 端点                | 描述             | 权限 |
| ---- | ------------------- | ---------------- | ---- |
| GET  | /api/orders         | 获取用户订单列表 | 用户 |
| POST | /api/orders         | 创建订单         | 用户 |
| GET  | /api/orders/:id     | 获取订单详情     | 用户 |
| PUT  | /api/orders/:id/pay | 更新订单为已支付 | 用户 |

## 常见问题

### 1. 无法连接到数据库

确保 MongoDB 服务已启动，并检查连接字符串是否正确。

### 2. Token 验证失败

检查 JWT_SECRET 环境变量是否设置正确，或 token 是否已过期。 