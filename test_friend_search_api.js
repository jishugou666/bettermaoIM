const http = require('http');

// 测试配置
const BASE_URL = 'http://localhost:3000';
let testToken = '';
let testUserId = '';

// 辅助函数：发送HTTP请求
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// 测试用例
const testCases = {
  // 测试1：用户登录获取token
  async testLogin() {
    console.log('\n=== 测试1：用户登录 ===');
    try {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const result = await makeRequest(options, {
        identifier: 'testuser99',
        password: 'test123456'
      });
      
      console.log('状态码:', result.statusCode);
      console.log('响应体:', JSON.stringify(result.body, null, 2));
      
      if (result.statusCode === 200 && result.body && result.body.token) {
        testToken = result.body.token;
        testUserId = result.body.user ? result.body.user._id : '';
        console.log('✓ 登录成功，获取到token');
        return { success: true, message: '登录成功' };
      } else if (result.statusCode === 401) {
        console.log('✗ 登录失败：用户名或密码错误');
        return { success: false, message: '登录失败：用户名或密码错误' };
      } else {
        console.log('✗ 登录失败：未获取到token');
        return { success: false, message: '登录失败：未获取到token' };
      }
    } catch (error) {
      console.log('✗ 登录异常:', error.message);
      return { success: false, message: '登录异常: ' + error.message };
    }
  },

  // 测试2：搜索用户 - 正常流程
  async testSearchUsersNormal() {
    console.log('\n=== 测试2：搜索用户（正常流程）===');
    if (!testToken) {
      console.log('⊘ 跳过测试：未获取到token');
      return { success: false, message: '跳过测试：未获取到token' };
    }
    
    try {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/users/search?keyword=test',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        }
      };
      
      const result = await makeRequest(options);
      console.log('状态码:', result.statusCode);
      console.log('响应体:', JSON.stringify(result.body, null, 2));
      
      if (result.statusCode === 200) {
        console.log('✓ 搜索用户成功');
        return { success: true, message: '搜索用户成功', data: result.body };
      } else {
        console.log('✗ 搜索用户失败');
        return { success: false, message: '搜索用户失败', data: result.body };
      }
    } catch (error) {
      console.log('✗ 搜索用户异常:', error.message);
      return { success: false, message: '搜索用户异常: ' + error.message };
    }
  },

  // 测试3：搜索用户 - 空关键词
  async testSearchUsersEmptyKeyword() {
    console.log('\n=== 测试3：搜索用户（空关键词）===');
    if (!testToken) {
      console.log('⊘ 跳过测试：未获取到token');
      return { success: false, message: '跳过测试：未获取到token' };
    }
    
    try {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/users/search?keyword=',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        }
      };
      
      const result = await makeRequest(options);
      console.log('状态码:', result.statusCode);
      console.log('响应体:', JSON.stringify(result.body, null, 2));
      
      if (result.statusCode === 400) {
        console.log('✓ 正确返回400错误');
        return { success: true, message: '正确返回400错误' };
      } else {
        console.log('✗ 未正确处理空关键词');
        return { success: false, message: '未正确处理空关键词' };
      }
    } catch (error) {
      console.log('✗ 测试异常:', error.message);
      return { success: false, message: '测试异常: ' + error.message };
    }
  },

  // 测试4：搜索用户 - 无认证token
  async testSearchUsersNoAuth() {
    console.log('\n=== 测试4：搜索用户（无认证token）===');
    
    try {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/users/search?keyword=test',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const result = await makeRequest(options);
      console.log('状态码:', result.statusCode);
      console.log('响应体:', JSON.stringify(result.body, null, 2));
      
      if (result.statusCode === 401) {
        console.log('✓ 正确返回401未授权错误');
        return { success: true, message: '正确返回401未授权错误' };
      } else {
        console.log('✗ 未正确处理无认证请求');
        return { success: false, message: '未正确处理无认证请求' };
      }
    } catch (error) {
      console.log('✗ 测试异常:', error.message);
      return { success: false, message: '测试异常: ' + error.message };
    }
  },

  // 测试5：搜索用户 - 无效token
  async testSearchUsersInvalidToken() {
    console.log('\n=== 测试5：搜索用户（无效token）===');
    
    try {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/users/search?keyword=test',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid_token_here'
        }
      };
      
      const result = await makeRequest(options);
      console.log('状态码:', result.statusCode);
      console.log('响应体:', JSON.stringify(result.body, null, 2));
      
      if (result.statusCode === 401) {
        console.log('✓ 正确返回401无效token错误');
        return { success: true, message: '正确返回401无效token错误' };
      } else {
        console.log('✗ 未正确处理无效token');
        return { success: false, message: '未正确处理无效token' };
      }
    } catch (error) {
      console.log('✗ 测试异常:', error.message);
      return { success: false, message: '测试异常: ' + error.message };
    }
  },

  // 测试6：获取好友列表
  async testGetFriends() {
    console.log('\n=== 测试6：获取好友列表 ===');
    if (!testToken) {
      console.log('⊘ 跳过测试：未获取到token');
      return { success: false, message: '跳过测试：未获取到token' };
    }
    
    try {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/friends',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        }
      };
      
      const result = await makeRequest(options);
      console.log('状态码:', result.statusCode);
      console.log('响应体:', JSON.stringify(result.body, null, 2));
      
      if (result.statusCode === 200) {
        console.log('✓ 获取好友列表成功');
        return { success: true, message: '获取好友列表成功', data: result.body };
      } else {
        console.log('✗ 获取好友列表失败');
        return { success: false, message: '获取好友列表失败', data: result.body };
      }
    } catch (error) {
      console.log('✗ 测试异常:', error.message);
      return { success: false, message: '测试异常: ' + error.message };
    }
  },

  // 测试7：获取好友请求列表
  async testGetFriendRequests() {
    console.log('\n=== 测试7：获取好友请求列表 ===');
    if (!testToken) {
      console.log('⊘ 跳过测试：未获取到token');
      return { success: false, message: '跳过测试：未获取到token' };
    }
    
    try {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/friends/requests',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        }
      };
      
      const result = await makeRequest(options);
      console.log('状态码:', result.statusCode);
      console.log('响应体:', JSON.stringify(result.body, null, 2));
      
      if (result.statusCode === 200) {
        console.log('✓ 获取好友请求列表成功');
        return { success: true, message: '获取好友请求列表成功', data: result.body };
      } else {
        console.log('✗ 获取好友请求列表失败');
        return { success: false, message: '获取好友请求列表失败', data: result.body };
      }
    } catch (error) {
      console.log('✗ 测试异常:', error.message);
      return { success: false, message: '测试异常: ' + error.message };
    }
  },

  // 测试8：搜索用户 - 特殊字符
  async testSearchUsersSpecialChars() {
    console.log('\n=== 测试8：搜索用户（特殊字符）===');
    if (!testToken) {
      console.log('⊘ 跳过测试：未获取到token');
      return { success: false, message: '跳过测试：未获取到token' };
    }
    
    try {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/users/search?keyword=' + encodeURIComponent('<script>alert("xss")</script>'),
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        }
      };
      
      const result = await makeRequest(options);
      console.log('状态码:', result.statusCode);
      console.log('响应体:', JSON.stringify(result.body, null, 2));
      
      if (result.statusCode === 200) {
        console.log('✓ 正确处理特殊字符');
        return { success: true, message: '正确处理特殊字符' };
      } else {
        console.log('✗ 未正确处理特殊字符');
        return { success: false, message: '未正确处理特殊字符' };
      }
    } catch (error) {
      console.log('✗ 测试异常:', error.message);
      return { success: false, message: '测试异常: ' + error.message };
    }
  },

  // 测试9：搜索用户 - SQL注入测试
  async testSearchUsersSQLInjection() {
    console.log('\n=== 测试9：搜索用户（SQL注入测试）===');
    if (!testToken) {
      console.log('⊘ 跳过测试：未获取到token');
      return { success: false, message: '跳过测试：未获取到token' };
    }
    
    try {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/users/search?keyword=' + encodeURIComponent("'; DROP TABLE users; --"),
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        }
      };
      
      const result = await makeRequest(options);
      console.log('状态码:', result.statusCode);
      console.log('响应体:', JSON.stringify(result.body, null, 2));
      
      if (result.statusCode === 200 || result.statusCode === 400) {
        console.log('✓ 正确处理SQL注入尝试');
        return { success: true, message: '正确处理SQL注入尝试' };
      } else {
        console.log('✗ 可能存在SQL注入漏洞');
        return { success: false, message: '可能存在SQL注入漏洞' };
      }
    } catch (error) {
      console.log('✗ 测试异常:', error.message);
      return { success: false, message: '测试异常: ' + error.message };
    }
  },

  // 测试10：搜索用户 - 超长关键词
  async testSearchUsersLongKeyword() {
    console.log('\n=== 测试10：搜索用户（超长关键词）===');
    if (!testToken) {
      console.log('⊘ 跳过测试：未获取到token');
      return { success: false, message: '跳过测试：未获取到token' };
    }
    
    try {
      const longKeyword = 'a'.repeat(10000);
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/users/search?keyword=' + encodeURIComponent(longKeyword),
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        }
      };
      
      const result = await makeRequest(options);
      console.log('状态码:', result.statusCode);
      console.log('响应体:', JSON.stringify(result.body, null, 2));
      
      if (result.statusCode === 200 || result.statusCode === 400) {
        console.log('✓ 正确处理超长关键词');
        return { success: true, message: '正确处理超长关键词' };
      } else {
        console.log('✗ 未正确处理超长关键词');
        return { success: false, message: '未正确处理超长关键词' };
      }
    } catch (error) {
      console.log('✗ 测试异常:', error.message);
      return { success: false, message: '测试异常: ' + error.message };
    }
  }
};

