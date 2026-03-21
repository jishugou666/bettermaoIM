const express = require('express');
const creditController = require('./credit.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/balance', creditController.getBalance);
router.get('/transactions', creditController.getTransactions);
router.get('/tasks', creditController.getTasks);
router.post('/report', creditController.reportTask);
router.post('/tip', creditController.tipUser);
router.post('/vip', creditController.purchaseVip);

module.exports = router;
