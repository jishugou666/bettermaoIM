const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/test', (req, res) => {
  console.log('请求体:', req.body);
  console.log('Content-Type:', req.headers['content-type']);
  res.json({ received: req.body });
});

app.listen(9999, () => {
  console.log('测试服务器运行在端口 9999');
  
  // 发送测试请求
  const http = require('http');
  
  const data = JSON.stringify({
    username: 'testuser',
    email: 'test@example.com',
    password: 'test123456'
  });
  
  const options = {
    hostname: 'localhost',
    port: 9999,
    path: '/test',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  
  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      console.log('响应:', body);
      process.exit(0);
    });
  });
  
  req.on('error', (error) => {
    console.error('错误:', error);
    process.exit(1);
  });
  
  req.write(data);
  req.end();
});
