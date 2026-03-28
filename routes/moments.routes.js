const express = require('express');
const router = express.Router();
const momentsController = require('../controllers/moments.controller');
const authMiddleware = require('../middleware/auth');

// 发布朋友圈动态
router.post('/', authMiddleware, momentsController.createMoment);

// 获取朋友圈动态列表
router.get('/', authMiddleware, momentsController.getMoments);

// 获取动态详情
router.get('/:id', authMiddleware, momentsController.getMomentDetail);

// 点赞朋友圈动态
router.post('/:id/like', authMiddleware, momentsController.likeMoment);

// 取消点赞
router.delete('/:id/like', authMiddleware, momentsController.unlikeMoment);

// 评论朋友圈动态
router.post('/:id/comment', authMiddleware, momentsController.commentMoment);

// 删除评论
router.delete('/:id/comment/:commentId', authMiddleware, momentsController.deleteComment);

module.exports = router;