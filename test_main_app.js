const http = require('http');

// 测试主应用的注册接口，添加调试信息
async function testMainApp() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: 'testuser99',
      email: 'testuser99@example.com',
      password: 'test123456'
    });
    
    console.log('=== 测试主应用注册接口 ===');
    console.log('请求URL: http://localhost:3000/api/auth/register');
    console.log('请求方法: POST');
    console.log('请求体:', postData);
    console.log('Content-Length:', Buffer.byteLength(postData));
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      console.log('\n=== 收到响应 ===');
      console.log('状态码:', res.statusCode);
      
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        console.log('响应体:', body);
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.error('请求错误:', e.message);
      resolve();
    });
    
    req.write(postData);
    req.end();
  });
}

// 测试健康检查
async function testHealth() {
  return new Promise((resolve, reject) => {
    console.log('\n=== 测试健康检查 ===');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log('健康检查状态码:', res.statusCode);
        console.log('健康检查响应:', body);
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.error('健康检查错误:', e.message);
      resolve();
    });
    
    req.end();
  });
}

async function runTests() {
  await testHealth();
  await testMainApp();
  console.log('\n测试完成');
  process.exit(0);
}

runTests();
