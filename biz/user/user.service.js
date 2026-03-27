const bcrypt = require('bcryptjs');
const { users } = require('../../db/crud');

class UserService {
  async getUsers(currentUserId, keyword, limit = 50, offset = 0) {
    try {
      let query = 'SELECT * FROM users WHERE id != ?';
      const params = [currentUserId];

      if (keyword) {
        query += ' AND (username LIKE ? OR nickname LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
      }

      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const userList = await users.query(query, params);

      // 移除密码字段
      return userList.map(user => {
        delete user.password;
        return user;
      });
    } catch (error) {
      throw new Error(`Get users failed: ${error.message}`);
    }
  }

  async getUserById(userId, currentUserId) {
    try {
      const user = await users.getById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 移除密码字段
      delete user.password;
      return user;
    } catch (error) {
      throw new Error(`Get user failed: ${error.message}`);
    }
  }

  async updateProfile(userId, updates) {
    try {
      // 过滤有效字段
      const validUpdates = {};
      if (updates.nickname) validUpdates.nickname = updates.nickname;
      if (updates.avatar) validUpdates.avatar = updates.avatar;

      if (Object.keys(validUpdates).length === 0) {
        throw new Error('No valid updates provided');
      }

      // 更新用户信息
      await users.update({ id: userId }, validUpdates);

      // 获取更新后的用户信息
      const user = await users.getById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 移除密码字段
      delete user.password;
      return user;
    } catch (error) {
      throw new Error(`Update profile failed: ${error.message}`);
    }
  }

  async changePassword(userId, oldPassword, newPassword) {
    try {
      // 获取用户信息
      const user = await users.getById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 验证旧密码
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        throw new Error('Old password is incorrect');
      }

      // 加密新密码
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 更新密码
      await users.update({ id: userId }, { password: hashedPassword });
    } catch (error) {
      throw new Error(`Change password failed: ${error.message}`);
    }
  }

  async getUserStatuses(userIds) {
    try {
      const statuses = {};

      for (const userId of userIds) {
        const user = await users.getById(userId);
        if (user) {
          statuses[userId] = user.status;
        } else {
          statuses[userId] = 'offline';
        }
      }

      return statuses;
    } catch (error) {
      throw new Error(`Get user statuses failed: ${error.message}`);
    }
  }
}

module.exports = new UserService();