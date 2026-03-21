const express = require('express');
const router = express.Router();
const uploadController = require('./upload.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

// Apply auth middleware to all upload routes
router.use(authMiddleware);

// Avatar upload
router.post('/avatar', uploadController.uploadImage('file'), uploadController.handleUpload);

// Moment image upload
router.post('/moment', uploadController.uploadImage('file'), uploadController.handleUpload);

// Chat image upload
router.post('/chat', uploadController.uploadImage('file'), uploadController.handleUpload);

// Group code file upload
router.post('/group-file', uploadController.uploadCode('file'), uploadController.handleUpload);

module.exports = router;
