const express = require('express');
const momentController = require('./moment.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/feed', momentController.getFeed);
router.get('/user/:userId', momentController.getUserMoments);
router.get('/:id', momentController.getMomentById);
router.post('/', momentController.createMoment);
router.post('/:id/like', momentController.toggleLike);
router.get('/:id/comments', momentController.getComments);
router.post('/:id/comments', momentController.createComment);

module.exports = router;
