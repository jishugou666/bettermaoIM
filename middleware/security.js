const Joi = require('joi');

// 参数验证中间件
function validateParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: error.details[0].message,
          status: 400
        }
      });
    }
    req.body = value;
    next();
  };
}

// 敏感信息过滤中间件
function filterSensitiveInfo(req, res, next) {
  // 过滤请求体中的敏感信息
  if (req.body) {
    if (req.body.password) {
      req.body.password = '***';
    }
    if (req.body.token) {
      req.body.token = '***';
    }
    if (req.body.cardNumber) {
      req.body.cardNumber = '***';
    }
    if (req.body.phone) {
      req.body.phone = '***';
    }
  }

  // 过滤响应中的敏感信息
  const originalJson = res.json;
  res.json = function(data) {
    if (data && typeof data === 'object') {
      if (data.user && data.user.password) {
        data.user.password = '***';
      }
      if (data.token) {
        data.token = '***';
      }
    }
    return originalJson.call(this, data);
  };

  next();
}

// 防止SQL注入的参数化查询辅助函数
function escapeSqlParam(param) {
  if (typeof param === 'string') {
    return param.replace(/'/g, "''");
  }
  return param;
}

module.exports = {
  validateParams,
  filterSensitiveInfo,
  escapeSqlParam
};