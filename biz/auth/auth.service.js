const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users } = require('../../db/crud');

class AuthService {
  async register(username, password, nickname) {
    try {
      // 检查用户名是否已存在
      const existingUser = await users.read({ username });
      if (existingUser.length > 0) {
        throw new Error('Username already exists');
      }

      // 密码加密
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建用户
      const result = await users.create({
        username,
        password: hashedPassword,
        nickname,
        status: 'online'
      });

      // 获取创建的用户信息
      const user = await users.getById(result.lastID);
      if (!user) {
        throw new Error('Failed to create user');
      }

      // 移除密码字段
      delete user.password;
      return user;
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async login(username, password) {
    try {
      // 查找用户
      const userList = await users.read({ username });
      const user = userList[0];
      
      if (!user) {
        throw new Error('Invalid username or password');
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid username or password');
      }

      // 更新用户状态为在线
      await users.update({ id: user.id }, { status: 'online' });

      // 生成JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // 移除密码字段
      delete user.password;
      return { user, token };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async logout(userId) {
    try {
      // 更新用户状态为离线
      await users.update({ id: userId }, { status: 'offline' });
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  async getProfile(userId) {
    try {
      const user = await users.getById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 移除密码字段
      delete user.password;
      return user;
    } catch (error) {
      throw new Error(`Get profile failed: ${error.message}`);
    }
  }
}

module.exports = new AuthService();