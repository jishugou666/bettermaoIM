const { users, friends, friendRequests, chats, chatMembers, messages, points, moments, momentLikes, momentComments, communityPosts, communityComments, communityLikes } = require('../db/crud');
const db = require('../db');

class AdminController {
  // 管理员登录 - 使用用户系统验证
  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      // 查找用户
      const userList = await users.read({ username });
      const user = userList[0];
      
      if (!user) {
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
      }
      
      // 验证密码
      if (user.password !== password) {
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
      }
      
      // 验证是否为管理员
      if (user.role !== 'admin') {
        return res.status(403).json({ success: false, message: '无管理员权限' });
      }
      
      // 返回用户信息和token
      res.json({ 
        success: true, 
        token: user._id,
        user: {
          id: user._id,
          username: user.username,
          nickname: user.nickname,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 验证管理员权限中间件
  async verifyAdmin(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: '未授权' });
      }
      
      // 查找用户
      const userList = await users.read({ _id: token });
      const user = userList[0];
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: '无管理员权限' });
      }
      
      req.adminUser = user;
      next();
    } catch (error) {
      res.status(401).json({ message: '未授权' });
    }
  }

  // 获取数据库统计
  async getDatabaseStats(req, res) {
    try {
      const stats = {
        users: (await users.read({})).length,
        friends: (await friends.read({})).length,
        friendRequests: (await friendRequests.read({})).length,
        chats: (await chats.read({})).length,
        chatMembers: (await chatMembers.read({})).length,
        messages: (await messages.read({})).length,
        points: (await points.read({})).length,
        moments: (await moments.read({})).length,
        momentLikes: (await momentLikes.read({})).length,
        momentComments: (await momentComments.read({})).length,
        communityPosts: (await communityPosts.read({})).length,
        communityComments: (await communityComments.read({})).length,
        communityLikes: (await communityLikes.read({})).length
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: '获取统计失败' });
    }
  }

  // 获取表数据
  async getTableData(req, res) {
    try {
      const { tableName } = req.params;
      const tableMap = {
        users,
        friends,
        friendRequests,
        chats,
        chatMembers,
        messages,
        points,
        moments,
        momentLikes,
        momentComments,
        communityPosts,
        communityComments,
        communityLikes
      };
      
      const table = tableMap[tableName];
      if (!table) {
        return res.status(404).json({ message: '表不存在' });
      }
      
      // 读取所有数据，不进行任何过滤
      const data = await table.read({});
      
      // 对于用户表，移除密码字段但保留其他所有字段
      if (tableName === 'users') {
        const safeData = data.map(user => {
          const { password, ...safeUser } = user;
          return safeUser;
        });
        return res.json(safeData);
      }
      
      res.json(data);
    } catch (error) {
      console.error('获取表数据失败:', error);
      res.status(500).json({ message: '获取数据失败' });
    }
  }

  // 删除表中的行
  async deleteTableRow(req, res) {
    try {
      const { tableName, rowId } = req.params;
      const tableMap = {
        users,
        friends,
        friendRequests,
        chats,
        chatMembers,
        messages,
        points,
        moments,
        momentLikes,
        momentComments,
        communityPosts,
        communityComments,
        communityLikes
      };
      
      const table = tableMap[tableName];
      if (!table) {
        return res.status(404).json({ message: '表不存在' });
      }
      
      await table.delete({ _id: rowId });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: '删除失败' });
    }
  }

  // 导出数据库
  async exportDatabase(req, res) {
    try {
      const data = {
        users: await users.read({}),
        friends: await friends.read({}),
        friendRequests: await friendRequests.read({}),
        chats: await chats.read({}),
        chatMembers: await chatMembers.read({}),
        messages: await messages.read({}),
        points: await points.read({}),
        moments: await moments.read({}),
        momentLikes: await momentLikes.read({}),
        momentComments: await momentComments.read({}),
        communityPosts: await communityPosts.read({}),
        communityComments: await communityComments.read({}),
        communityLikes: await communityLikes.read({}),
        exportTime: new Date().toISOString()
      };
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: '导出失败' });
    }
  }

  // 清空数据库（危险操作）
  async clearDatabase(req, res) {
    try {
      await users.delete({});
      await friends.delete({});
      await friendRequests.delete({});
      await chats.delete({});
      await chatMembers.delete({});
      await messages.delete({});
      await points.delete({});
      await moments.delete({});
      await momentLikes.delete({});
      await momentComments.delete({});
      await communityPosts.delete({});
      await communityComments.delete({});
      await communityLikes.delete({});
      
      res.json({ success: true, message: '数据库已清空' });
    } catch (error) {
      res.status(500).json({ message: '清空失败' });
    }
  }

  // 获取用户列表
  async getUsers(req, res) {
    try {
      const { search } = req.query;
      let query = {};
      
      if (search) {
        query = {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { nickname: { $regex: search, $options: 'i' } }
          ]
        };
      }
      
      const usersList = await users.read(query);
      // 移除密码字段
      const safeUsers = usersList.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: '获取用户失败' });
    }
  }

  // 删除用户
  async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      
      // 删除用户
      await users.delete({ _id: userId });
      
      // 删除相关数据
      await friends.delete({ $or: [{ userId }, { friendId: userId }] });
      await friendRequests.delete({ $or: [{ fromUserId: userId }, { toUserId: userId }] });
      await chatMembers.delete({ userId });
      await messages.delete({ senderId: userId });
      await points.delete({ userId });
      await moments.delete({ userId });
      await momentLikes.delete({ userId });
      await momentComments.delete({ userId });
      await communityPosts.delete({ userId });
      await communityComments.delete({ userId });
      await communityLikes.delete({ userId });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: '删除用户失败' });
    }
  }
}

module.exports = new AdminController();
