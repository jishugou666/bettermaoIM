const { users, friends, friendRequests, chats, chatMembers, messages, points, moments, momentLikes, momentComments, communityPosts, communityComments, communityLikes, adminUsers } = require('../db/crud');
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bettermao-admin-secret-key-2024';

// 角色定义
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator'
};

// 角色权限映射
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ['*'],
  [ROLES.ADMIN]: ['database:read', 'users:read', 'users:write', 'chats:read', 'chats:write', 'groups:read', 'groups:write', 'moments:read', 'moments:write', 'posts:read', 'posts:write'],
  [ROLES.MODERATOR]: ['users:read', 'chats:read', 'moments:read', 'moments:write', 'posts:read', 'posts:write']
};

class AdminController {
  // 检查权限
  hasPermission(role, permission) {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  }

  // 生成JWT Token（改为静态方法，避免this上下文问题）
  static generateToken(admin) {
    return jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  // 管理员登录
  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      console.log('[Admin Login] 尝试登录用户:', username);
      
      // 查找管理员
      const adminList = await adminUsers.read({ username });
      const admin = adminList[0];
      
      if (!admin) {
        console.log('[Admin Login] 管理员不存在');
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
      }
      
      console.log('[Admin Login] 找到管理员:', admin.username);
      
      // 验证密码
      const isValid = await bcrypt.compare(password, admin.password);
      if (!isValid) {
        console.log('[Admin Login] 密码验证失败');
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
      }
      
      console.log('[Admin Login] 密码验证成功');
      
      // 更新最后登录时间（确保admin有_id）
      if (admin._id) {
        try {
          await adminUsers.update({ _id: admin._id }, { lastLoginAt: new Date() });
        } catch (updateErr) {
          console.warn('[Admin Login] 更新登录时间失败:', updateErr.message);
        }
      }
      
      // 返回用户信息和token
      const token = AdminController.generateToken(admin);
      
      console.log('[Admin Login] 登录成功');
      
      res.json({ 
        success: true, 
        token,
        user: {
          id: admin._id,
          username: admin.username,
          nickname: admin.nickname,
          role: admin.role
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ message: '服务器错误', error: error.message });
    }
  }

