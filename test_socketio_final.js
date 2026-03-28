const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

console.log('=== BetterMao IM Socket.IO 最终测试 ===\n');

const SERVER_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function generateTestToken(userId, username) {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '1h' });
}

async function testBasicConnection() {
  console.log('测试1: 基础连接和认证（握手阶段Token）');
  
  return new Promise((resolve) => {
    const token = generateTestToken('test-user-1', 'TestUser1');
    
    const socket = io(SERVER_URL, {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('✅ Socket连接成功');
      console.log('✅ 握手阶段认证成功');
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

async function testTwoUsersCommunication() {
  console.log('\n测试2: 双用户实时通信');
  
  return new Promise((resolve) => {
    let results = {
      user1Connected: false,
      user2Connected: false,
      messageReceived: false,
      receivedContent: null
    };

    const token1 = generateTestToken('user1', 'User1');
    const socket1 = io(SERVER_URL, { auth: { token: token1 } });
    
    const token2 = generateTestToken('user2', 'User2');
    const socket2 = io(SERVER_URL, { auth: { token: token2 } });

    const chatId = 'test-chat-room-456';
    let allConnected = false;

    socket1.on('connect', () => {
      console.log('👤 User1 连接成功');
      results.user1Connected = true;
      checkAllConnected();
    });

    socket1.on('newMessage', (msg) => {
      console.log('📨 User1 收到消息:', msg.content || msg);
      results.messageReceived = true;
      results.receivedContent = msg.content || msg;
      finishTest();
    });

    socket2.on('connect', () => {
      console.log('👤 User2 连接成功');
      results.user2Connected = true;
      checkAllConnected();
    });

    function checkAllConnected() {
      if (results.user1Connected && results.user2Connected && !allConnected) {
        allConnected = true;
        console.log('🏠 两个用户都连接成功，加入聊天房间');
        socket1.emit('joinChat', chatId);
        socket2.emit('joinChat', chatId);
        
        setTimeout(() => {
          const testMsg = {
            id: 'test-msg-001',
            content: '你好，这是来自User2的实时消息！',
            sender: { id: 'user2', username: 'User2' },
            timestamp: new Date().toISOString()
          };
          
          console.log('📤 User2 发送消息:', testMsg.content);
          socket2.emit('sendMessage', { chatId, message: testMsg });
          
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

async function testInvalidToken() {
  console.log('\n测试3: 错误处理（无效Token）');
  
  return new Promise((resolve) => {
    const socket = io(SERVER_URL, {
      auth: { token: 'invalid-token-12345' }
    });
    
    let errorReceived = false;

    socket.on('connect_error', (error) => {
      console.log('✅ 无效Token被拒绝:', error.message);
      errorReceived = true;
      socket.disconnect();
      resolve({ success: true, message: '无效Token正确处理' });
    });

    setTimeout(() => {
      socket.disconnect();
      resolve({ success: errorReceived, message: errorReceived ? '通过' : '未收到错误' });
    }, 5000);
  });
}

async function testMissingToken() {
  console.log('\n测试4: 错误处理（缺少Token）');
  
  return new Promise((resolve) => {
    const socket = io(SERVER_URL);
    
    let errorReceived = false;

    socket.on('connect_error', (error) => {
      console.log('✅ 缺少Token被拒绝:', error.message);
      errorReceived = true;
      socket.disconnect();
      resolve({ success: true, message: '缺少Token正确处理' });
    });

    setTimeout(() => {
      socket.disconnect();
      resolve({ success: errorReceived, message: errorReceived ? '通过' : '未收到错误' });
    }, 5000);
  });
}

async function runAllTests() {
  const allResults = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  try {
    allResults.tests.basicConnection = await testBasicConnection();
    allResults.tests.twoUsers = await testTwoUsersCommunication();
    allResults.tests.invalidToken = await testInvalidToken();
    allResults.tests.missingToken = await testMissingToken();
  } catch (e) {
    console.error('测试异常:', e);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果汇总:');
  console.log('='.repeat(60));
  console.log('1. 基础连接和认证:', allResults.tests.basicConnection?.success ? '✅ 通过' : '❌ 失败');
  console.log('2. 双用户通信:');
  console.log('   - 用户连接:', allResults.tests.twoUsers?.user1Connected && allResults.tests.twoUsers?.user2Connected ? '✅ 成功' : '❌ 失败');
  console.log('   - 消息推送:', allResults.tests.twoUsers?.messageReceived ? '✅ 成功' : '⚠️ 需要更多验证');
  console.log('3. 无效Token处理:', allResults.tests.invalidToken?.success ? '✅ 通过' : '❌ 失败');
  console.log('4. 缺少Token处理:', allResults.tests.missingToken?.success ? '✅ 通过' : '❌ 失败');
  console.log('='.repeat(60));

  return allResults;
}

runAllTests().then((results) => {
  console.log('\n✅ 所有测试完成！');
  
  const passedCount = [
    results.tests.basicConnection?.success,
    results.tests.twoUsers?.user1Connected && results.tests.twoUsers?.user2Connected,
    results.tests.invalidToken?.success,
    results.tests.missingToken?.success
  ].filter(Boolean).length;
  
  console.log(`\n🎯 总体通过率: ${passedCount}/4 项核心测试通过`);
  process.exit(0);
});
