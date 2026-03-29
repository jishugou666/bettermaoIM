// 默认配置
module.exports = {
  // 服务器配置
  server: {
    port: 3000,
    host: '0.0.0.0',
    env: 'development'
  },
  
  // 数据库配置
  database: {
    path: './db/bettermao.db',
    backupPath: './db/backups',
    // MySQL 配置
    mysql: {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'bettermao',
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0
    }
  },
  
  // JWT配置
  jwt: {
    secret: 'your-secret-key-change-in-production',
    expiresIn: '24h'
  },
  
  // CORS配置
  cors: {
    origin: 'http://localhost:5173'
  },
  
  // 日志配置
  logger: {
    level: 'info',
    file: './logs/app.log'
  },
  
  // 速率限制配置
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 每IP限制100请求
  },
  
  // 文件上传配置
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    directory: './uploads'
  }
};