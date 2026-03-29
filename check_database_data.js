const db = require('./db');
const { chats, chatMembers, users, messages, moments, communityPosts } = require('./db/crud');

async function checkDatabase() {
  try {
    console.log('=== 检查数据库数据 ===\n');
    
    // 检查 chats 表
    const allChats = await chats.read({});
    console.log('1. chats 表中的数据:');
    console.log('   数量:', allChats.length);
    if (allChats.length > 0) {
      console.log('   第一条数据结构:', JSON.stringify(allChats[0], null, 2));
    }
    console.log();
    
    // 检查 chatMembers 表
    const allMembers = await chatMembers.read({});
    console.log('2. chatMembers 表中的数据:');
    console.log('   数量:', allMembers.length);
    if (allMembers.length > 0) {
      console.log('   第一条数据结构:', JSON.stringify(allMembers[0], null, 2));
    }
    console.log();
    
    // 检查 users 表
    const allUsers = await users.read({});
    console.log('3. users 表中的数据:');
    console.log('   数量:', allUsers.length);
    if (allUsers.length > 0) {
      console.log('   第一条数据结构:', JSON.stringify(allUsers[0], null, 2));
    }
    console.log();
    
    // 检查 messages 表
    const allMessages = await messages.read({});
    console.log('4. messages 表中的数据:');
    console.log('   数量:', allMessages.length);
    if (allMessages.length > 0) {
      console.log('   第一条数据结构:', JSON.stringify(allMessages[0], null, 2));
    }
    console.log();
    
    // 检查 moments 表
    const allMoments = await moments.read({});
    console.log('5. moments 表中的数据:');
    console.log('   数量:', allMoments.length);
    if (allMoments.length > 0) {
      console.log('   第一条数据结构:', JSON.stringify(allMoments[0], null, 2));
    }
    console.log();
    
    // 检查 communityPosts 表
    const allPosts = await communityPosts.read({});
    console.log('6. communityPosts 表中的数据:');
    console.log('   数量:', allPosts.length);
    if (allPosts.length > 0) {
      console.log('   第一条数据结构:', JSON.stringify(allPosts[0], null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('检查数据库失败:', error);
    process.exit(1);
  }
}

checkDatabase();
