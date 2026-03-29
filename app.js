// 兼容 NeDB 在 Node.js 高版本中的 util.isDate 问题
const util = require('util');
if (!util.isDate) {
  util.isDate = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Date]';
  };
}

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const winston = require('winston');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// 加载环境变量
dotenv.config();

// 初始化数据库
require('./db');

// 创建 Express 应用
const app = express();
const server = http.createServer(app);

// 初始化 Socket.IO
const { initSocket } = require('./socket');
initSocket(server);

// 配置中间件
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置速率限制 - 开发环境提高限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP限制1000个请求
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 静态文件服务
app.use(express.static(path.join(__dirname, 'ui', 'dist')));
// 上传文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
const authRoutes = require('./biz/auth/auth.routes');
const userRoutes = require('./routes/user.routes');
const friendRoutes = require('./routes/friend.routes');
const chatRoutes = require('./routes/chat.routes');
const pointsRoutes = require('./routes/points.routes');
const momentsRoutes = require('./routes/moments.routes');
const communityRoutes = require('./routes/community.routes');
const adminRoutes = require('./routes/admin.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/moments', momentsRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});