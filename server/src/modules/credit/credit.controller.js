const creditService = require('./credit.service');

class CreditController {
  async getBalance(req, res, next) {
    try {
      const balance = await creditService.getBalance(req.user.id);
      res.json(balance);
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req, res, next) {
    try {
      const transactions = await creditService.getTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  }

  async getTasks(req, res, next) {
    try {
      const tasks = await creditService.getTasksStatus(req.user.id);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  }

  async reportTask(req, res, next) {
    try {
      const { taskKey } = req.body;
      const result = await creditService.checkAndCompleteTask(req.user.id, taskKey);
      if (result) {
        res.json({ success: true, reward: result.task.reward, message: `Completed: ${result.task.name}` });
      } else {
        res.json({ success: false, message: 'Task already completed or invalid' });
      }
    } catch (error) {
      next(error);
    }
  }

  async tipUser(req, res, next) {
    try {
      const { toUserId, amount, type } = req.body;
      if (!toUserId || !amount) {
        return res.status(400).json({ message: 'Target user and amount required' });
      }
      
      await creditService.transfer(req.user.id, parseInt(toUserId), parseInt(amount), type);
      res.json({ success: true, message: 'Tip sent successfully' });
    } catch (error) {
      next(error);
    }
  }

  async purchaseVip(req, res, next) {
    try {
      const result = await creditService.purchaseVip(req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CreditController();
