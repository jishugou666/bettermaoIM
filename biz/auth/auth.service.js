const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users } = require('../../db/crud');

class AuthService {
  async register(username, email, password) {
    try {
      // 检查用户名是否已存在
      const existingUserByUsername = await users.read({ username });
      if (existingUserByUsername.length > 0) {
        throw new Error('Username already exists');
      }

      // 检查邮箱是否已存在
      const existingUserByEmail = await users.read({ email });
      if (existingUserByEmail.length > 0) {
        throw new Error('Email already exists');
      }

      // 密码加密
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建用户 - 用户名和昵称统一，默认角色为user
      const result = await users.create({
        username,
        email,
        password: hashedPassword,
        nickname: username, // 昵称和用户名统一
        status: 'online',
        role: 'user' // 默认角色为user
      });

      // 获取创建的用户信息
      const userList = await users.read({ username });
      const user = userList[0];
      if (!user) {
        throw new Error('Failed to create user');
      }

      // 移除密码字段
      delete user.password;
      return user;
    } catch (error) {
      throw error;
    }
  }

  async login(identifier, password) {
    try {
      // 查找用户 - 支持使用用户名或邮箱登录
      const userListByUsername = await users.read({ username: identifier });
      const userListByEmail = await users.read({ email: identifier });
      
      // 合并结果
      const userList = [...userListByUsername, ...userListByEmail];
      const user = userList[0];
      
      // 检查用户是否存在
      if (!user) {
        throw new Error('User not found');
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // 更新用户状态为在线
      await users.update({ _id: user._id }, { status: 'online' });

      // 生成JWT token
      const token = jwt.sign(
        { userId: user._id, username: user.username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // 移除密码字段
      delete user.password;
      return { user, token };
    } catch (error) {
      throw error;
    }
  }

  async logout(userId) {
    try {
      // 更新用户状态为离线
      await users.update({ _id: userId }, { status: 'offline' });
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  async getProfile(userId) {
    try {
      const userList = await users.read({ _id: userId });
      const user = userList[0];
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