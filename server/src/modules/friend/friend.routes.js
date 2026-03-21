const express = require('express');
const friendController = require('./friend.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', friendController.getFriends);
router.get('/requests', friendController.getPendingRequests);
router.get('/search', friendController.searchUsers);
router.post('/request', friendController.sendRequest);
router.post('/request/:id/accept', friendController.acceptRequest);
router.post('/request/:id/reject', friendController.rejectRequest);

router.get('/blocked', friendController.getBlockedUsers);
router.post('/:id/block', friendController.blockUser);
router.post('/:id/unblock', friendController.unblockUser);

module.exports = router;
