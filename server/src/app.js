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
const socketAuthMiddleware = require('./core/socketAuth');
const chatSocket = require('./socket/chat.socket');
const redisClient = require('./core/redis');

require('dotenv').config();

// Logger setup
const logger = winston.createLogger({
  level: 'info',
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
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

const path = require('path');

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow loading images from other origins (or same origin)
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

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

// Error handling
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ message: err.message || 'Something broke!' });
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
  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

module.exports = { app, httpServer, io };
