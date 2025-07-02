require('./db/index.js')//此处有改动
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// Set PNA header before any other middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});

// 简化CORS配置，开发环境下允许所有源
app.use(cors({
  origin: '*', // 允许所有源
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// 只在开发环境使用详细日志
app.use(logger(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 优化静态资源
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d', // 静态资源缓存1天
  etag: true,
  lastModified: true
}));

// 路由
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler - REVISED FOR BETTER DEBUGGING
app.use(function(err, req, res, next) {
  // Log the error to the console for debugging
  console.error("====== GLOBAL ERROR HANDLER CAUGHT AN ERROR ======");
  console.error("Request URL:", req.originalUrl);
  console.error("Request Method:", req.method);
  console.error("Error Message:", err.message);
  console.error("Error Stack:", err.stack);
  console.error("==================================================");

  // Send a JSON response with error details
  res.status(err.status || 500).json({
    code: 1,
    message: err.message,
    // Only show the stack in development environment
    stack: req.app.get('env') === 'development' ? err.stack : undefined
  });
});

module.exports = app;
  