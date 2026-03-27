const authService = require('./auth.service');

class AuthController {
  async register(req, res, next) {
    try {
      const { username, password, nickname } = req.body;
      
      if (!username || !password || !nickname) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const user = await authService.register(username, password, nickname);
      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { user, token } = await authService.login(username, password);
      res.status(200).json({ user, token });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { userId } = req.user;
      await authService.logout(userId);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const { userId } = req.user;
      const user = await authService.getProfile(userId);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();