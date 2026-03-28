const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friend.controller');
const authMiddleware = require('../middleware/auth');

// --- 修改开始 ---
// 开放性IM改造：保留好友表用于黑名单功能
// 获取好友列表（现主要用于黑名单管理）
router.get('/', authMiddleware, friendController.getFriends);

// 更新好友信息（主要用于黑名单设置）
router.put('/:friendId', authMiddleware, friendController.updateFriendInfo);

// 获取好友分组
router.get('/groups', authMiddleware, friendController.getFriendGroups);

// 移除以下路由（好友添加/删除功能已移除）：
// router.post('/request', authMiddleware, friendController.sendFriendRequest);
// router.put('/request/:id', authMiddleware, friendController.handleFriendRequest);
// router.get('/requests', authMiddleware, friendController.getFriendRequests);
// router.delete('/:id', authMiddleware, friendController.deleteFriend);
// --- 修改结束 ---

module.exports = router;