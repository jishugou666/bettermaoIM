const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth');

// 获取当前用户信息
router.get('/', authMiddleware, userController.getCurrentUser);

// 更新用户信息
router.put('/', authMiddleware, userController.updateUser);

// 搜索用户
router.get('/search', authMiddleware, userController.searchUsers);

// 获取积分排行榜
router.get('/points/rank', authMiddleware, userController.getPointsRank);

module.exports = router;