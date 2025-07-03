// 加载环境变量
require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var merchantsRouter = require('./routes/merchants');
var logisticsRouter = require('./routes/logistics');
var speechRouter = require('./routes/speech');
var cozeRouter = require('./routes/coze');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 在所有路由之前配置CORS，确保跨域请求能够正常工作
// 增强CORS配置，允许所有来源的请求，特别是来自模拟器的请求
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// 使用cors中间件作为备份
app.use(cors({
  origin: '*', // 允许所有来源的请求
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  credentials: true
}));

const API_PREFIX = '/api/v1';

// 添加请求日志中间件
app.use(function(req, res, next) {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('请求头:', JSON.stringify(req.headers));
  if (req.method !== 'GET') {
    console.log('请求体:', JSON.stringify(req.body));
  }
  next();
});

app.use('/', indexRouter);
app.use(`${API_PREFIX}/users`, usersRouter);
app.use(`${API_PREFIX}/merchants`, merchantsRouter);
app.use(`${API_PREFIX}/logistics`, logisticsRouter);
app.use(`${API_PREFIX}/speech`, speechRouter);
app.use(`${API_PREFIX}/coze`, cozeRouter);

app.get('/health', function(req, res) {
  res.json({ status: 'UP', message: 'Server is running' });
});

app.get(`${API_PREFIX}`, function(req, res) {
  res.json({
    name: 'GoShop API',
    version: '1.0.0',
    status: 'active',
    endpoints: [
      `${API_PREFIX}/users`,
      `${API_PREFIX}/merchants`,
      `${API_PREFIX}/logistics`,
      `${API_PREFIX}/speech`,
      `${API_PREFIX}/coze`
    ]
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  
  if (req.path.startsWith(API_PREFIX)) {
    return res.json({
      success: false,
      message: err.message,
      status: err.status || 500,
      stack: req.app.get('env') === 'development' ? err.stack : undefined
    });
  }
  
  res.render('error');
});

module.exports = app;
