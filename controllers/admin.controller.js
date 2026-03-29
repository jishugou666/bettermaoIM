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

  // 获取用户列表（带分页）
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
      
      // 分页处理
      const start = (page - 1) * limit;
      const end = start + parseInt(limit);
      const paginatedUsers = safeUsers.slice(start, end);
      
      res.json({
        users: paginatedUsers,
        total: safeUsers.length,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      res.status(500).json({ message: '获取用户失败' });
    }
  }

  // 获取用户详情
  async getUserDetail(req, res) {
    try {
      const { userId } = req.params;
      
      const userList = await users.read({ _id: userId });
      if (userList.length === 0) {
        return res.status(404).json({ message: '用户不存在' });
      }
      
      const user = userList[0];
      const { password, ...safeUser } = user;
      
      // 获取用户相关数据
      const friendCount = (await friends.read({ $or: [{ userId }, { friendId: userId }] })).length;
      const chatCount = (await chatMembers.read({ userId })).length;
      const momentCount = (await moments.read({ userId })).length;
      const postCount = (await communityPosts.read({ userId })).length;
      
      res.json({
        ...safeUser,
        stats: {
          friendCount,
          chatCount,
          momentCount,
          postCount
        }
      });
    } catch (error) {
      console.error('获取用户详情失败:', error);
      res.status(500).json({ message: '获取用户详情失败' });
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
      // 获取所有私聊（使用 type 字段）
      const allChats = await chats.read({ type: 'private' });
      
      // 获取私聊详情，包含成员信息和最新消息
      const chatsWithMembers = await Promise.all(
        allChats.map(async (chat) => {
          const members = await chatMembers.read({ chatId: chat._id });
          const memberUsers = await Promise.all(
            members.map(async (member) => {
              const userList = await users.read({ _id: member.userId });
              return userList[0] ? { _id: userList[0]._id, username: userList[0].username, nickname: userList[0].nickname } : null;
            })
          );
          
          // 获取最新消息 - 兼容字段名 createTime/createdAt
          const allMessages = await messages.read({ chatId: chat._id });
          // 按时间排序（兼容两种时间字段）
          allMessages.sort((a, b) => {
            const timeA = new Date(a.createdAt || a.createTime).getTime();
            const timeB = new Date(b.createdAt || b.createTime).getTime();
            return timeB - timeA;
          });
          const lastMessage = allMessages[0] || null;
          
          return {
            ...chat,
            members: memberUsers.filter(u => u !== null),
            lastMessage,
            messageCount: allMessages.length
          };
        })
      );
      
      res.json(chatsWithMembers);
    } catch (error) {
      console.error('获取私聊失败:', error);
      res.status(500).json({ message: '获取私聊失败' });
    }
  }

  // 获取私聊聊天记录
  async getPrivateChatMessages(req, res) {
    try {
      const { chatId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      
      const chatList = await chats.read({ _id: chatId });
      if (chatList.length === 0) {
        return res.status(404).json({ message: '聊天不存在' });
      }
      
      // 获取聊天记录 - 兼容字段名
      const allMessages = await messages.read({ chatId });
      // 手动排序 - 兼容 createTime/createdAt
      allMessages.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.createTime).getTime();
        const timeB = new Date(b.createdAt || b.createTime).getTime();
        return timeB - timeA;
      });
      
      const total = allMessages.length;
      
      // 分页
      const start = (page - 1) * limit;
      const end = start + parseInt(limit);
      const paginatedMessages = allMessages.slice(start, end);
      
      // 获取发送者信息 - 兼容 senderId 和 userId 字段
      const messagesWithUser = await Promise.all(
        paginatedMessages.map(async (msg) => {
          const userId = msg.senderId || msg.userId;
          const userList = await users.read({ _id: userId });
          const user = userList[0];
          return {
            ...msg,
            createdAt: msg.createdAt || msg.createTime,
            sender: user ? { _id: user._id, username: user.username, nickname: user.nickname } : null
          };
        })
      );
      
      res.json({
        messages: messagesWithUser.reverse(),
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error('获取聊天记录失败:', error);
      res.status(500).json({ message: '获取聊天记录失败' });
    }
  }

  // 获取群组列表
  async getGroups(req, res) {
    try {
      const groups = await chats.read({ type: 'group' });
      
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

  // 获取群聊详情
  async getGroupDetails(req, res) {
    try {
      const { groupId } = req.params;
      
      const groupList = await chats.read({ _id: groupId });
      const group = groupList[0];
      
      if (!group) {
        return res.status(404).json({ message: '群组不存在' });
      }
      
      const members = await chatMembers.read({ chatId: groupId });
      const memberUsers = await Promise.all(
        members.map(async (member) => {
          const userList = await users.read({ _id: member.userId });
          if (userList[0]) {
            const { password, ...safeUser } = userList[0];
            return {
              ...safeUser,
              role: member.role || 'member'
            };
          }
          return null;
        })
      );
      
      const groupWithMembers = {
        ...group,
        members: memberUsers.filter(u => u !== null)
      };
      
      res.json(groupWithMembers);
    } catch (error) {
      console.error('获取群组详情失败:', error);
      res.status(500).json({ message: '获取群组详情失败' });
    }
  }

  // 设置成员角色
  async setMemberRole(req, res) {
    try {
      const { groupId, userId } = req.params;
      const { role } = req.body;
      
      if (!role || !['member', 'admin', 'owner'].includes(role)) {
        return res.status(400).json({ message: '无效的角色' });
      }
      
      const updateResult = await chatMembers.update(
        { chatId: groupId, userId },
        { role }
      );
      
      if (updateResult === 0) {
        return res.status(404).json({ message: '成员不存在' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('设置成员角色失败:', error);
      res.status(500).json({ message: '设置成员角色失败' });
    }
  }

  // 删除成员
  async removeMember(req, res) {
    try {
      const { groupId, userId } = req.params;
      
      await chatMembers.delete({ chatId: groupId, userId });
      
      res.json({ success: true });
    } catch (error) {
      console.error('删除成员失败:', error);
      res.status(500).json({ message: '删除成员失败' });
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

  // 获取朋友圈列表（带分页）
  async getMoments(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const allMoments = await moments.read({});
      // 手动排序 - 兼容 createTime/createdAt
      allMoments.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.createTime).getTime();
        const timeB = new Date(b.createdAt || b.createTime).getTime();
        return timeB - timeA;
      });
      
      const total = allMoments.length;
      
      // 分页
      const start = (page - 1) * limit;
      const end = start + parseInt(limit);
      const paginatedMoments = allMoments.slice(start, end);
      
      const momentsWithUser = await Promise.all(
        paginatedMoments.map(async (moment) => {
          const userList = await users.read({ _id: moment.userId });
          const user = userList[0];
          const likes = await momentLikes.read({ momentId: moment._id });
          const comments = await momentComments.read({ momentId: moment._id });
          return {
            ...moment,
            createdAt: moment.createdAt || moment.createTime,
            user: user ? { username: user.username, nickname: user.nickname } : null,
            likeCount: likes.length,
            commentCount: comments.length
          };
        })
      );
      
      res.json({
        moments: momentsWithUser,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error('获取朋友圈失败:', error);
      res.status(500).json({ message: '获取朋友圈失败' });
    }
  }

  // 获取朋友圈详情（含评论）
  async getMomentDetail(req, res) {
    try {
      const { momentId } = req.params;
      const { commentPage = 1, commentLimit = 20 } = req.query;
      
      const momentList = await moments.read({ _id: momentId });
      if (momentList.length === 0) {
        return res.status(404).json({ message: '朋友圈不存在' });
      }
      
      const moment = momentList[0];
      
      // 获取用户信息
      const userList = await users.read({ _id: moment.userId });
      const user = userList[0];
      
      // 获取点赞
      const likes = await momentLikes.read({ momentId });
      const likesWithUser = await Promise.all(
        likes.map(async (like) => {
          const likeUserList = await users.read({ _id: like.userId });
          return likeUserList[0] ? { ...like, user: { username: likeUserList[0].username, nickname: likeUserList[0].nickname } } : like;
        })
      );
      
      // 获取评论（带分页）
      const allComments = await momentComments.read({ momentId });
      // 手动排序评论
      allComments.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.createTime).getTime();
        const timeB = new Date(b.createdAt || b.createTime).getTime();
        return timeA - timeB;
      });
      const totalComments = allComments.length;
      
      const commentStart = (commentPage - 1) * commentLimit;
      const commentEnd = commentStart + parseInt(commentLimit);
      const paginatedComments = allComments.slice(commentStart, commentEnd);
      
      const commentsWithUser = await Promise.all(
        paginatedComments.map(async (comment) => {
          const commentUserList = await users.read({ _id: comment.userId });
          return commentUserList[0] ? { 
            ...comment, 
            createdAt: comment.createdAt || comment.createTime,
            user: { username: commentUserList[0].username, nickname: commentUserList[0].nickname } 
          } : comment;
        })
      );
      
      res.json({
        moment: {
          ...moment,
          createdAt: moment.createdAt || moment.createTime,
          user: user ? { username: user.username, nickname: user.nickname } : null
        },
        likes: likesWithUser,
        comments: commentsWithUser,
        totalComments,
        commentPage: parseInt(commentPage),
        commentLimit: parseInt(commentLimit)
      });
    } catch (error) {
      console.error('获取朋友圈详情失败:', error);
      res.status(500).json({ message: '获取朋友圈详情失败' });
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

  // 获取帖子列表（带分页）
  async getPosts(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const allPosts = await communityPosts.read({});
      // 手动排序
      allPosts.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
      
      const total = allPosts.length;
      
      // 分页
      const start = (page - 1) * limit;
      const end = start + parseInt(limit);
      const paginatedPosts = allPosts.slice(start, end);
      
      const postsWithUser = await Promise.all(
        paginatedPosts.map(async (post) => {
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
      
      res.json({
        posts: postsWithUser,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error('获取帖子失败:', error);
      res.status(500).json({ message: '获取帖子失败' });
    }
  }

  // 获取帖子详情（含评论）
  async getPostDetail(req, res) {
    try {
      const { postId } = req.params;
      const { commentPage = 1, commentLimit = 20 } = req.query;
      
      const postList = await communityPosts.read({ _id: postId });
      if (postList.length === 0) {
        return res.status(404).json({ message: '帖子不存在' });
      }
      
      const post = postList[0];
      
      // 获取用户信息
      const userList = await users.read({ _id: post.userId });
      const user = userList[0];
      
      // 获取点赞
      const likes = await communityLikes.read({ postId });
      const likesWithUser = await Promise.all(
        likes.map(async (like) => {
          const likeUserList = await users.read({ _id: like.userId });
          return likeUserList[0] ? { ...like, user: { username: likeUserList[0].username, nickname: likeUserList[0].nickname } } : like;
        })
      );
      
      // 获取评论（带分页）
      const allComments = await communityComments.read({ postId });
      // 手动排序评论
      allComments.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.createTime).getTime();
        const timeB = new Date(b.createdAt || b.createTime).getTime();
        return timeA - timeB;
      });
      const totalComments = allComments.length;
      
      const commentStart = (commentPage - 1) * commentLimit;
      const commentEnd = commentStart + parseInt(commentLimit);
      const paginatedComments = allComments.slice(commentStart, commentEnd);
      
      const commentsWithUser = await Promise.all(
        paginatedComments.map(async (comment) => {
          const commentUserList = await users.read({ _id: comment.userId });
          return commentUserList[0] ? { 
            ...comment, 
            createdAt: comment.createdAt || comment.createTime,
            user: { username: commentUserList[0].username, nickname: commentUserList[0].nickname } 
          } : comment;
        })
      );
      
      res.json({
        post: {
          ...post,
          user: user ? { username: user.username, nickname: user.nickname } : null
        },
        likes: likesWithUser,
        comments: commentsWithUser,
        totalComments,
        commentPage: parseInt(commentPage),
        commentLimit: parseInt(commentLimit)
      });
    } catch (error) {
      console.error('获取帖子详情失败:', error);
      res.status(500).json({ message: '获取帖子详情失败' });
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
