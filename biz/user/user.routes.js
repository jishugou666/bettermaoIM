const express = require('express');
const userController = require('./user.controller');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();

// 需要认证的路由
router.get('/', authMiddleware, userController.getUsers);
router.get('/:id', authMiddleware, userController.getUserById);
router.put('/profile', authMiddleware, userController.updateProfile);
router.put('/password', authMiddleware, userController.changePassword);
router.post('/status', authMiddleware, userController.getUserStatus);

module.exports = router;