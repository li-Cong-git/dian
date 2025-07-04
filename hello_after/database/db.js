const mongoose = require("mongoose");

// 从环境变量获取数据库连接信息
const DB_USERNAME = process.env.DB_USERNAME || '2264521353';
const DB_PASSWORD = process.env.DB_PASSWORD || '1234567890';
const DB_HOST = process.env.DB_HOST || 'six0.hic1spu.mongodb.net';
const DB_NAME = process.env.DB_NAME || 'goshop';
const DB_CONNECTION_STRING = process.env.MONGODB_URI || 
  `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}`;

// 连接数据库
mongoose.connect("mongodb+srv://2264521353:1234567890@six0.hic1spu.mongodb.net/goshop").then(res => {
    console.log("数据库连接成功");
}).catch(err => {
    console.error("数据库连接失败:", err.message);
})

module.exports = mongoose;