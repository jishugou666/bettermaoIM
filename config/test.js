// 测试环境配置
module.exports = {
  server: {
    env: 'test',
    port: process.env.PORT || 3001
  },
  
  logger: {
    level: 'error'
  },
  
  database: {
    path: './db/bettermao.test.db'
  },
  
  jwt: {
    secret: 'test-secret-key'
  }
};