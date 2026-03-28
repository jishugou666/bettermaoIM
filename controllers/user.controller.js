const { users, points } = require('../db/crud');
const multer = require('multer');
const path = require('path');

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/avatars'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

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
      const { nickname, avatar, signature, gender, birthday, bio, location, tags } = req.body;
      
      const updateData = {};
      if (nickname) updateData.nickname = nickname;
      if (avatar) updateData.avatar = avatar;
      if (signature) updateData.signature = signature;
      if (gender) updateData.gender = gender;
      if (birthday) updateData.birthday = birthday;
      if (bio !== undefined) updateData.bio = bio;
      if (location !== undefined) updateData.location = location;
      if (tags !== undefined) updateData.tags = tags;
      
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
        return res.status(400).json({ error: '请输入搜索关键词' });
      }
      
      // 获取所有用户
      const allUsers = await users.read({});
      
      // 在内存中进行模糊搜索
      const keywordLower = keyword.toLowerCase();
      const matchedUsers = allUsers.filter(user => {
        return (
          (user.username && user.username.toLowerCase().includes(keywordLower)) ||
          (user.email && user.email.toLowerCase().includes(keywordLower)) ||
          (user.nickname && user.nickname.toLowerCase().includes(keywordLower))
        );
      });
      
      // 移除密码字段
      const usersWithoutPassword = matchedUsers.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      res.status(200).json({ users: usersWithoutPassword });
    } catch (error) {
      console.error('搜索用户失败:', error);
      res.status(500).json({ error: '搜索用户失败' });
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

  async uploadAvatar(req, res) {
    try {
      const { userId } = req.user;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // 构建头像URL
      const avatarUrl = '/uploads/avatars/' + req.file.filename;
      
      // 更新用户头像
      await users.update({ _id: userId }, { avatar: avatarUrl });
      
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
}

const userController = new UserController();

// 导出上传中间件
userController.upload = upload;

module.exports = userController;