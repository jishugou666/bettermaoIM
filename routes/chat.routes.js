const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middleware/auth');

// 创建聊天会话
router.post('/', authMiddleware, chatController.createChat);

// 获取聊天会话列表
router.get('/', authMiddleware, chatController.getChats);

// 获取聊天会话的消息记录
router.get('/:id/messages', authMiddleware, chatController.getMessages);

// 发送消息
router.post('/:id/messages', authMiddleware, chatController.sendMessage);

module.exports = router;