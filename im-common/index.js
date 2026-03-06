// 公共常量
exports.Constants = {
  // 消息类型
  MESSAGE_TYPE: {
    TEXT: 1,
    IMAGE: 2,
    FILE: 3,
    VOICE: 4,
    EMoji: 5
  },
  // 消息状态
  MESSAGE_STATUS: {
    SENDING: 0,
    SENT: 1,
    DELIVERED: 2,
    READ: 3
  },
  // 错误码
  ERROR_CODE: {
    SUCCESS: 0,
    PARAM_ERROR: 1001,
    USER_NOT_FOUND: 1002,
    SERVER_ERROR: 5000
  }
};

// 公共工具类
exports.Utils = {
  // 生成唯一ID
  generateId: function() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
  // 格式化时间
  formatTime: function(date) {
    return new Date(date).toLocaleString();
  }
};

// 响应工具
exports.Response = {
  success: function(data) {
    return {
      code: 0,
      message: 'success',
      data: data
    };
  },
  error: function(code, message) {
    return {
      code: code,
      message: message
    };
  }
};