/**
 * 主路由文件
 */
var express = require('express');
var router = express.Router();

/* GET 首页 */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'GoShop API' });
});

/* API 状态检查 */
router.get('/api/status', function(req, res) {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/* API 文档 */
router.get('/api/docs', function(req, res) {
  res.render('api-docs', { title: 'API Documentation' });
});

module.exports = router;
