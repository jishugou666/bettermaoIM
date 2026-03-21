const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');
const groupController = require('./group.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/history/:otherUserId', chatController.getHistory);
router.get('/group-history/:groupId', chatController.getGroupHistory);
router.get('/conversations', chatController.getConversations);

// Group Routes
router.post('/groups', groupController.createGroup);
router.get('/groups', groupController.getGroups);
router.get('/groups/:id', groupController.getGroupDetails);
router.post('/groups/:id/members', groupController.addMembers);
router.delete('/groups/:id/members/:userId', groupController.kickMember);
router.post('/groups/:id/members/:userId/admin', groupController.setAdmin);
router.post('/groups/:id/transfer', groupController.transferOwnership);

// Unread & Read status
router.get('/unread', chatController.getUnread);
router.post('/read', chatController.markRead);

module.exports = router;
