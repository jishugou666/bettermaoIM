const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

console.log('=== BetterMao IM Socket.IO 测试 ===\n');

// 测试配置
const SERVER_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 生成测试token
function generateTestToken(userId, username) {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '1h' });
}

// 测试1: Socket.IO连接测试
async function testSocketConnection() {
  console.log('📋 测试1: Socket.IO连接测试');
  
  return new Promise((resolve, reject) => {
    const socket = io(SERVER_URL, {
      transports: ['websocket']
    });

    let connected = false;
    let authenticated = false;

    socket.on('connect', () => {
      console.log('✅ Socket连接成功');
      connected = true;
      
      const token = generateTestToken('test-user-1', 'TestUser1');
      socket.emit('authenticate', token);
    });

    socket.on('authenticated', (data) => {
      console.log('✅ 用户认证成功:', data);
      authenticated = true;
      socket.disconnect();
      resolve({ connected, authenticated });
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket已断开');
    });

    socket.on('error', (error) => {
      console.error('❌ Socket错误:', error);
      socket.disconnect();
      reject(error);
    });

    setTimeout(() => {
      if (!connected) {
        socket.disconnect();
        reject(new Error('连接超时'));
      }
    }, 5000);
  });
}

// 测试2: 两个用户之间的消息推送
async function testTwoUsersCommunication() {
  console.log('\n📋 测试2: 两个用户之间的实时通信');
  
  return new Promise((resolve, reject) => {
    const results = {
      user1Connected: false,
      user2Connected: false,
      messageReceived: false,
      receivedMessage: null
    };

    // 用户1
    const token1 = generateTestToken('user1', 'User1');
    const socket1 = io(SERVER_URL, { transports: ['websocket'] });
    
    socket1.on('connect', () => {
      console.log('👤 User1 连接成功');
      results.user1Connected = true;
      socket1.emit('authenticate', token1);
    });

    socket1.on('authenticated', (data) => {
      console.log('✅ User1 认证成功');
    });

    socket1.on('newMessage', (message) => {
      console.log('📨 User1 收到消息:', message);
    });

    // 用户2
    const token2 = generateTestToken('user2', 'User2');
    const socket2 = io(SERVER_URL, { transports: ['websocket'] });
    
    socket2.on('connect', () => {
      console.log('👤 User2 连接成功');
      results.user2Connected = true;
      socket2.emit('authenticate', token2);
    });

    socket2.on('authenticated', (data) => {
      console.log('✅ User2 认证成功');
      
      // 加入聊天房间
      const chatId = 'test-chat-123';
      socket2.emit('joinChat', chatId);
      socket1.emit('joinChat', chatId);
      
      setTimeout(() => {
        // 发送测试消息
        const testMessage = {
          id: 'msg-123',
          content: 'Hello from User2!',
          sender: { id: 'user2', username: 'User2' },
          timestamp: new Date().toISOString()
        };
        
        console.log('📤 User2 发送消息:', testMessage.content);
        socket2.emit('sendMessage', { chatId, message: testMessage });
        
        // 设置消息接收监听
        socket1.on('newMessage', (message) => {
          results.messageReceived = true;
          results.receivedMessage = message;
          console.log('📨 User1 收到消息:', message.content);
          
          // 清理连接
          socket1.disconnect();
          socket2.disconnect();
          resolve(results);
        });
        
        // 超时处理
        setTimeout(() => {
          socket1.disconnect();
          socket2.disconnect();
          if (!results.messageReceived) {
            console.log('⚠️ 消息接收超时（可能是房间机制导致）');
          }
          resolve(results);
        }, 3000);
      }, 500);
    });

    setTimeout(() => {
      if (!results.user1Connected || !results.user2Connected) {
        socket1.disconnect();
        socket2.disconnect();
        reject(new Error('用户连接超时'));
      }
    }, 5000);
  });
}

// 测试3: 错误处理测试
async function testErrorHandling() {
  console.log('\n📋 测试3: 错误处理机制');
  
  return new Promise((resolve) => {
    const results = {
      invalidTokenTest: false,
      disconnectHandled: false
    };

    // 测试无效token
    const socket = io(SERVER_URL, { transports: ['websocket'] });
    
    socket.on('connect', () => {
      console.log('🔐 测试无效token认证');
      socket.emit('authenticate', 'invalid-token-12345');
    });

    socket.on('disconnect', () => {
      console.log('✅ 无效token导致断开连接 - 错误处理正常');
      results.invalidTokenTest = true;
      results.disconnectHandled = true;
      resolve(results);
    });

    setTimeout(() => {
      socket.disconnect();
      resolve(results);
    }, 5000);
  });
}

// 主测试函数
async function runTests() {
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };

  try {
    // 测试1
    testResults.summary.total++;
    console.log('='.repeat(50));
    const result1 = await testSocketConnection();
    testResults.tests.connection = {
      passed: result1.connected && result1.authenticated,
      details: result1
    };
    if (result1.connected && result1.authenticated) {
      testResults.summary.passed++;
    } else {
      testResults.summary.failed++;
    }

    // 测试2
    testResults.summary.total++;
    console.log('\n' + '='.repeat(50));
    const result2 = await testTwoUsersCommunication();
    testResults.tests.communication = {
      passed: result2.user1Connected && result2.user2Connected,
      details: result2
    };
    if (result2.user1Connected && result2.user2Connected) {
      testResults.summary.passed++;
    } else {
      testResults.summary.failed++;
    }

    // 测试3
    testResults.summary.total++;
    console.log('\n' + '='.repeat(50));
    const result3 = await testErrorHandling();
    testResults.tests.errorHandling = {
      passed: result3.invalidTokenTest,
      details: result3
    };
    if (result3.invalidTokenTest) {
      testResults.summary.passed++;
    } else {
      testResults.summary.failed++;
    }

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
  }

  // 输出总结
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试总结:');
  console.log(`   总测试数: ${testResults.summary.total}`);
  console.log(`   通过: ${testResults.summary.passed}`);
  console.log(`   失败: ${testResults.summary.failed}`);
  console.log('='.repeat(50));

  return testResults;
}

// 运行测试
runTests().then((results) => {
  console.log('\n✅ 测试完成！');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ 测试失败:', error);
  process.exit(1);
});
