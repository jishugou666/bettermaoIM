const winston = require('winston');

// 请求日志中间件
function loggerMiddleware(req, res, next) {
  const start = Date.now();
  const { method, url, ip, headers } = req;

  // 过滤敏感信息
  const safeHeaders = {
    ...headers,
    authorization: headers.authorization ? '***' : undefined,
    'x-api-key': headers['x-api-key'] ? '***' : undefined
  };

  // 记录请求开始
  winston.info('Request started:', {
    method,
    url,
    ip,
    headers: safeHeaders
  });

  // 监听响应结束
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode, statusMessage } = res;

    // 记录请求结束
    winston.info('Request finished:', {
      method,
      url,
      statusCode,
      statusMessage,
      duration: `${duration}ms`,
      ip
    });
  });

  next();
}

module.exports = loggerMiddleware;