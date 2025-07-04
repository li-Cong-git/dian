/**
 * 聊天相关路由
 */
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// 获取或创建聊天室
router.post('/room', verifyToken, chatController.getOrCreateChatRoom);

// 获取用户的聊天室列表
router.get('/user/:userId', verifyToken, chatController.getUserChatRooms);

// 获取商家的聊天室列表
router.get('/merchant/:merchantId', verifyToken, chatController.getMerchantChatRooms);

// 获取聊天历史记录
router.get('/history/:roomId', verifyToken, chatController.getChatHistory);

// 发送消息（REST API方式，作为WebSocket的备选）
router.post('/message', verifyToken, chatController.sendMessage);

// 标记消息为已读
router.post('/read', verifyToken, chatController.markAsRead);

// 获取用户未读消息数量
router.get('/unread/user/:userId', verifyToken, chatController.getUserUnreadCount);

// 获取商家未读消息数量
router.get('/unread/merchant/:merchantId', verifyToken, chatController.getMerchantUnreadCount);

module.exports = router; 