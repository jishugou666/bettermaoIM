const db = require('./index');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  try {
    // 创建默认用户
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const defaultUsers = [
      {
        username: 'admin',
        password: hashedPassword,
        nickname: '管理员',
        avatar: 'admin.png',
        status: 'offline'
      },
      {
        username: 'user1',
        password: hashedPassword,
        nickname: '用户1',
        avatar: 'user1.png',
        status: 'offline'
      },
      {
        username: 'user2',
        password: hashedPassword,
        nickname: '用户2',
        avatar: 'user2.png',
        status: 'offline'
      }
    ];

    for (const user of defaultUsers) {
      try {
        await db.execute(
          `INSERT OR IGNORE INTO users (username, password, nickname, avatar, status) 
           VALUES (?, ?, ?, ?, ?)`,
          [user.username, user.password, user.nickname, user.avatar, user.status]
        );
      } catch (error) {
        console.error(`Error inserting user ${user.username}:`, error.message);
      }
    }

    // 创建默认会话
    const defaultSessions = [
      {
        type: 'group',
        name: '默认群聊'
      }
    ];

    for (const session of defaultSessions) {
      try {
        const result = await db.execute(
          `INSERT OR IGNORE INTO sessions (type, name) VALUES (?, ?)`,
          [session.type, session.name]
        );

        // 添加所有用户到默认群聊
        if (result.lastID) {
          const users = await db.query('SELECT id FROM users');
          for (const user of users) {
            await db.execute(
              `INSERT OR IGNORE INTO session_members (session_id, user_id) VALUES (?, ?)`,
              [result.lastID, user.id]
            );
          }
        }
      } catch (error) {
        console.error(`Error creating session ${session.name}:`, error.message);
      }
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// 执行初始化
initDatabase();

module.exports = initDatabase;