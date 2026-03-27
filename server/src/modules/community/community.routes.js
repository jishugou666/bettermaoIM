const express = require('express');
const communityController = require('./community.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/posts', communityController.getPosts);
router.post('/posts', communityController.createPost);
router.get('/posts/:id', communityController.getPostById);
router.post('/posts/:id/comments', communityController.createComment);
router.post('/posts/:id/like', communityController.toggleLike);
router.post('/discussion-group', communityController.createDiscussionGroup);

module.exports = router;