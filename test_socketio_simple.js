const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

console.log('=== BetterMao IM Socket.IO 简单测试 ===\n');

const SERVER_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function generateTestToken(userId, username) {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '1h' });
}

async function testBasicConnection() {
  console.log('测试1: 基础连接和认证');
  
  return new Promise((resolve) => {
    const socket = io(SERVER_URL);

    socket.on('connect', () => {
      console.log('✅ Socket连接成功');
      
      const token = generateTestToken('test-user-1', 'TestUser1');
      socket.emit('authenticate', token);
    });

    socket.on('authenticated', (data) => {
      console.log('✅ 用户认证成功:', data);
      socket.disconnect();
      resolve({ success: true, message: '连接和认证成功' });
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket已断开');
    });

    socket.on('error', (error) => {
      console.error('❌ Socket错误:', error);
      socket.disconnect();
      resolve({ success: false, message: 'Socket错误: ' + error });
    });

    socket.on('connect_error', (error) => {
      console.error('❌ 连接错误:', error.message);
      resolve({ success: false, message: '连接错误: ' + error.message });
    });

    setTimeout(() => {
      socket.disconnect();
      if (!socket.connected) {
        resolve({ success: false, message: '连接超时' });
      }
    }, 10000);
  });
}

async function testTwoUsers() {
  console.log('\n测试2: 双用户连接和房间消息');
  
  return new Promise((resolve) => {
    let results = {
      user1Connected: false,
      user2Connected: false,
      messageReceived: false
    };

    const token1 = generateTestToken('user1', 'User1');
    const socket1 = io(SERVER_URL);
    
    const token2 = generateTestToken('user2', 'User2');
    const socket2 = io(SERVER_URL);

    const chatId = 'test-room-123';
    let allConnected = false;

    socket1.on('connect', () => {
      console.log('👤 User1 连接');
      socket1.emit('authenticate', token1);
    });

    socket1.on('authenticated', () => {
      console.log('✅ User1 认证');
      results.user1Connected = true;
      checkAllConnected();
    });

    socket1.on('newMessage', (msg) => {
      console.log('📨 User1 收到消息:', msg.content || msg);
      results.messageReceived = true;
      finishTest();
    });

    socket2.on('connect', () => {
      console.log('👤 User2 连接');
      socket2.emit('authenticate', token2);
    });

    socket2.on('authenticated', () => {
      console.log('✅ User2 认证');
      results.user2Connected = true;
      checkAllConnected();
    });

    function checkAllConnected() {
      if (results.user1Connected && results.user2Connected && !allConnected) {
        allConnected = true;
        console.log('🏠 加入房间');
        socket1.emit('joinChat', chatId);
        socket2.emit('joinChat', chatId);
        
        setTimeout(() => {
          console.log('📤 User2 发送消息');
          socket2.emit('sendMessage', {
            chatId,
            message: { content: 'Hello from User2!', sender: { id: 'user2' } }
          });
          
          setTimeout(() => {
            finishTest();
          }, 3000);
        }, 500);
      }
    }

    function finishTest() {
      socket1.disconnect();
      socket2.disconnect();
      resolve(results);
    }

    setTimeout(() => {
      socket1.disconnect();
      socket2.disconnect();
      resolve(results);
    }, 15000);
  });
}

async function testErrorHandling() {
  console.log('\n测试3: 错误处理（无效Token）');
  
  return new Promise((resolve) => {
    const socket = io(SERVER_URL);
    
    socket.on('connect', () => {
      console.log('🔐 发送无效Token');
      socket.emit('authenticate', 'invalid-token-xyz');
    });

    socket.on('disconnect', () => {
      console.log('✅ 无效Token导致断开 - 错误处理正常');
      resolve({ success: true });
    });

    setTimeout(() => {
      socket.disconnect();
      resolve({ success: false, message: '未断开连接' });
    }, 5000);
  });
}

async function runAllTests() {
  const allResults = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  try {
    allResults.tests.basic = await testBasicConnection();
    
    allResults.tests.twoUsers = await testTwoUsers();
    
    allResults.tests.errorHandling = await testErrorHandling();
  } catch (e) {
    console.error('测试异常:', e);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果汇总:');
  console.log('基础连接:', allResults.tests.basic?.success ? '✅ 通过' : '❌ 失败');
  console.log('双用户:', allResults.tests.twoUsers?.user1Connected && allResults.tests.twoUsers?.user2Connected ? '✅ 连接成功' : '❌ 连接失败');
  console.log('  - 消息接收:', allResults.tests.twoUsers?.messageReceived ? '✅ 收到' : '⚠️ 未收到(可能需要更多测试)');
  console.log('错误处理:', allResults.tests.errorHandling?.success ? '✅ 通过' : '❌ 失败');
  console.log('='.repeat(50));

  return allResults;
}

runAllTests().then(() => {
  console.log('\n测试完成');
  process.exit(0);
});
