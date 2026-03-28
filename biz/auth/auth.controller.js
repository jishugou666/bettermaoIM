const authService = require('./auth.service');

class AuthController {
  async register(req, res, next) {
    try {
      const { username, email, password, nickname } = req.body;
      
      if (!username || !email || !password || !nickname) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const user = await authService.register(username, email, password, nickname);
      res.status(201).json({ user });
    } catch (error) {
      if (error.message.includes('Username already exists')) {
        return res.status(400).json({ error: 'Username already exists' });
      } else if (error.message.includes('Email already exists')) {
        return res.status(400).json({ error: '邮箱已被注册，请更换邮箱' });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res, next) {
    try {
      const { identifier, password } = req.body;
      
      if (!identifier || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { user, token } = await authService.login(identifier, password);
      res.status(200).json({ user, token });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(401).json({ error: 'Invalid username/email or password' });
      } else if (error.message === 'Invalid password') {
        return res.status(401).json({ error: 'Invalid username/email or password' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async logout(req, res, next) {
    try {
      const { userId } = req.user;
      await authService.logout(userId);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProfile(req, res, next) {
    try {
      const { userId } = req.user;
      const user = await authService.getProfile(userId);
      res.status(200).json({ user });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new AuthController();