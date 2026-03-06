const io = require('socket.io-client');

class IMClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.socket = null;
    this.eventListeners = {};
  }

  // 连接到IM服务器
  connect() {
    return new Promise((resolve, reject) => {
      this.socket = io(this.url, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        ...this.options
      });

      this.socket.on('connect', () => {
        console.log('Connected to IM server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      // 监听消息
      this.socket.on('message', (data) => {
        this.emit('message', data);
      });

      // 监听断开连接
      this.socket.on('disconnect', () => {
        console.log('Disconnected from IM server');
        this.emit('disconnect');
      });
    });
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // 发送消息
  sendMessage(message) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('sendMessage', message);
      return true;
    }
    return false;
  }

  // 登录
  login(userId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('login', { userId });
      return true;
    }
    return false;
  }

  // 注册事件监听器
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  // 触发事件
  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        callback(data);
      });
    }
  }

  // 移除事件监听器
  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }
}

module.exports = IMClient;