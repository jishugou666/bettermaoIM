const express = require('express');
const router = express.Router();
const communityController = require('../controllers/community.controller');
const authMiddleware = require('../middleware/auth');

// 社区帖子相关路由
router.get('/posts', authMiddleware, communityController.getPosts);
router.post('/posts', authMiddleware, communityController.createPost);
router.post('/posts/:postId/like', authMiddleware, communityController.toggleLike);
router.get('/posts/:postId', authMiddleware, communityController.getPostDetails);
router.post('/posts/:postId/comments', authMiddleware, communityController.createComment);

// 讨论组相关路由
router.post('/discussion-group', authMiddleware, communityController.createDiscussionGroup);

module.exports = router;