const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// 配置中间件 - 与主应用相同
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 测试路由
app.post('/api/auth/register', (req, res) => {
  console.log('=== 收到注册请求 ===');
  console.log('请求头:', req.headers);
  console.log('请求体类型:', typeof req.body);
  console.log('请求体:', req.body);
  console.log('username:', req.body.username);
  console.log('email:', req.body.email);
  console.log('password:', req.body.password);
  
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    console.log('验证失败：缺少字段');
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  console.log('验证成功');
  res.status(201).json({ user: { username, email } });
});

const server = app.listen(9999, () => {
  console.log('测试服务器运行在端口 9999');
  
  // 发送测试请求
  const testClient = http.request({
    hostname: 'localhost',
    port: 9999,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      console.log('\n=== 客户端收到响应 ===');
      console.log('状态码:', res.statusCode);
      console.log('响应体:', body);
      process.exit(0);
    });
  });
  
  testClient.on('error', (e) => {
    console.error('客户端错误:', e);
    process.exit(1);
  });
  
  const data = JSON.stringify({
    username: 'testuser',
    email: 'test@example.com',
    password: 'test123456'
  });
  
  console.log('\n=== 发送测试请求 ===');
  console.log('请求体:', data);
  testClient.write(data);
  testClient.end();
});
