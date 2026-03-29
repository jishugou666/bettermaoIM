const config = require('config-lite');
const Joi = require('joi');

// 检查config是否为函数
if (typeof config !== 'function') {
  console.error('config-lite 加载失败，使用默认配置');
  module.exports = {
    server: {
      port: process.env.PORT || 3000,
      host: '0.0.0.0',
      env: process.env.NODE_ENV || 'development'
    },
    database: {
      path: './db/bettermao.db',
      backupPath: './db/backups',
      mysql: {
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'bettermaoim',
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0
      }
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      expiresIn: '24h'
    },
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173'
    },
    logger: {
      level: 'info',
      file: './logs/app.log'
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100
    },
    upload: {
      maxSize: 10 * 1024 * 1024,
      directory: './uploads'
    }
  };
  return;
}

// 配置验证模式
const configSchema = Joi.object({
  server: Joi.object({
    port: Joi.number().integer().min(1).max(65535).required(),
    host: Joi.string().ip().required(),
    env: Joi.string().valid('development', 'test', 'production').required()
  }).required(),
  
  database: Joi.object({
    path: Joi.string().required(),
    backupPath: Joi.string().required(),
    mysql: Joi.object({
      host: Joi.string().required(),
      port: Joi.number().integer().min(1).max(65535).required(),
      user: Joi.string().required(),
      password: Joi.string().allow('').required(),
      database: Joi.string().required(),
      connectionLimit: Joi.number().integer().min(1).required(),
      waitForConnections: Joi.boolean().required(),
      queueLimit: Joi.number().integer().required()
    }).optional()
  }).required(),
  
  jwt: Joi.object({
    secret: Joi.string().min(8).required(),
    expiresIn: Joi.string().required()
  }).required(),
  
  cors: Joi.object({
    origin: Joi.string().required()
  }).required(),
  
  logger: Joi.object({
    level: Joi.string().valid('debug', 'info', 'warn', 'error').required(),
    file: Joi.string().required()
  }).required(),
  
  rateLimit: Joi.object({
    windowMs: Joi.number().integer().positive().required(),
    max: Joi.number().integer().positive().required()
  }).required(),
  
  upload: Joi.object({
    maxSize: Joi.number().integer().positive().required(),
    directory: Joi.string().required()
  }).required()
});

// 加载配置
const loadedConfig = config({
  config_basedir: __dirname,
  config_dir: __dirname
});

// 验证配置
const { error, value } = configSchema.validate(loadedConfig);
if (error) {
  console.error('配置验证失败:', error.message);
  process.exit(1);
}

// 合并环境变量覆盖
if (process.env.PORT) {
  value.server.port = parseInt(process.env.PORT, 10);
}

if (process.env.NODE_ENV) {
  value.server.env = process.env.NODE_ENV;
}

if (process.env.JWT_SECRET) {
  value.jwt.secret = process.env.JWT_SECRET;
}

if (process.env.FRONTEND_URL) {
  value.cors.origin = process.env.FRONTEND_URL;
}

// MySQL 环境变量覆盖
if (process.env.MYSQL_HOST) {
  value.database.mysql = value.database.mysql || {};
  value.database.mysql.host = process.env.MYSQL_HOST;
}
if (process.env.MYSQL_PORT) {
  value.database.mysql = value.database.mysql || {};
  value.database.mysql.port = parseInt(process.env.MYSQL_PORT, 10);
}
if (process.env.MYSQL_USER) {
  value.database.mysql = value.database.mysql || {};
  value.database.mysql.user = process.env.MYSQL_USER;
}
if (process.env.MYSQL_PASSWORD) {
  value.database.mysql = value.database.mysql || {};
  value.database.mysql.password = process.env.MYSQL_PASSWORD;
}
if (process.env.MYSQL_DATABASE) {
  value.database.mysql = value.database.mysql || {};
  value.database.mysql.database = process.env.MYSQL_DATABASE;
}

module.exports = value;