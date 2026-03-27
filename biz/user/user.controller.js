const userService = require('./user.service');

class UserController {
  async getUsers(req, res, next) {
    try {
      const { userId } = req.user;
      const { keyword, limit = 50, offset = 0 } = req.query;
      
      const users = await userService.getUsers(userId, keyword, parseInt(limit), parseInt(offset));
      res.status(200).json({ users });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const { userId } = req.user;
      const { id } = req.params;
      
      const user = await userService.getUserById(id, userId);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { userId } = req.user;
      const { nickname, avatar } = req.body;
      
      const user = await userService.updateProfile(userId, { nickname, avatar });
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { userId } = req.user;
      const { oldPassword, newPassword } = req.body;
      
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Old password and new password are required' });
      }

      await userService.changePassword(userId, oldPassword, newPassword);
      res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getUserStatus(req, res, next) {
    try {
      const { userId } = req.user;
      const { userIds } = req.body;
      
      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ error: 'User IDs are required' });
      }

      const statuses = await userService.getUserStatuses(userIds);
      res.status(200).json({ statuses });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();