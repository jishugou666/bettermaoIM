const jwt = require('jsonwebtoken');
const { users, sessionMembers } = require('../../db/crud');

function chatSocket(io) {
  // 存储用户Socket连接
  const userSockets = new Map();

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.username} (${socket.userId})`);

    // 存储用户Socket连接
    userSockets.set(socket.userId, socket.id);

    // 更新用户状态为在线
    users.update({ id: socket.userId }, { status: 'online' });

    // 通知其他用户该用户上线
    socket.broadcast.emit('user:online', { userId: socket.userId, username: socket.username });

    // 加入用户的所有会话房间
    joinUserSessions(socket);

    // 监听发送消息事件
    socket.on('message:send', async (data) => {
      try {
        const { sessionId, content, type = 'text' } = data;

        // 验证用户是否是会话成员
        const member = await sessionMembers.read({ session_id: sessionId, user_id: socket.userId });
        if (member.length === 0) {
          socket.emit('error', { message: 'You are not a member of this session' });
          return;
        }

        // 广播消息到会话房间
        io.to(sessionId).emit('message:new', {
          sessionId,
          senderId: socket.userId,
          senderName: socket.username,
          content,
          type,
          status: 'sent',
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // 监听用户 typing 事件
    socket.on('typing:start', (sessionId) => {
      socket.to(sessionId).emit('typing:started', { userId: socket.userId, sessionId });
    });

    // 监听用户停止 typing 事件
    socket.on('typing:stop', (sessionId) => {
      socket.to(sessionId).emit('typing:stopped', { userId: socket.userId, sessionId });
    });

    // 监听断开连接事件
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.username} (${socket.userId})`);

      // 移除用户Socket连接
      userSockets.delete(socket.userId);

      // 更新用户状态为离线
      await users.update({ id: socket.userId }, { status: 'offline' });

      // 通知其他用户该用户下线
      socket.broadcast.emit('user:offline', { userId: socket.userId, username: socket.username });
    });
  });

  async function joinUserSessions(socket) {
    try {
      // 获取用户参与的所有会话
      const memberList = await sessionMembers.read({ user_id: socket.userId });
      
      // 加入每个会话的房间
      for (const member of memberList) {
        socket.join(member.session_id);
        console.log(`User ${socket.username} joined session ${member.session_id}`);
      }
    } catch (error) {
      console.error('Error joining sessions:', error);
    }
  }

  // 导出方法供其他模块使用
  return {
    io,
    userSockets,
    sendToUser: (userId, event, data) => {
      const socketId = userSockets.get(userId);
      if (socketId) {
        io.to(socketId).emit(event, data);
      }
    },
    sendToSession: (sessionId, event, data) => {
      io.to(sessionId).emit(event, data);
    }
  };
}

module.exports = chatSocket;