const jwt = require('jsonwebtoken');

let io;
const users = new Map();

const initSocket = (server) => {
  io = require('socket.io')(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected');

    // 验证用户 token
    socket.on('authenticate', (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const userId = decoded.userId;
        
        // 存储用户 socket 连接
        users.set(userId, socket.id);
        
        // 加入用户自己的房间
        socket.join(userId);
        
        // 发送认证成功消息
        socket.emit('authenticated', { userId });
        
        // 广播用户在线状态
        socket.broadcast.emit('userOnline', { userId });
      } catch (error) {
        socket.disconnect();
      }
    });

    // 加入聊天房间
    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat: ${chatId}`);
    });

    // 发送消息
    socket.on('sendMessage', (data) => {
      const { chatId, message } = data;
      // 广播消息到聊天房间
      io.to(chatId).emit('newMessage', message);
    });

    // 发送好友请求
    socket.on('sendFriendRequest', (data) => {
      const { toUserId } = data;
      // 发送好友请求到目标用户
      if (users.has(toUserId)) {
        io.to(toUserId).emit('friendRequest', data);
      }
    });

    // 处理好友请求
    socket.on('handleFriendRequest', (data) => {
      const { fromUserId } = data;
      // 发送处理结果到请求发送者
      if (users.has(fromUserId)) {
        io.to(fromUserId).emit('friendRequestHandled', data);
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
    socket.on('disconnect', () => {
      console.log('A user disconnected');
      // 移除用户 socket 连接
      for (const [userId, socketId] of users.entries()) {
        if (socketId === socket.id) {
          users.delete(userId);
          // 广播用户离线状态
          socket.broadcast.emit('userOffline', { userId });
          break;
        }
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

const getUserSocket = (userId) => {
  return users.get(userId);
};

module.exports = {
  initSocket,
  getIO,
  getUserSocket
};