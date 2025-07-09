const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 使用用户提供的MongoDB连接URI，包含用户名和密码
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://2264521353:1234567890@six0.hic1spu.mongodb.net/goshop';

// 连接MongoDB数据库
mongoose.connect(MONGODB_URI, {
    // 显式指定数据库名称
    dbName: 'goshop',
    // 生产环境连接优化
    serverSelectionTimeoutMS: 5000, // 服务器选择超时
    socketTimeoutMS: 45000, // Socket超时
    family: 4 // 强制使用IPv4
})
    .then(() => {
        console.log('✅ MongoDB数据库连接成功');
        // 获取连接信息
        const { host, name } = mongoose.connection;
        if (host && name) {
            console.log(`📦 数据库: ${name} at ${host}`);
        }
    })
    .catch((err) => {
        console.error('❌ MongoDB数据库连接失败:', err.message);
        // 在开发环境下显示更多错误详情
        if (process.env.NODE_ENV === 'development') {
            console.error('错误详情:', err);
        }
        // 严重错误时退出进程
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    });

// 添加数据库事件监听
mongoose.connection.on('error', err => {
    console.error('MongoDB连接错误:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB连接断开');
});

// 导出mongoose实例
module.exports = mongoose;