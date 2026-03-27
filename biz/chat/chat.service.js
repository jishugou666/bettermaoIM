const { sessions, sessionMembers, messages, users } = require('../../db/crud');

class ChatService {
  async getSessions(userId) {
    try {
      // 获取用户参与的所有会话
      const sessionMemberList = await sessionMembers.read({ user_id: userId });
      const sessionIds = sessionMemberList.map(sm => sm.session_id);

      if (sessionIds.length === 0) {
        return [];
      }

      // 获取会话信息
      const sessionList = [];
      for (const sessionId of sessionIds) {
        const session = await sessions.getById(sessionId);
        if (session) {
          // 获取会话成员
          const members = await sessionMembers.read({ session_id: sessionId });
          const memberIds = members.map(m => m.user_id);
          
          // 获取成员详细信息
          const memberDetails = [];
          for (const memberId of memberIds) {
            const user = await users.getById(memberId);
            if (user) {
              delete user.password;
              memberDetails.push(user);
            }
          }

          // 获取最后一条消息
          const lastMessage = await messages.query(
            `SELECT * FROM messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 1`,
            [sessionId]
          );

          session.members = memberDetails;
          session.lastMessage = lastMessage[0] || null;
          sessionList.push(session);
        }
      }

      // 按最后消息时间排序
      sessionList.sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
        return timeB - timeA;
      });

      return sessionList;
    } catch (error) {
      throw new Error(`Get sessions failed: ${error.message}`);
    }
  }

  async getMessages(sessionId, userId, limit = 50, offset = 0) {
    try {
      // 验证用户是否是会话成员
      const member = await sessionMembers.read({ session_id: sessionId, user_id: userId });
      if (member.length === 0) {
        throw new Error('You are not a member of this session');
      }

      // 获取消息
      const messageList = await messages.query(
        `SELECT * FROM messages WHERE session_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [sessionId, limit, offset]
      );

      // 按时间正序返回
      return messageList.reverse();
    } catch (error) {
      throw new Error(`Get messages failed: ${error.message}`);
    }
  }

  async sendMessage(sessionId, userId, content, type = 'text') {
    try {
      // 验证用户是否是会话成员
      const member = await sessionMembers.read({ session_id: sessionId, user_id: userId });
      if (member.length === 0) {
        throw new Error('You are not a member of this session');
      }

      // 创建消息
      const result = await messages.create({
        session_id: sessionId,
        sender_id: userId,
        content,
        type,
        status: 'sent'
      });

      // 获取创建的消息
      const message = await messages.getById(result.lastID);
      if (!message) {
        throw new Error('Failed to send message');
      }

      // 获取发送者信息
      const sender = await users.getById(userId);
      if (sender) {
        delete sender.password;
        message.sender = sender;
      }

      return message;
    } catch (error) {
      throw new Error(`Send message failed: ${error.message}`);
    }
  }

  async createSession(type, name, memberIds) {
    try {
      // 验证成员ID是否有效
      const validMemberIds = [];
      for (const memberId of memberIds) {
        const user = await users.getById(memberId);
        if (user) {
          validMemberIds.push(memberId);
        }
      }

      if (validMemberIds.length === 0) {
        throw new Error('No valid members found');
      }

      // 创建会话
      const sessionResult = await sessions.create({
        type,
        name
      });

      const sessionId = sessionResult.lastID;

      // 添加成员
      for (const memberId of validMemberIds) {
        await sessionMembers.create({
          session_id: sessionId,
          user_id: memberId
        });
      }

      // 获取创建的会话
      const session = await sessions.getById(sessionId);
      if (!session) {
        throw new Error('Failed to create session');
      }

      // 获取成员详细信息
      const memberDetails = [];
      for (const memberId of validMemberIds) {
        const user = await users.getById(memberId);
        if (user) {
          delete user.password;
          memberDetails.push(user);
        }
      }

      session.members = memberDetails;
      return session;
    } catch (error) {
      throw new Error(`Create session failed: ${error.message}`);
    }
  }

  async updateSession(sessionId, userId, updates) {
    try {
      // 验证用户是否是会话成员
      const member = await sessionMembers.read({ session_id: sessionId, user_id: userId });
      if (member.length === 0) {
        throw new Error('You are not a member of this session');
      }

      // 更新会话
      await sessions.update({ id: sessionId }, updates);

      // 获取更新后的会话
      const session = await sessions.getById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // 获取成员详细信息
      const members = await sessionMembers.read({ session_id: sessionId });
      const memberIds = members.map(m => m.user_id);
      const memberDetails = [];

      for (const memberId of memberIds) {
        const user = await users.getById(memberId);
        if (user) {
          delete user.password;
          memberDetails.push(user);
        }
      }

      session.members = memberDetails;
      return session;
    } catch (error) {
      throw new Error(`Update session failed: ${error.message}`);
    }
  }

  async deleteSession(sessionId, userId) {
    try {
      // 验证用户是否是会话成员
      const member = await sessionMembers.read({ session_id: sessionId, user_id: userId });
      if (member.length === 0) {
        throw new Error('You are not a member of this session');
      }

      // 删除会话（级联删除会话成员和消息）
      await sessions.delete({ id: sessionId });
    } catch (error) {
      throw new Error(`Delete session failed: ${error.message}`);
    }
  }
}

module.exports = new ChatService();