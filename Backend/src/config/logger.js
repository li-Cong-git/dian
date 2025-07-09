const winston = require('winston');

// 定义日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 根据环境定义日志级别
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// 定义日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// 添加颜色
winston.addColors(colors);

// 定义日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// 定义日志存储位置
const transports = [
  // 控制台输出
  new winston.transports.Console(),
  // 错误日志文件
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  // 所有日志文件
  new winston.transports.File({
    filename: 'logs/all.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// 创建日志记录器实例
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});


