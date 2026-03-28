const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// 管理员登录（无需验证）
router.post('/login', adminController.login);

// 以下路由需要管理员验证
router.use(adminController.verifyAdmin);

// 数据库管理
router.get('/database/stats', adminController.getDatabaseStats);
router.get('/database/table/:tableName', adminController.getTableData);
router.delete('/database/table/:tableName/:rowId', adminController.deleteTableRow);
router.get('/database/export', adminController.exportDatabase);
router.post('/database/clear', adminController.clearDatabase);

// 用户管理
router.get('/users', adminController.getUsers);
router.delete('/users/:userId', adminController.deleteUser);

module.exports = router;
