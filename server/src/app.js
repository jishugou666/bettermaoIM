const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const winston = require('winston');
const authRoutes = require('./modules/auth/auth.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const friendRoutes = require('./modules/friend/friend.routes');
const creditRoutes = require('./modules/credit/credit.routes');
const userRoutes = require('./modules/user/user.routes');
const momentRoutes = require('./modules/moment/moment.routes');
const uploadRoutes = require('./modules/upload/upload.routes');
const communityRoutes = require('./modules/community/community.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const socketAuthMiddleware = require('./core/socketAuth');
const chatSocket = require('./socket/chat.socket');
const redisClient = require('./core/redis');

require('dotenv').config();

// Environment variable validation
const requiredEnvVars = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET'];
const missingVars = [];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
}

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('\nPlease set these variables in your .env file or environment.');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    console.warn('⚠️  Running in development mode with missing environment variables.');
  }
} else {
  console.log('✅ All required environment variables are set.');
}

// Logger setup
const isDevelopment = process.env.NODE_ENV === 'development';
const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: isDevelopment ? "*" : process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  },
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  // Vercel Serverless compatibility
  pingInterval: 25000,
  pingTimeout: 5000,
  maxHttpBufferSize: 1e6,
  // Enable reconnection
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});

const path = require('path');

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow loading images from other origins (or same origin)
}));

// CORS configuration
if (isDevelopment) {
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
}
// In production, CORS is handled by Vercel's edge network
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
if (isDevelopment) {
  app.use(morgan('dev'));
}
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// History route fallback for frontend routes
app.get('*', (req, res, next) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  } else {
    next();
  }
});

// Rate limiting using Redis for distributed environments
class RedisRateLimit {
  constructor(options) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.max = options.max || 100; // limit each IP to 100 requests per windowMs
    this.keyGenerator = options.keyGenerator || (req => req.ip);
  }

  async middleware(req, res, next) {
    try {
      const key = `rate_limit:${this.keyGenerator(req)}`;
      const current = await redisClient.get(key);
      
      if (current) {
        const count = parseInt(current);
        if (count >= this.max) {
          return res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later.'
          });
        }
        await redisClient.incr(key);
      } else {
        await redisClient.set(key, 1);
        await redisClient.expire(key, Math.ceil(this.windowMs / 1000));
      }
      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      // Fallback to allowing the request if Redis fails
      next();
    }
  }
}

// Create rate limiter instance
const limiter = new RedisRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter.middleware);

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'BetterMao API is running', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/friend', friendRoutes);
app.use('/credit', creditRoutes);
app.use('/user', userRoutes);
app.use('/moment', momentRoutes);
app.use('/upload', uploadRoutes);
app.use('/community', communityRoutes);
app.use('/notification', notificationRoutes);

// Error handling
app.use((err, req, res, next) => {
  logger.error(err.stack);
  
  // 统一错误响应格式
  const errorResponse = {
    success: false,
    message: err.message || 'Something broke!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };
  
  // 根据错误类型设置不同的状态码
  let statusCode = 500;
  if (err.name === 'ValidationError') statusCode = 400;
  if (err.name === 'UnauthorizedError') statusCode = 401;
  if (err.name === 'ForbiddenError') statusCode = 403;
  if (err.name === 'NotFoundError') statusCode = 404;
  
  res.status(statusCode).json(errorResponse);
});

// Socket.IO Middleware
io.use(socketAuthMiddleware);

// Socket.IO connection
io.on('connection', async (socket) => {
  try {
    if (!socket.user) {
      logger.warn('Socket connected without user authentication');
      return;
    }
    
    const userId = socket.user.id.toString();
    logger.info(`User connected: ${socket.user.username} (${socket.id})`);
    
    try {
      // Add to online set and increment connection count
      await redisClient.sAdd('online_users', userId);
      const connectionCount = await redisClient.incr(`user_connections:${userId}`);

      // If this is the first connection, broadcast online status
      if (connectionCount === 1) {
        io.emit('user_status', { userId: parseInt(userId), status: 'online' });
      }
      
      // Send current online users to the newly connected user
      const onlineUserIds = await redisClient.sMembers('online_users');
      socket.emit('online_users', onlineUserIds.map(id => parseInt(id)));

    } catch (err) {
      logger.error('Redis error on connection:', err);
    }

    // Initialize chat socket handlers
    chatSocket(io, socket);

    socket.on('disconnect', async () => {
      try {
        if (!socket.user) return;
        
        logger.info(`User disconnected: ${socket.user.username} (${socket.id})`);
        
        try {
          const connectionCount = await redisClient.decr(`user_connections:${userId}`);
          
          if (connectionCount <= 0) {
            // Remove from online set if no more connections
            await redisClient.sRem('online_users', userId);
            await redisClient.del(`user_connections:${userId}`); // Clean up
            io.emit('user_status', { userId: parseInt(userId), status: 'offline' });
          }
        } catch (err) {
          logger.error('Redis error on disconnect:', err);
        }
      } catch (err) {
        logger.error('Error on disconnect:', err);
      }
    });
  } catch (err) {
    logger.error('Error handling socket connection:', err);
  }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

module.exports = { app, httpServer, io };
