const { users, points } = require('../db/crud');

class UserController {
  async getCurrentUser(req, res) {
    try {
      const { userId } = req.user;
      const userList = await users.read({ _id: userId });
      const user = userList[0];
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      // 移除密码字段
      delete user.password;
      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateUser(req, res) {
    try {
      const { userId } = req.user;
      const { nickname, avatar, signature, gender, birthday } = req.body;
      
      const updateData = {};
      if (nickname) updateData.nickname = nickname;
      if (avatar) updateData.avatar = avatar;
      if (signature) updateData.signature = signature;
      if (gender) updateData.gender = gender;
      if (birthday) updateData.birthday = birthday;
      
      await users.update({ _id: userId }, updateData);
      
      // 获取更新后的用户信息
      const userList = await users.read({ _id: userId });
      const user = userList[0];
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      // 移除密码字段
      delete user.password;
      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async searchUsers(req, res) {
    try {
      const { keyword } = req.query;
      if (!keyword) {
        return res.status(400).json({ error: 'Missing keyword' });
      }
      
      // 搜索用户名、邮箱或昵称包含关键字的用户
      const usersList = await users.read({ 
        $or: [
          { username: { $regex: keyword, $options: 'i' } },
          { email: { $regex: keyword, $options: 'i' } },
          { nickname: { $regex: keyword, $options: 'i' } }
        ]
      });
      
      // 移除密码字段
      const usersWithoutPassword = usersList.map(user => {
        delete user.password;
        return user;
      });
      
      res.status(200).json({ users: usersWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPointsRank(req, res) {
    try {
      // 获取所有用户
      const usersList = await users.read({});
      
      // 按积分排序
      const rankedUsers = usersList
        .map(user => {
          return {
            id: user._id,
            username: user.username,
            nickname: user.nickname,
            avatar: user.avatar,
            points: user.points || 0
          };
        })
        .sort((a, b) => b.points - a.points)
        .slice(0, 10); // 只返回前10名
      
      res.status(200).json({ users: rankedUsers });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new UserController();