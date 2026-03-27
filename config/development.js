// 开发环境配置
module.exports = {
  server: {
    env: 'development',
    port: process.env.PORT || 3000
  },
  
  logger: {
    level: 'debug'
  },
  
  database: {
    path: './db/bettermao.dev.db'
  }
};