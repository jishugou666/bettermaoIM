const db = require('./db');
const { messages, chats, chatMembers, users } = require('./db/crud');

async function checkAllMessages() {
  try {
    console.log('=== 开始检查所有消息 ===\n');

    // 1. 获取所有消息
    const allMessages = await messages.read({});
    console.log(`找到 ${allMessages.length} 条消息:\n`);
    
    allMessages.forEach((msg, idx) => {
      console.log(`消息 ${idx + 1}:`);
      console.log(`  chatId: ${msg.chatId}`);
      console.log(`  userId: ${msg.userId}`);
      console.log(`  content: ${msg.content}`);
      console.log(`  createTime: ${msg.createTime}`);
      console.log('---');
    });

    // 2. 获取所有聊天会话
    const allChats = await chats.read({});
    console.log(`\n找到 ${allChats.length} 个聊天会话:\n`);
    
    allChats.forEach(chat => {
      console.log(`聊天: ${chat._id} (${chat.type})`);
    });

    // 3. 获取所有用户
    const allUsers = await users.read({});
    console.log(`\n找到 ${allUsers.length} 个用户:\n`);
    
    allUsers.forEach(user => {
      console.log(`用户: ${user._id} - ${user.nickname || user.username}`);
    });

    console.log('\n=== 检查完成 ===');
    process.exit(0);
  } catch (error) {
    console.error('检查失败:', error);
    process.exit(1);
  }
}

checkAllMessages();