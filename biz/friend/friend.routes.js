const express = require('express');
const friendController = require('./friend.controller');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();

// 需要认证的路由
router.get('/', authMiddleware, friendController.getFriends);
router.post('/requests', authMiddleware, friendController.sendFriendRequest);
router.get('/requests', authMiddleware, friendController.getFriendRequests);
router.post('/requests/accept', authMiddleware, friendController.acceptFriendRequest);
router.post('/requests/reject', authMiddleware, friendController.rejectFriendRequest);
router.delete('/:friendId', authMiddleware, friendController.removeFriend);

module.exports = router;