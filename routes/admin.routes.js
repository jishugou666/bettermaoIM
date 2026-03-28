const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// 管理员登录（无需验证）
router.post('/login', adminController.login);

// 以下路由需要管理员验证
router.use(adminController.verifyAdmin);

// 管理员管理（仅站长）
router.get('/profile', adminController.getProfile);
router.get('/admins', adminController.getAdmins);
router.post('/admins', adminController.createAdmin);
router.delete('/admins/:adminId', adminController.deleteAdmin);

// 数据库管理
router.get('/database/stats', adminController.getDatabaseStats);
router.get('/database/table/:tableName', adminController.getTableData);
router.delete('/database/table/:tableName/:rowId', adminController.deleteTableRow);
router.get('/database/export', adminController.exportDatabase);
router.post('/database/clear', adminController.clearDatabase);

// 用户管理
router.get('/users', adminController.getUsers);
router.delete('/users/:userId', adminController.deleteUser);
router.put('/users/:userId', adminController.updateUser);

// 私聊管理
router.get('/chats/private', adminController.getPrivateChats);

// 群组管理
router.get('/groups', adminController.getGroups);
router.delete('/groups/:groupId', adminController.deleteGroup);

// 朋友圈管理
router.get('/moments', adminController.getMoments);
router.delete('/moments/:momentId', adminController.deleteMoment);

// 帖子管理
router.get('/posts', adminController.getPosts);
router.delete('/posts/:postId', adminController.deletePost);

module.exports = router;
