const db = require('./db');
const { chats, chatMembers, users } = require('./db/crud');

async function checkChatMembers() {
  try {
    console.log('=== 检查聊天成员 ===\n');

    // 检查技术猫和技术狗参与的聊天
    const userId1 = 'GPKI22NUPbF4u2GY'; // 技术猫
    const userId2 = 'Cb69OymuG0GshrDM'; // 技术狗

    console.log(`检查用户 ${userId1} (技术猫) 参与的聊天:`);
    const user1Chats = await chatMembers.read({ userId: userId1 });
    console.log(user1Chats.map(m => m.chatId));

    console.log(`\n检查用户 ${userId2} (技术狗) 参与的聊天:`);
    const user2Chats = await chatMembers.read({ userId: userId2 });
    console.log(user2Chats.map(m => m.chatId));

    // 找共同的聊天
    const user1ChatIds = user1Chats.map(m => m.chatId);
    const user2ChatIds = user2Chats.map(m => m.chatId);
    const commonChats = user1ChatIds.filter(id => user2ChatIds.includes(id));

    console.log(`\n共同的聊天会话: ${commonChats}`);

    // 查看每个共同聊天的成员
    for (const chatId of commonChats) {
      console.log(`\n--- 聊天 ${chatId} 的成员 ---`);
      const members = await chatMembers.read({ chatId });
      for (const member of members) {
        const userList = await users.read({ _id: member.userId });
        const user = userList[0];
        console.log(`  ${member.userId} - ${user ? user.nickname : '未知'}`);
      }
    }

    // 查看 GbQLzbgMkKOLcwh2 的成员
    console.log(`\n--- 聊天 GbQLzbgMkKOLcwh2 的成员 ---`);
    const gMembers = await chatMembers.read({ chatId: 'GbQLzbgMkKOLcwh2' });
    for (const member of gMembers) {
      const userList = await users.read({ _id: member.userId });
      const user = userList[0];
      console.log(`  ${member.userId} - ${user ? user.nickname : '未知'}`);
    }

    console.log('\n=== 检查完成 ===');
    process.exit(0);
  } catch (error) {
    console.error('检查失败:', error);
    process.exit(1);
  }
}

checkChatMembers();