// 简单的API测试
const http = require('http');

const testAPI = () => {
  // 测试健康检查
  const healthReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/health',
    method: 'GET'
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('健康检查:', res.statusCode, data);
    });
  });
  healthReq.on('error', e => console.error('健康检查失败:', e.message));
  healthReq.end();
};

testAPI();
