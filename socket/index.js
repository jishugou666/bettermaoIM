// --- 修改开始 ---
const jwt = require('jsonwebtoken');
const { sessionMembers, users } = require('../db/crud');

let io;
const userSockets = new Map();

const initSocket = (server) => {
  io = require('socket.io')(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
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

    // 更新用户状态为在线（兼容两种字段名）
    users.update({ _id: socket.userId }, { status: 'online' });

    // 通知其他用户该用户上线
    socket.broadcast.emit('user:online', { userId: socket.userId, username: socket.username });

    // 加入用户的所有会话房间
    joinUserSessions(socket);

    // 监听加入聊天房间
    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.username} joined chat: ${chatId}`);
    });

    // 监听发送消息事件
    socket.on('sendMessage', async (data) => {
      try {
        const { chatId, message } = data;
        // 广播消息到聊天房间
        io.to(chatId).emit('newMessage', message);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // 发送好友请求
    socket.on('sendFriendRequest', (data) => {
      const { toUserId } = data;
      // 发送好友请求到目标用户
      if (userSockets.has(toUserId)) {
        io.to(userSockets.get(toUserId)).emit('friendRequest', data);
      }
    });

    // 处理好友请求
    socket.on('handleFriendRequest', (data) => {
      const { fromUserId } = data;
      // 发送处理结果到请求发送者
      if (userSockets.has(fromUserId)) {
        io.to(userSockets.get(fromUserId)).emit('friendRequestHandled', data);
      }
    });

    // 点赞朋友圈
    socket.on('likeMoment', (data) => {
      const { momentId, userId } = data;
      // 广播点赞消息
      io.emit('momentLiked', { momentId, userId });
    });

    // 评论朋友圈
    socket.on('commentMoment', (data) => {
      const { momentId, comment } = data;
      // 广播评论消息
      io.emit('momentCommented', { momentId, comment });
    });

    // 断开连接
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.username} (${socket.userId})`);
      // 移除用户 socket 连接
      userSockets.delete(socket.userId);
      // 更新用户状态为离线（兼容两种字段名）
      await users.update({ _id: socket.userId }, { status: 'offline' });
      // 广播用户离线状态
      socket.broadcast.emit('user:offline', { userId: socket.userId });
    });
  });

  return io;
};

async function joinUserSessions(socket) {
  try {
    // 获取用户参与的所有会话（兼容两种字段名）
    const memberList = await sessionMembers.read({ 
      $or: [
        { user_id: socket.userId },
        { userId: socket.userId }
      ]
    });
    
    // 加入每个会话的房间（兼容两种字段名）
    for (const member of memberList) {
      const sessionId = member.session_id || member.chatId || member.sessionId;
      if (sessionId) {
        socket.join(sessionId);
        console.log(`User ${socket.username} joined session ${sessionId}`);
      }
    }
  } catch (error) {
    console.error('Error joining sessions:', error);
  }
}

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

const getUserSocket = (userId) => {
  return userSockets.get(userId);
};

const sendToSession = (sessionId, event, data) => {
  if (io) {
    io.to(sessionId).emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  getUserSocket,
  sendToSession
};
// --- 修改结束 ---