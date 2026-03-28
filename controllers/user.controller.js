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
      // --- 修改开始 ---
      const { keyword } = req.query;
      const currentUserId = req.user?.userId;
      
      // 参数验证
      if (!keyword || typeof keyword !== 'string') {
        return res.status(400).json({ error: '请输入有效的搜索关键词' });
      }

      // 关键词长度限制
      const trimmedKeyword = keyword.trim();
      if (trimmedKeyword.length === 0) {
        return res.status(400).json({ error: '搜索关键词不能为空' });
      }

      if (trimmedKeyword.length > 50) {
        return res.status(400).json({ error: '搜索关键词过长' });
      }

      console.log(`[搜索用户] 用户ID: ${currentUserId}, 关键词: ${trimmedKeyword}`);
      
      // 获取所有用户，添加错误处理
      let allUsers = [];
      try {
        allUsers = await users.read({});
      } catch (dbError) {
        console.error('[搜索用户] 数据库查询失败:', dbError);
        return res.status(500).json({ error: '数据库查询失败' });
      }

      // 确保allUsers是数组
      if (!Array.isArray(allUsers)) {
        console.error('[搜索用户] 数据库返回非数组类型:', typeof allUsers);
        allUsers = [];
      }

      console.log(`[搜索用户] 查询到 ${allUsers.length} 个用户`);
      
      // 在内存中进行模糊搜索
      const keywordLower = trimmedKeyword.toLowerCase();
      const matchedUsers = allUsers.filter(user => {
        // 排除当前用户
        if (user._id === currentUserId) {
          return false;
        }

        // 使用可选链和空值合并操作符进行安全访问
        const username = user?.username?.toLowerCase() || '';
        const email = user?.email?.toLowerCase() || '';
        const nickname = user?.nickname?.toLowerCase() || '';

        return (
          username.includes(keywordLower) ||
          email.includes(keywordLower) ||
          nickname.includes(keywordLower)
        );
      });

      console.log(`[搜索用户] 匹配到 ${matchedUsers.length} 个用户`);
      
      // 移除敏感字段并限制返回数量
      const maxResults = 50;
      const usersWithoutPassword = matchedUsers
        .slice(0, maxResults)
        .map(user => {
          // 使用对象解构移除敏感字段
          const { password, ...safeUser } = user;
          return {
            id: safeUser._id,
            username: safeUser.username || '',
            nickname: safeUser.nickname || '',
            email: safeUser.email || '',
            avatar: safeUser.avatar || '',
            signature: safeUser.signature || '',
            points: safeUser.points || 0
          };
        });
      
      res.status(200).json({ 
        users: usersWithoutPassword,
        total: matchedUsers.length,
        limited: matchedUsers.length > maxResults
      });
      // --- 修改结束 ---
    } catch (error) {
      console.error('[搜索用户] 未预期的错误:', error);
      res.status(500).json({ error: '搜索用户失败，请稍后重试' });
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