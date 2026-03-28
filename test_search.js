// 测试搜索用户API
const https = require('https');
const http = require('http');

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

const testSearch = async () => {
  try {
    // 首先登录获取token
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    
    const loginData = JSON.stringify({ username: 'testuser', password: 'test123456' });
    const loginResponse = await makeRequest(loginOptions, loginData);
    
    console.log('登录响应:', loginResponse);
    
    if (loginResponse.status !== 200) {
      console.error('登录失败:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('Token:', token);

    // 测试搜索用户API
    const searchOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/users/search?keyword=test',
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    const searchResponse = await makeRequest(searchOptions);
    console.log('搜索API状态码:', searchResponse.status);
    console.log('搜索结果:', searchResponse.data);
  } catch (error) {
    console.error('测试失败:', error.message);
  }
};

testSearch();
