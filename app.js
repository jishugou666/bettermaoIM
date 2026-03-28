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

// 加载配置
const config = require('./config');

// 初始化数据库
require('./db');

// 导入路由
const authRoutes = require('./biz/auth/auth.routes');
const userRoutes = require('./biz/user/user.routes');
const chatRoutes = require('./biz/chat/chat.routes');
const friendRoutes = require('./biz/friend/friend.routes');

// 导入Socket处理
const chatSocket = require('./biz/socket/chat.socket');

// 导入中间件
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/error');
const loggerMiddleware = require('./middleware/logger');

// 创建日志实例
const logger = winston.createLogger({
  level: config.logger.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: config.logger.file }),
    new winston.transports.Console()
  ]
});

// 创建Express应用
const app = express();

// 中间件加载顺序（最佳实践）
// 1. 安全相关中间件
app.use(helmet());

// 2. 日志中间件
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// 3. 通用中间件
app.use(cors({
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. 静态资源
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 5. 速率限制
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// 6. 自定义中间件
app.use(loggerMiddleware);

// 7. 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/friends', friendRoutes);

// 8. 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 9. 前端页面
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

// 10. 错误处理中间件
app.use(errorHandler);

// 创建HTTP服务器
const server = http.createServer(app);

// 初始化Socket.IO
const io = new Server(server, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST']
  }
});
chatSocket(io);

// 全局错误捕获
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // 可以在这里添加重启逻辑
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  // 可以在这里添加重启逻辑
});

// 启动服务器
const PORT = config.server.port;
const HOST = config.server.host;

server.listen(PORT, HOST, () => {
  logger.info(`Server running on http://${HOST}:${PORT}`);
  logger.info(`Environment: ${config.server.env}`);
  logger.info(`Frontend URL: ${config.cors.origin}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  logger.info('Shutting down server...');
  server.close(() => {
    logger.info('Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('Shutting down server...');
  server.close(() => {
    logger.info('Server stopped');
    process.exit(0);
  });
});

module.exports = app;