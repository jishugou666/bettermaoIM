const express = require('express');
const router = express.Router();
const pointsController = require('../controllers/points.controller');
const authMiddleware = require('../middleware/auth');

// 获取积分记录
router.get('/', authMiddleware, pointsController.getPoints);

// 每日签到
router.post('/sign', authMiddleware, pointsController.sign);

module.exports = router;