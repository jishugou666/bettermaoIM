const http = require('http');

// 测试注册和登录
async function test() {
  console.log('=== 测试注册 ===');
  
  // 测试注册
  const registerData = JSON.stringify({
    username: 'testuser2',
    email: 'testuser2@example.com',
    password: 'test123456'
  });
  
  console.log('注册数据:', registerData);
  
  const registerOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(registerData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(registerOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log('注册状态码:', res.statusCode);
        console.log('注册响应:', body);
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('注册错误:', error);
      resolve();
    });
    
    req.write(registerData);
    req.end();
  });
}

test().then(() => {
  console.log('\n=== 测试登录 ===');
  
  // 测试登录
  const loginData = JSON.stringify({
    identifier: 'testuser',
    password: 'test123456'
  });
  
  console.log('登录数据:', loginData);
  
  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(loginOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log('登录状态码:', res.statusCode);
        console.log('登录响应:', body);
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('登录错误:', error);
      resolve();
    });
    
    req.write(loginData);
    req.end();
  });
}).then(() => {
  console.log('\n测试完成');
  process.exit(0);
});