  // 验证管理员权限中间件
  async verifyAdmin(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: '未授权' });
      }
      
      // 验证token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // 查找管理员
      const adminList = await adminUsers.read({ _id: decoded.id });
      const admin = adminList[0];
      
      if (!admin) {
        return res.status(401).json({ message: '未授权' });
      }
      
      req.adminUser = admin;
      next();
    } catch (error) {
      res.status(401).json({ message: '未授权' });
    }
  }

  // 获取当前管理员信息
  async getProfile(req, res) {
    try {
      const { password, ...safeAdmin } = req.adminUser;
      res.json(safeAdmin);
    } catch (error) {
      res.status(500).json({ message: '获取信息失败' });
    }
  }

  // 创建管理员（仅站长）
  async createAdmin(req, res) {
    try {
      if (req.adminUser.role !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({ message: '无权限' });
      }
      
      const { username, password, nickname, role } = req.body;
      
      // 检查用户名是否已存在
      const existing = await adminUsers.read({ username });
      if (existing.length > 0) {
        return res.status(400).json({ message: '用户名已存在' });
      }
      
      // 哈希密码
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newAdmin = await adminUsers.create({
        username,
        password: hashedPassword,
        nickname: nickname || username,
        role: role || ROLES.MODERATOR,
        createdAt: new Date(),
        createdBy: req.adminUser._id
      });
      
      const { password: _, ...safeAdmin } = newAdmin;
      res.json({ success: true, admin: safeAdmin });
    } catch (error) {
      res.status(500).json({ message: '创建失败' });
    }
  }

  // 获取管理员列表
  async getAdmins(req, res) {
    try {
      const admins = await adminUsers.read({});
      const safeAdmins = admins.map(admin => {
        const { password, ...safeAdmin } = admin;
        return safeAdmin;
      });
      res.json(safeAdmins);
    } catch (error) {
      res.status(500).json({ message: '获取失败' });
    }
  }

  // 删除管理员（仅站长）
  async deleteAdmin(req, res) {
    try {
      if (req.adminUser.role !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({ message: '无权限' });
      }
      
      const { adminId } = req.params;
      
      // 不能删除自己
      if (adminId === req.adminUser._id) {
        return res.status(400).json({ message: '不能删除自己' });
      }
      
      await adminUsers.delete({ _id: adminId });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: '删除失败' });
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
      
      const data = await table.read({});
      
      // 对于用户表，移除密码字段
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

  // 清空数据库（危险操作，仅站长）
  async clearDatabase(req, res) {
    try {
      if (req.adminUser.role !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({ message: '无权限' });
      }
      
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
      const { search, page = 1, limit = 20 } = req.query;
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

  // 更新用户
  async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const { nickname, email, role, isBanned } = req.body;
      
      const updateData = {};
      if (nickname !== undefined) updateData.nickname = nickname;
      if (email !== undefined) updateData.email = email;
      if (role !== undefined) updateData.role = role;
      if (isBanned !== undefined) updateData.isBanned = isBanned;
      
      await users.update({ _id: userId }, updateData);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: '更新用户失败' });
    }
  }

  // 获取私聊列表
  async getPrivateChats(req, res) {
    try {
      // 获取所有私聊（非群组）
      const allChats = await chats.read({ isGroup: { $ne: true } });
      
      // 获取私聊详情，包含成员信息
      const chatsWithMembers = await Promise.all(
        allChats.map(async (chat) => {
          const members = await chatMembers.read({ chatId: chat._id });
          const memberUsers = await Promise.all(
            members.map(async (member) => {
              const userList = await users.read({ _id: member.userId });
              return userList[0] ? { _id: userList[0]._id, username: userList[0].username, nickname: userList[0].nickname } : null;
            })
          );
          return {
            ...chat,
            members: memberUsers.filter(u => u !== null)
          };
        })
      );
      
      res.json(chatsWithMembers);
    } catch (error) {
      res.status(500).json({ message: '获取私聊失败' });
    }
  }

  // 获取群组列表
  async getGroups(req, res) {
    try {
      const groups = await chats.read({ isGroup: true });
      
      const groupsWithDetails = await Promise.all(
        groups.map(async (group) => {
          const members = await chatMembers.read({ chatId: group._id });
          const memberCount = members.length;
          return { ...group, memberCount };
        })
      );
      
      res.json(groupsWithDetails);
    } catch (error) {
      res.status(500).json({ message: '获取群组失败' });
    }
  }

  // 删除群组
  async deleteGroup(req, res) {
    try {
      const { groupId } = req.params;
      
      await chats.delete({ _id: groupId });
      await chatMembers.delete({ chatId: groupId });
      await messages.delete({ chatId: groupId });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: '删除群组失败' });
    }
  }

  // 获取朋友圈列表
  async getMoments(req, res) {
    try {
      const allMoments = await moments.read({}, { sort: { createdAt: -1 } });
      
      const momentsWithUser = await Promise.all(
        allMoments.map(async (moment) => {
          const userList = await users.read({ _id: moment.userId });
          const user = userList[0];
          const likes = await momentLikes.read({ momentId: moment._id });
          const comments = await momentComments.read({ momentId: moment._id });
          return {
            ...moment,
            user: user ? { username: user.username, nickname: user.nickname } : null,
            likeCount: likes.length,
            commentCount: comments.length
          };
        })
      );
      
      res.json(momentsWithUser);
    } catch (error) {
      res.status(500).json({ message: '获取朋友圈失败' });
    }
  }

  // 删除朋友圈
  async deleteMoment(req, res) {
    try {
      const { momentId } = req.params;
      
      await moments.delete({ _id: momentId });
      await momentLikes.delete({ momentId });
      await momentComments.delete({ momentId });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: '删除朋友圈失败' });
    }
  }

  // 获取帖子列表
  async getPosts(req, res) {
    try {
      const allPosts = await communityPosts.read({}, { sort: { createdAt: -1 } });
      
      const postsWithUser = await Promise.all(
        allPosts.map(async (post) => {
          const userList = await users.read({ _id: post.userId });
          const user = userList[0];
          const likes = await communityLikes.read({ postId: post._id });
          const comments = await communityComments.read({ postId: post._id });
          return {
            ...post,
            user: user ? { username: user.username, nickname: user.nickname } : null,
            likeCount: likes.length,
            commentCount: comments.length
          };
        })
      );
      
      res.json(postsWithUser);
    } catch (error) {
      res.status(500).json({ message: '获取帖子失败' });
    }
  }

  // 删除帖子
  async deletePost(req, res) {
    try {
      const { postId } = req.params;
      
      await communityPosts.delete({ _id: postId });
      await communityLikes.delete({ postId });
      await communityComments.delete({ postId });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: '删除帖子失败' });
    }
  }
}

module.exports = new AdminController();
