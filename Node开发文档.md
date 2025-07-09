💻 Cursor Rules 配置：Node.js Express + MongoDB 开发规范
📜 通用开发规范
语言规范
所有回复必须以中文开头，称呼用户为"帅哥："。

技术术语保持英文原文。

需求拆解策略
复杂功能按以下流程分解：

API 接口定义 (遵循 RESTful 原则)

数据模型设计 (MongoDB Schema)

业务逻辑实现 (Controller/Service)

路由与中间件配置

集成测试

每个功能点完成后应有阶段性报告。

JavaScript 规范
严格遵循 ESLint 和 Prettier 规范。

如果使用 JavaScript，确保 JSDoc 注释清晰。

模块化原则
遵循单一职责原则，每个文件或模块只做一件事。

按功能组织文件结构（例如：controllers, services, models, routes, middlewares）。

避免循环依赖。

🛠 自动化执行策略
安全操作范围
自动执行操作类型：

Bash

npx eslint --fix
npm test # 或 yarn test
mkdir src/<NewModule> && touch index.js # 或 index.ts
高风险操作（需人工确认）
需确认的关键变更：

数据库 Schema 的重大修改（新增/删除字段、类型变更）。

认证/授权逻辑的调整。

第三方服务集成的关键配置。

全局错误处理中间件的修改。

变更影响分析
修改前执行依赖分析：

Bash

# 示例：分析某个文件的依赖关系 (可能需要自定义工具或IDE功能)
grep -r "require('<module-name>')" .
grep -r "import .* from '<module-name>'" .
⚛️ Node.js & Express 最佳实践
项目结构
标准项目结构：

Plaintext

src/
  config/             # 配置文件 (DB连接, 环境变量等)
  middlewares/        # Express 中间件
  models/             # MongoDB Schema 定义
  controllers/        # 业务逻辑处理 (接收请求, 调用Service)
  services/           # 核心业务逻辑 (数据操作, 外部服务调用)
  routes/             # 路由定义
  utils/              # 工具函数
  app.js              # Express 应用入口
  server.js           # 服务器启动
tests/                # 测试文件
.env                  # 环境变量
错误处理
统一的全局错误处理中间件。

业务逻辑中的错误应抛出自定义错误类型或使用标准错误对象。

JavaScript

// 示例：全局错误处理中间件 (app.js 或单独文件)
app.use((err, req, res, next) => {
  console.error(err.stack); // 记录错误日志
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    errors: err.errors || [], // 可选：返回详细错误列表
  });
});

// 示例：业务逻辑中抛出错误
class CustomError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
if (!user) {
  throw new CustomError('User not found', 404);
}
异步操作
优先使用 async/await 处理异步操作，避免回调地狱。

捕获 async/await 链中的错误（使用 try-catch 或 Express 的 express-async-errors 库）。

安全性
环境变量：敏感信息（如数据库连接字符串、API 密钥）必须从环境变量加载，不硬编码。

输入验证：所有用户输入必须进行严格验证（推荐使用 Joi, Yup 或 express-validator）。

CORS：正确配置跨域资源共享（CORS）。

Rate Limiting：对频繁或敏感的 API 路由实施速率限制。

Helmet.js：使用 Helmet.js 提高应用安全性。

🗄 MongoDB 最佳实践
数据建模
Schema 定义：使用 Mongoose 规范定义 Schema，明确字段类型、校验规则、默认值和索引。

引用：合理使用引用（populate）而非嵌入文档，以避免数据冗余和复杂查询。

索引：为常用查询字段创建索引，特别是 _id、外键、排序字段。

日期处理：所有日期应存储为 Date 类型，并确保时区一致性（推荐 UTC）。

数据库操作
事务：对于需要原子性操作（多个文档修改同时成功或失败）的场景，使用 MongoDB 事务。

批量操作：对于大量数据的插入、更新、删除，使用批量写入操作（bulkWrite）以提高效率。

分页：实现高效的分页查询（skip 和 limit 或 aggregate 管道）。

错误处理：数据库操作应有完善的错误捕获机制。

JavaScript

// 示例：Mongoose Schema 定义
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false }, // select: false 默认不返回
  roles: [{ type: String, enum: ['user', 'admin'], default: ['user'] }],
  createdAt: { type: Date, default: Date.now },
});

userSchema.index({ email: 1 }); // 创建索引
🧪 质量保障规范
测试覆盖率
最小测试覆盖率要求：

Plaintext

Controller/Service Logic : >=80%
Critical API Endpoints   : >=90%
测试框架
推荐使用 Jest 或 Mocha/Chai 进行单元测试和集成测试。

数据库相关测试应考虑使用内存数据库（如 mongodb-memory-server）或在测试前后清空数据。

日志管理
使用 Winston 或 Pino 等日志库，进行结构化日志记录。

日志级别（info, warn, error, debug）应清晰区分。

敏感信息不得出现在日志中。

📚 文档与维护
API 文档规范
推荐使用 Swagger/OpenAPI 自动生成和维护 API 文档。

每个 API 端点应清晰描述：路径、HTTP 方法、请求参数、响应结构、错误码。

变更日志
提交消息规范：

Plaintext

feat(auth): 新增用户注册与登录功能
fix(db): 修复商品库存更新的并发问题
chore(deps): 更新依赖版本
refactor(user): 重构用户服务层代码
🔧 推荐开发流程
新增功能流程
定义 RESTful API 接口规范。

设计 MongoDB 数据模型 Schema。

在 Service 层实现核心业务逻辑。

在 Controller 层处理请求/响应和错误。

配置路由和中间件。

编写单元测试和集成测试，确保覆盖率达标。

提交代码并进行自查。

请求代码评审并等待通过。

缺陷修复流程
通过日志或复现步骤定位问题。

创建最小化复现用例（如单元测试）。

修改代码，并添加防护性测试。

验证其他功能不受影响。

提交代码并进行自查。

请求代码评审并等待通过。