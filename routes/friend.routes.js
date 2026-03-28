const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friend.controller');
const authMiddleware = require('../middleware/auth');

// 发送好友请求
router.post('/request', authMiddleware, friendController.sendFriendRequest);

// 处理好友请求
router.put('/request/:id', authMiddleware, friendController.handleFriendRequest);

// 获取好友列表
router.get('/', authMiddleware, friendController.getFriends);

// 获取好友请求列表
router.get('/requests', authMiddleware, friendController.getFriendRequests);

// 删除好友
router.delete('/:id', authMiddleware, friendController.deleteFriend);

module.exports = router;