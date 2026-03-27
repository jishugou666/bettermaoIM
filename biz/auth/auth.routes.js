const express = require('express');
const authController = require('./auth.controller');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();

// 公开路由
router.post('/register', authController.register);
router.post('/login', authController.login);

// 需要认证的路由
router.post('/logout', authMiddleware, authController.logout);
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;