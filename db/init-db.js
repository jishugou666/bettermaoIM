const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDatabase() {
  console.log('='.repeat(60));
  console.log('BetterMao IM 数据库初始化');
  console.log('='.repeat(60));

  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bettermaoim'
  };

  console.log('\n配置信息:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Database: ${config.database}`);

  let connection;

  try {
    console.log('\n1. 连接到 MySQL 服务器...');
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    });
    console.log('   ✓ 连接成功');

    console.log('\n2. 创建数据库（如果不存在）...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('   ✓ 数据库准备就绪');

    console.log('\n3. 选择数据库...');
    await connection.query(`USE \`${config.database}\``);
    console.log('   ✓ 已选择数据库');

    console.log('\n4. 创建表结构...');
    
    const tables = [
      {
        name: 'users',
        sql: `CREATE TABLE IF NOT EXISTS users (
          _id VARCHAR(36) PRIMARY KEY,
          id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          nickname VARCHAR(50),
          avatar VARCHAR(500),
          status VARCHAR(20) DEFAULT 'online',
          bio TEXT,
          signature TEXT,
          gender VARCHAR(10),
          birthday DATE,
          location VARCHAR(100),
          tags JSON,
          points INT DEFAULT 0,
          role VARCHAR(20) DEFAULT 'user',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          updated_at DATETIME GENERATED ALWAYS AS (updatedAt) STORED,
          INDEX idx_username (username),
          INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'friends',
        sql: `CREATE TABLE IF NOT EXISTS friends (
          _id VARCHAR(36) PRIMARY KEY,
          id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
          userId VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) GENERATED ALWAYS AS (userId) STORED,
          friendId VARCHAR(36) NOT NULL,
          friend_id VARCHAR(36) GENERATED ALWAYS AS (friendId) STORED,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
          UNIQUE KEY uk_user_friend (userId, friendId),
          INDEX idx_userId (userId),
          INDEX idx_friendId (friendId),
          INDEX idx_user_id (user_id),
          INDEX idx_friend_id (friend_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'friendRequests',
        sql: `CREATE TABLE IF NOT EXISTS friendRequests (
          _id VARCHAR(36) PRIMARY KEY,
          id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
          fromUserId VARCHAR(36) NOT NULL,
          from_user_id VARCHAR(36) GENERATED ALWAYS AS (fromUserId) STORED,
          senderId VARCHAR(36) GENERATED ALWAYS AS (fromUserId) STORED,
          sender_id VARCHAR(36) GENERATED ALWAYS AS (fromUserId) STORED,
          toUserId VARCHAR(36) NOT NULL,
          to_user_id VARCHAR(36) GENERATED ALWAYS AS (toUserId) STORED,
          receiverId VARCHAR(36) GENERATED ALWAYS AS (toUserId) STORED,
          receiver_id VARCHAR(36) GENERATED ALWAYS AS (toUserId) STORED,
          status VARCHAR(20) DEFAULT 'pending',
          message TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          updated_at DATETIME GENERATED ALWAYS AS (updatedAt) STORED,
          UNIQUE KEY uk_from_to (fromUserId, toUserId),
          INDEX idx_fromUserId (fromUserId),
          INDEX idx_toUserId (toUserId),
          INDEX idx_from_user_id (from_user_id),
          INDEX idx_to_user_id (to_user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'chats',
        sql: `CREATE TABLE IF NOT EXISTS chats (
          _id VARCHAR(36) PRIMARY KEY,
          id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
          sessionId VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
          type VARCHAR(20) NOT NULL DEFAULT 'private',
          name VARCHAR(100),
          avatar VARCHAR(500),
          creatorId VARCHAR(36),
          creator_id VARCHAR(36) GENERATED ALWAYS AS (creatorId) STORED,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          updated_at DATETIME GENERATED ALWAYS AS (updatedAt) STORED,
          INDEX idx_type (type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'chatMembers',
        sql: `CREATE TABLE IF NOT EXISTS chatMembers (
          _id VARCHAR(36) PRIMARY KEY,
          id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
          chatId VARCHAR(36) NOT NULL,
          chat_id VARCHAR(36) GENERATED ALWAYS AS (chatId) STORED,
          sessionId VARCHAR(36) GENERATED ALWAYS AS (chatId) STORED,
          session_id VARCHAR(36) GENERATED ALWAYS AS (chatId) STORED,
          userId VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) GENERATED ALWAYS AS (userId) STORED,
          role VARCHAR(20) DEFAULT 'member',
          joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          joined_at DATETIME GENERATED ALWAYS AS (joinedAt) STORED,
          UNIQUE KEY uk_chat_user (chatId, userId),
          INDEX idx_chatId (chatId),
          INDEX idx_userId (userId),
          INDEX idx_chat_id (chat_id),
          INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'messages',
        sql: `CREATE TABLE IF NOT EXISTS messages (
          _id VARCHAR(36) PRIMARY KEY,
          id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
          chatId VARCHAR(36) NOT NULL,
          chat_id VARCHAR(36) GENERATED ALWAYS AS (chatId) STORED,
          sessionId VARCHAR(36) GENERATED ALWAYS AS (chatId) STORED,
          session_id VARCHAR(36) GENERATED ALWAYS AS (chatId) STORED,
          senderId VARCHAR(36) NOT NULL,
          sender_id VARCHAR(36) GENERATED ALWAYS AS (senderId) STORED,
          userId VARCHAR(36) GENERATED ALWAYS AS (senderId) STORED,
          type VARCHAR(20) DEFAULT 'text',
          content TEXT,
          attachments JSON,
          readBy JSON,
          status VARCHAR(20) DEFAULT 'sent',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
          INDEX idx_chatId (chatId),
          INDEX idx_senderId (senderId),
          INDEX idx_createdAt (createdAt),
          INDEX idx_chat_id (chat_id),
          INDEX idx_sender_id (sender_id),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'points',
        sql: `CREATE TABLE IF NOT EXISTS points (
          _id VARCHAR(36) PRIMARY KEY,
          id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
          userId VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) GENERATED ALWAYS AS (userId) STORED,
          amount INT DEFAULT 0,
          type VARCHAR(50),
          description TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
          INDEX idx_userId (userId),
          INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'moments',
        sql: `CREATE TABLE IF NOT EXISTS moments (
          _id VARCHAR(36) PRIMARY KEY,
          id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
          userId VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) GENERATED ALWAYS AS (userId) STORED,
          content TEXT,
          images JSON,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
          INDEX idx_userId (userId),
          INDEX idx_createdAt (createdAt),
          INDEX idx_user_id (user_id),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'momentLikes',
        sql: `CREATE TABLE IF NOT EXISTS momentLikes (
          _id VARCHAR(36) PRIMARY KEY,
          id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
          momentId VARCHAR(36) NOT NULL,
          moment_id VARCHAR(36) GENERATED ALWAYS AS (momentId) STORED,
          userId VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) GENERATED ALWAYS AS (userId) STORED,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
          UNIQUE KEY uk_moment_user (momentId, userId),
          INDEX idx_momentId (momentId),
          INDEX idx_userId (userId),
          INDEX idx_moment_id (moment_id),
          INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'momentComments',
        sql: `CREATE TABLE IF NOT EXISTS momentComments (
          _id VARCHAR(36) PRIMARY KEY,
          id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
          momentId VARCHAR(36) NOT NULL,
          moment_id VARCHAR(36) GENERATED ALWAYS AS (momentId) STORED,
          userId VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) GENERATED ALWAYS AS (userId) STORED,
          content TEXT,
          replyTo VARCHAR(36),
          reply_to VARCHAR(36) GENERATED ALWAYS AS (replyTo) STORED,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
          INDEX idx_momentId (momentId),
          INDEX idx_userId (userId),
          INDEX idx_moment_id (moment_id),
          INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'communityPosts',
        sql: `CREATE TABLE IF NOT EXISTS communityPosts (
          _id VARCHAR(36) PRIMARY KEY,
          id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
          userId VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) GENERATED ALWAYS AS (userId) STORED,
          title VARCHAR(200),
          content TEXT,
          images JSON,
          category VARCHAR(50),
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          updated_at DATETIME GENERATED ALWAYS AS (updatedAt) STORED,
          INDEX idx_userId (userId),
          INDEX idx_category (category),
          INDEX idx_createdAt (createdAt),
          INDEX idx_user_id (user_id),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'communityComments',
        sql: `CREATE TABLE IF NOT EXISTS communityComments (
          _id VARCHAR(36) PRIMARY KEY,
          id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
          postId VARCHAR(36) NOT NULL,
          post_id VARCHAR(36) GENERATED ALWAYS AS (postId) STORED,
          userId VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) GENERATED ALWAYS AS (userId) STORED,
          content TEXT,
          replyTo VARCHAR(36),
          reply_to VARCHAR(36) GENERATED ALWAYS AS (replyTo) STORED,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
          INDEX idx_postId (postId),
          INDEX idx_userId (userId),
          INDEX idx_post_id (post_id),
          INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'communityLikes',
        sql: `CREATE TABLE IF NOT EXISTS communityLikes (
          _id VARCHAR(36) PRIMARY KEY,
          id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
          postId VARCHAR(36) NOT NULL,
          post_id VARCHAR(36) GENERATED ALWAYS AS (postId) STORED,
          userId VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) GENERATED ALWAYS AS (userId) STORED,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
          UNIQUE KEY uk_post_user (postId, userId),
          INDEX idx_postId (postId),
          INDEX idx_userId (userId),
          INDEX idx_post_id (post_id),
          INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      },
      {
        name: 'adminUsers',
        sql: `CREATE TABLE IF NOT EXISTS adminUsers (
          _id VARCHAR(36) PRIMARY KEY,
          id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(100),
          role VARCHAR(20) DEFAULT 'admin',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          updated_at DATETIME GENERATED ALWAYS AS (updatedAt) STORED,
          INDEX idx_username (username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      }
    ];

    for (const table of tables) {
      try {
        await connection.query(table.sql);
        console.log(`   ✓ 创建表 ${table.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   - 表 ${table.name} 已存在，跳过`);
        } else {
          console.log(`   ⚠ 创建表 ${table.name} 时出错: ${error.message}`);
        }
      }
    }

    console.log('\n5. 验证表结构...');
    const [tablesResult] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [config.database]);
    
    console.log(`   ✓ 数据库中共有 ${tablesResult.length} 个表`);
    if (tablesResult.length > 0) {
      console.log('   表列表:');
      tablesResult.forEach(table => {
        console.log(`     - ${table.TABLE_NAME}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('数据库初始化完成！');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ 数据库初始化失败:');
    console.error(`  错误信息: ${error.message}`);
    console.error(`  错误代码: ${error.code}`);
    console.error('\n提示:');
    console.error('  1. 请确保 MySQL 服务已启动');
    console.error('  2. 请检查 .env 文件中的数据库配置');
    console.error('  3. 请确保用户名和密码正确');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
