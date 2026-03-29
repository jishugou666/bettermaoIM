const db = require('./db');
const { chats, chatMembers, messages, users } = require('./db/crud');

async function cleanupDuplicateChats() {
  try {
    console.log('=== 开始清理重复的私聊会话 ===\n');

    // 1. 获取所有用户
    const allUsers = await users.read({});
    console.log(`找到 ${allUsers.length} 个用户`);

    // 2. 获取所有私聊会话
    const allPrivateChats = await chats.read({ type: 'private' });
    console.log(`找到 ${allPrivateChats.length} 个私聊会话\n`);

    // 3. 对每对用户，找出他们的所有私聊会话
    const userPairs = new Map();

    for (const chat of allPrivateChats) {
      const members = await chatMembers.read({ chatId: chat._id });
      if (members.length !== 2) continue;

      const userIds = members.map(m => m.userId).sort();
      const pairKey = userIds.join('_');

      if (!userPairs.has(pairKey)) {
        userPairs.set(pairKey, []);
      }
      userPairs.get(pairKey).push({
        chatId: chat._id,
        createTime: chat.createTime
      });
    }

    console.log('找到以下用户对的重复会话:');
    for (const [pairKey, chatsList] of userPairs) {
      if (chatsList.length > 1) {
        const [userId1, userId2] = pairKey.split('_');
        const user1 = (await users.read({ _id: userId1 }))[0];
        const user2 = (await users.read({ _id: userId2 }))[0];
        console.log(`  ${user1?.nickname || user1?.username} (${userId1}) <-> ${user2?.nickname || user2?.username} (${userId2}): ${chatsList.length} 个会话`);
      }
    }
    console.log('');

    // 4. 对每对有多个会话的用户，保留一个，合并消息，删除其他
    let deletedChats = 0;
    let movedMessages = 0;

    for (const [pairKey, chatsList] of userPairs) {
      if (chatsList.length <= 1) continue;

      // 按创建时间排序，保留最新的一个
      chatsList.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
      const keepChatId = chatsList[0].chatId;
      const deleteChatIds = chatsList.slice(1).map(c => c.chatId);

      console.log(`处理用户对 ${pairKey}:`);
      console.log(`  保留会话: ${keepChatId}`);
      console.log(`  删除会话: ${deleteChatIds.join(', ')}`);

      // 将要删除的会话中的消息移动到保留的会话
      for (const deleteChatId of deleteChatIds) {
        const msgsToMove = await messages.read({ chatId: deleteChatId });
        console.log(`  从 ${deleteChatId} 移动 ${msgsToMove.length} 条消息`);

        for (const msg of msgsToMove) {
          // 更新消息的 chatId
          await messages.update({ _id: msg._id }, { chatId: keepChatId });
          movedMessages++;
        }

        // 删除聊天成员记录
        await chatMembers.delete({ chatId: deleteChatId });

        // 删除聊天会话
        await chats.delete({ _id: deleteChatId });
        deletedChats++;
      }
      console.log('');
    }

    // 5. 清理所有消息（可选，按用户要求）
    console.log('是否要清空所有消息？(y/n)');
    // 这里我们先不清空，只清理重复会话
    
    console.log(`\n=== 清理完成 ===`);
    console.log(`删除了 ${deletedChats} 个重复会话`);
    console.log(`移动了 ${movedMessages} 条消息`);

    // 6. 验证清理结果
    const remainingPrivateChats = await chats.read({ type: 'private' });
    const remainingPairs = new Map();

    for (const chat of remainingPrivateChats) {
      const members = await chatMembers.read({ chatId: chat._id });
      if (members.length !== 2) continue;

      const userIds = members.map(m => m.userId).sort();
      const pairKey = userIds.join('_');

      if (!remainingPairs.has(pairKey)) {
        remainingPairs.set(pairKey, 0);
      }
      remainingPairs.set(pairKey, remainingPairs.get(pairKey) + 1);
    }

    console.log(`\n清理后剩余 ${remainingPrivateChats.length} 个私聊会话`);
    console.log('各用户对的会话数量:');
    for (const [pairKey, count] of remainingPairs) {
      console.log(`  ${pairKey}: ${count} 个`);
    }

    process.exit(0);
  } catch (error) {
    console.error('清理失败:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

cleanupDuplicateChats();