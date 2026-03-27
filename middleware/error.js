const winston = require('winston');

// 全局错误处理中间件
function errorHandler(err, req, res, next) {
  // 日志记录
  winston.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // 错误响应
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = errorHandler;