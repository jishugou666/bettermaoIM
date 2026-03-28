/**
 * 创建私聊会话API测试脚本
 * 测试目标：验证创建私聊会话功能的完整性和正确性
 */

const http = require('http');

// 测试配置
const BASE_URL = 'http://localhost:3000';
let authToken = '';
let testUserId = '';
let testUsername = '';
let testChatId = '';

// 辅助函数：发送HTTP请求
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : {}
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// 测试用例
const testCases = {
  // 1. 测试用户注册
  async testUserRegistration() {
    console.log('\n=== 测试1: 用户注册 ===');
    try {
      const timestamp = Date.now();
      testUsername = `testuser_${timestamp}`;
      const response = await makeRequest('POST', '/api/auth/register', {
        username: testUsername,
        password: 'Test123456',
        email: `test_${timestamp}@example.com`,
        nickname: '测试用户'
      });

      console.log('状态码:', response.statusCode);
      console.log('响应体:', JSON.stringify(response.body, null, 2));

      if (response.statusCode === 200 || response.statusCode === 201) {
        testUserId = response.body.user?._id || response.body.user?.id;
        console.log('✓ 用户注册成功');
        console.log('用户名:', testUsername);
        console.log('用户ID:', testUserId);
        return true;
      } else {
        console.log('✗ 用户注册失败:', response.body.error);
        return false;
      }
    } catch (error) {
      console.log('✗ 测试失败:', error.message);
      return false;
    }
  },

  // 2. 测试用户登录
  async testUserLogin() {
    console.log('\n=== 测试2: 用户登录 ===');
    try {
      if (!testUsername) {
        console.log('✗ 跳过测试：未获取到用户名');
        return false;
      }

      const response = await makeRequest('POST', '/api/auth/login', {
        identifier: testUsername,
        password: 'Test123456'
      });

      console.log('状态码:', response.statusCode);
      console.log('响应体:', JSON.stringify(response.body, null, 2));

      if (response.statusCode === 200) {
        authToken = response.body.token;
        testUserId = response.body.user?._id || response.body.user?.id;
        console.log('✓ 用户登录成功');
        console.log('Token:', authToken ? '已获取' : '未获取');
        return true;
      } else {
        console.log('✗ 用户登录失败:', response.body.error);
        return false;
      }
    } catch (error) {
      console.log('✗ 测试失败:', error.message);
      return false;
    }
  },

  // 3. 测试获取所有用户（开放性IM功能）
  async testGetAllUsers() {
    console.log('\n=== 测试3: 获取所有用户列表 ===');
    try {
      if (!authToken) {
        console.log('✗ 跳过测试：未获取到认证Token');
        return false;
      }

      const response = await makeRequest('GET', '/api/chats/users', null, authToken);

      console.log('状态码:', response.statusCode);
      console.log('响应体:', JSON.stringify(response.body, null, 2));

      if (response.statusCode === 200) {
        const users = response.body.users || [];
        console.log(`✓ 获取用户列表成功，共 ${users.length} 个用户`);
        if (users.length > 0) {
          console.log('示例用户:', JSON.stringify(users[0], null, 2));
        }
        return true;
      } else {
        console.log('✗ 获取用户列表失败:', response.body.error);
        return false;
      }
    } catch (error) {
      console.log('✗ 测试失败:', error.message);
      return false;
    }
  },

  // 4. 测试创建私聊会话
  async testCreatePrivateChat() {
    console.log('\n=== 测试4: 创建私聊会话 ===');
    try {
      if (!authToken) {
        console.log('✗ 跳过测试：未获取到认证Token');
        return false;
      }

      // 先获取用户列表
      const usersResponse = await makeRequest('GET', '/api/chats/users', null, authToken);
      if (usersResponse.statusCode !== 200 || !usersResponse.body.users || usersResponse.body.users.length === 0) {
        console.log('✗ 无法获取其他用户，跳过创建私聊测试');
        return false;
      }

      const otherUser = usersResponse.body.users[0];
      console.log('目标用户ID:', otherUser.id);

      const response = await makeRequest('POST', '/api/chats', {
        type: 'private',
        memberIds: [otherUser.id]
      }, authToken);

      console.log('状态码:', response.statusCode);
      console.log('响应体:', JSON.stringify(response.body, null, 2));

      if (response.statusCode === 200 || response.statusCode === 201) {
        testChatId = response.body.chatId;
        console.log('✓ 创建私聊会话成功');
        console.log('会话ID:', testChatId);
        return true;
      } else {
        console.log('✗ 创建私聊会话失败:', response.body.error);
        return false;
      }
    } catch (error) {
      console.log('✗ 测试失败:', error.message);
      return false;
    }
  },

  // 5. 测试获取聊天列表
  async testGetChats() {
    console.log('\n=== 测试5: 获取聊天列表 ===');
    try {
      if (!authToken) {
        console.log('✗ 跳过测试：未获取到认证Token');
        return false;
      }

      const response = await makeRequest('GET', '/api/chats', null, authToken);

      console.log('状态码:', response.statusCode);
      console.log('响应体:', JSON.stringify(response.body, null, 2));

      if (response.statusCode === 200) {
        const chats = response.body.chats || [];
        console.log(`✓ 获取聊天列表成功，共 ${chats.length} 个会话`);
        if (chats.length > 0) {
          console.log('示例会话:', JSON.stringify(chats[0], null, 2));
        }
        return true;
      } else {
        console.log('✗ 获取聊天列表失败:', response.body.error);
        return false;
      }
    } catch (error) {
      console.log('✗ 测试失败:', error.message);
      return false;
    }
  },

  // 6. 测试发送消息
  async testSendMessage() {
    console.log('\n=== 测试6: 发送消息 ===');
    try {
      if (!authToken || !testChatId) {
        console.log('✗ 跳过测试：未获取到认证Token或会话ID');
        return false;
      }

      const response = await makeRequest('POST', `/api/chats/${testChatId}/messages`, {
        content: '这是一条测试消息',
        type: 'text'
      }, authToken);

      console.log('状态码:', response.statusCode);
      console.log('响应体:', JSON.stringify(response.body, null, 2));

      if (response.statusCode === 200 || response.statusCode === 201) {
        console.log('✓ 发送消息成功');
        return true;
      } else {
        console.log('✗ 发送消息失败:', response.body.error);
        return false;
      }
    } catch (error) {
      console.log('✗ 测试失败:', error.message);
      return false;
    }
  },

  // 7. 测试获取消息列表
  async testGetMessages() {
    console.log('\n=== 测试7: 获取消息列表 ===');
    try {
      if (!authToken || !testChatId) {
        console.log('✗ 跳过测试：未获取到认证Token或会话ID');
        return false;
      }

      const response = await makeRequest('GET', `/api/chats/${testChatId}/messages`, null, authToken);

      console.log('状态码:', response.statusCode);
      console.log('响应体:', JSON.stringify(response.body, null, 2));

      if (response.statusCode === 200) {
        const messages = response.body.messages || [];
        console.log(`✓ 获取消息列表成功，共 ${messages.length} 条消息`);
        if (messages.length > 0) {
          console.log('示例消息:', JSON.stringify(messages[0], null, 2));
        }
        return true;
      } else {
        console.log('✗ 获取消息列表失败:', response.body.error);
        return false;
      }
    } catch (error) {
      console.log('✗ 测试失败:', error.message);
      return false;
    }
  },

  // 8. 测试边界条件：无效的会话类型
  async testInvalidChatType() {
    console.log('\n=== 测试8: 边界条件 - 无效的会话类型 ===');
    try {
      if (!authToken) {
        console.log('✗ 跳过测试：未获取到认证Token');
        return false;
      }

      const response = await makeRequest('POST', '/api/chats', {
        type: 'invalid_type',
        memberIds: ['user123']
      }, authToken);

      console.log('状态码:', response.statusCode);
      console.log('响应体:', JSON.stringify(response.body, null, 2));

      if (response.statusCode === 400) {
        console.log('✓ 正确处理无效会话类型');
        return true;
      } else {
        console.log('✗ 未正确处理无效会话类型');
        return false;
      }
    } catch (error) {
      console.log('✗ 测试失败:', error.message);
      return false;
    }
  },

  // 9. 测试边界条件：缺少必要参数
  async testMissingParameters() {
    console.log('\n=== 测试9: 边界条件 - 缺少必要参数 ===');
    try {
      if (!authToken) {
        console.log('✗ 跳过测试：未获取到认证Token');
        return false;
      }

      const response = await makeRequest('POST', '/api/chats', {
        type: 'private'
        // 缺少 memberIds
      }, authToken);

      console.log('状态码:', response.statusCode);
      console.log('响应体:', JSON.stringify(response.body, null, 2));

      if (response.statusCode === 400 || response.statusCode === 500) {
        console.log('✓ 正确处理缺少参数的情况');
        return true;
      } else {
        console.log('✗ 未正确处理缺少参数的情况');
        return false;
      }
    } catch (error) {
      console.log('✗ 测试失败:', error.message);
      return false;
    }
  },

  // 10. 测试未认证访问
  async testUnauthorizedAccess() {
    console.log('\n=== 测试10: 安全测试 - 未认证访问 ===');
    try {
      const response = await makeRequest('GET', '/api/chats');

      console.log('状态码:', response.statusCode);
      console.log('响应体:', JSON.stringify(response.body, null, 2));

      if (response.statusCode === 401 || response.statusCode === 403) {
        console.log('✓ 正确拒绝未认证访问');
        return true;
      } else {
        console.log('✗ 未正确拒绝未认证访问');
        return false;
      }
    } catch (error) {
      console.log('✗ 测试失败:', error.message);
      return false;
    }
  }
};

