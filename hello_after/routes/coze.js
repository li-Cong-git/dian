/**
 * Coze工作流API路由
 */
const express = require('express');
const router = express.Router();

// 导入控制器（稍后会创建）
const cozeController = require('../controllers/coze.controller');

// 执行工作流
router.post('/execute', cozeController.executeWorkflow);

// 获取工作流信息
router.get('/info', cozeController.getWorkflowInfo);

module.exports = router; 