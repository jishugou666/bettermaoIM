const userService = require('./user.service');
const creditService = require('../credit/credit.service');

class UserController {
  async getProfile(req, res, next) {
    try {
      const user = await userService.getProfile(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user.id, req.body);
      
      // Check if profile is complete to award credit
      // Criteria: nickname, bio, gender, location, tags must be present
      if (user.nickname && user.bio && user.gender && user.location && user.tags) {
        await creditService.checkAndCompleteTask(req.user.id, 'profile_complete');
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
