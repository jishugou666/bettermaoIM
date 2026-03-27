// 生产环境配置
module.exports = {
  server: {
    env: 'production',
    port: process.env.PORT || 3000
  },
  
  logger: {
    level: 'info'
  },
  
  database: {
    path: './db/bettermao.prod.db'
  },
  
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000'
  }
};