const http = require('http');

// 直接测试主应用的注册接口
async function testRegister() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: 'testuser3',
      email: 'testuser3@example.com',
      password: 'test123456'
    });
    
    console.log('发送注册请求...');
    console.log('请求体:', postData);
    
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
      console.log('状态码:', res.statusCode);
      console.log('响应头:', JSON.stringify(res.headers, null, 2));
      
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
        console.log('接收到数据块:', chunk);
      });
      res.on('end', () => {
        console.log('完整响应体:', body);
        try {
          const parsed = JSON.parse(body);
          console.log('解析后的响应:', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('响应不是JSON格式');
        }
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

testRegister().then(() => {
  console.log('\n测试完成');
  process.exit(0);
});
