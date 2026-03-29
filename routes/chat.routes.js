const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middleware/auth');

// 创建聊天会话
router.post('/', authMiddleware, chatController.createChat);

// 获取聊天会话列表
router.get('/', authMiddleware, chatController.getChats);

// --- 修改开始 ---
// 获取所有已注册用户（开放性IM功能）
router.get('/users', authMiddleware, chatController.getAllUsers);

// 获取群聊详情
router.get('/:id/group-details', authMiddleware, chatController.getGroupDetails);

// 设置成员角色
router.post('/:id/set-role', authMiddleware, chatController.setMemberRole);

// 删除成员
router.post('/:id/remove-member', authMiddleware, chatController.removeMember);
// --- 修改结束 ---

// 获取聊天会话的消息记录
router.get('/:id/messages', authMiddleware, chatController.getMessages);

// 发送消息
router.post('/:id/messages', authMiddleware, chatController.sendMessage);

module.exports = router;