// 执行所有测试
async function runAllTests() {
  console.log('========================================');
  console.log('BetterMao IM - 创建私聊会话API测试');
  console.log('========================================');
  console.log('测试时间:', new Date().toLocaleString());
  console.log('服务器地址:', BASE_URL);

  const results = [];

  // 执行测试
  results.push(['用户注册', await testCases.testUserRegistration()]);
  results.push(['用户登录', await testCases.testUserLogin()]);
  results.push(['获取所有用户', await testCases.testGetAllUsers()]);
  results.push(['创建私聊会话', await testCases.testCreatePrivateChat()]);
  results.push(['获取聊天列表', await testCases.testGetChats()]);
  results.push(['发送消息', await testCases.testSendMessage()]);
  results.push(['获取消息列表', await testCases.testGetMessages()]);
  results.push(['边界条件-无效类型', await testCases.testInvalidChatType()]);
  results.push(['边界条件-缺少参数', await testCases.testMissingParameters()]);
  results.push(['安全测试-未认证访问', await testCases.testUnauthorizedAccess()]);

  // 输出测试报告
  console.log('\n========================================');
  console.log('测试报告');
  console.log('========================================');

  let passed = 0;
  let failed = 0;

  results.forEach(([name, result]) => {
    const status = result ? '通过' : '失败';
    const symbol = result ? '✓' : '✗';
    console.log(`${symbol} ${name}: ${status}`);
    if (result) passed++;
    else failed++;
  });

  console.log('----------------------------------------');
  console.log(`总计: ${results.length} 个测试`);
  console.log(`通过: ${passed} 个`);
  console.log(`失败: ${failed} 个`);
  console.log(`通过率: ${((passed / results.length) * 100).toFixed(2)}%`);
  console.log('========================================');

  // 返回测试结果
  return {
    total: results.length,
    passed: passed,
    failed: failed,
    successRate: (passed / results.length) * 100
  };
}

// 运行测试
runAllTests()
  .then(result => {
    console.log('\n测试完成！');
    process.exit(result.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('\n测试执行出错:', error);
    process.exit(1);
  });
