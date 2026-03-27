const config = require('config-lite');
const Joi = require('joi');

// 配置验证模式
const configSchema = Joi.object({
  server: Joi.object({
    port: Joi.number().integer().min(1).max(65535).required(),
    host: Joi.string().ip().required(),
    env: Joi.string().valid('development', 'test', 'production').required()
  }).required(),
  
  database: Joi.object({
    path: Joi.string().required(),
    backupPath: Joi.string().required()
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

module.exports = value;