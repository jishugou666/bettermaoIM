const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 存储用户连接信息
const userConnections = new Map();

// 模拟Redis客户端
const redisClient = {
  get: async () => null,
  set: async () => {},
  del: async () => {},
  lPush: async () => {},
  lPop: async () => null
};

// 服务器ID
const serverId = Date.now().toString(36);

// 处理WebSocket连接
io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id);

  // 登录
  socket.on('login', async (data) => {
    const { userId } = data;
    userConnections.set(userId, socket.id);
    
    // 记录用户与服务器的映射关系到Redis
    await redisClient.set(`im:user:${userId}`, serverId);
    
    console.log(`User ${userId} logged in`);
  });

  // 发送消息
  socket.on('sendMessage', async (message) => {
    const { toUserId, fromUserId, content, type } = message;
    
    // 检查接收者是否在线
    const targetServerId = await redisClient.get(`im:user:${toUserId}`);
    
    if (targetServerId === serverId) {
      // 接收者在当前服务器，直接推送
      const targetSocketId = userConnections.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('message', message);
      }
    } else {
      // 接收者在其他服务器，通过Redis转发
      await redisClient.lPush(`im:unread:${targetServerId}`, JSON.stringify(message));
    }
  });

  // 断开连接
  socket.on('disconnect', async () => {
    // 清理用户连接信息
    for (const [userId, socketId] of userConnections.entries()) {
      if (socketId === socket.id) {
        userConnections.delete(userId);
        // 从Redis中移除用户映射
        await redisClient.del(`im:user:${userId}`);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// 启动Redis消息监听
async function startRedisListener() {
  while (true) {
    try {
      // 从Redis队列中获取消息
      const messageStr = await redisClient.lPop(`im:unread:${serverId}`);
      if (messageStr) {
        const message = JSON.parse(messageStr);
        const { toUserId } = message;
        
        // 推送消息给目标用户
        const targetSocketId = userConnections.get(toUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit('message', message);
        }
      }
      // 短暂延迟，避免CPU占用过高
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Redis listener error:', error);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// 启动服务器
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`IM Server running on port ${PORT}`);
  startRedisListener();
});

module.exports = server;