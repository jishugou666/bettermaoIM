const express = require('express');
const chatController = require('./chat.controller');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();

// 需要认证的路由
router.get('/sessions', authMiddleware, chatController.getSessions);
router.get('/messages', authMiddleware, chatController.getMessages);
router.post('/messages', authMiddleware, chatController.sendMessage);
router.post('/sessions', authMiddleware, chatController.createSession);
router.put('/sessions/:sessionId', authMiddleware, chatController.updateSession);
router.delete('/sessions/:sessionId', authMiddleware, chatController.deleteSession);

module.exports = router;