// 运行所有测试
async function runAllTests() {
  console.log('========================================');
  console.log('  BetterMao IM 好友搜索API测试报告');
  console.log('========================================');
  console.log('测试时间:', new Date().toLocaleString('zh-CN'));
  console.log('测试服务器:', BASE_URL);
  
  const results = [];
  
  // 执行测试
  results.push(await testCases.testLogin());
  results.push(await testCases.testSearchUsersNormal());
  results.push(await testCases.testSearchUsersEmptyKeyword());
  results.push(await testCases.testSearchUsersNoAuth());
  results.push(await testCases.testSearchUsersInvalidToken());
  results.push(await testCases.testGetFriends());
  results.push(await testCases.testGetFriendRequests());
  results.push(await testCases.testSearchUsersSpecialChars());
  results.push(await testCases.testSearchUsersSQLInjection());
  results.push(await testCases.testSearchUsersLongKeyword());
  
  // 统计结果
  console.log('\n========================================');
  console.log('  测试结果汇总');
  console.log('========================================');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`总计: ${results.length} 个测试`);
  console.log(`通过: ${passed} 个`);
  console.log(`失败: ${failed} 个`);
  console.log(`通过率: ${((passed / results.length) * 100).toFixed(2)}%`);
  
  console.log('\n详细结果:');
  results.forEach((result, index) => {
    const status = result.success ? '✓ PASS' : '✗ FAIL';
    console.log(`测试${index + 1}: ${status} - ${result.message}`);
  });
  
  console.log('\n========================================');
  console.log('  测试完成');
  console.log('========================================\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
