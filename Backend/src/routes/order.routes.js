const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// 获取当前用户的所有订单
// GET /api/orders
router.get('/', authMiddleware, orderController.getMyOrders);

// 创建新订单
// POST /api/orders
router.post('/', authMiddleware, orderController.createOrder);

// 获取订单详情
// GET /api/orders/:id
router.get('/:id', authMiddleware, orderController.getOrderById);

// 更新订单为已支付状态
// PUT /api/orders/:id/pay
router.put('/:id/pay', authMiddleware, orderController.updateOrderToPaid);

module.exports = router; 