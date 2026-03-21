const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '..', '..', 'dev.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    // 初始化数据库表结构
    initDatabase();
  }
});

// 初始化数据库表结构
function initDatabase() {
  // 创建用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS User (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      username TEXT UNIQUE,
      password TEXT,
      nickname TEXT,
      avatar TEXT,
      bio TEXT,
      role TEXT DEFAULT 'USER',
      isVip BOOLEAN DEFAULT 0,
      gender TEXT,
      location TEXT,
      tags TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating User table:', err.message);
    else console.log('User table created or already exists');
  });

  // 创建消息表
  db.run(`
    CREATE TABLE IF NOT EXISTS Message (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT,
      type TEXT DEFAULT 'text',
      senderId INTEGER,
      receiverId INTEGER,
      groupId INTEGER,
      isRead BOOLEAN DEFAULT 0,
      isRecalled BOOLEAN DEFAULT 0,
      isEdited BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating Message table:', err.message);
    else console.log('Message table created or already exists');
  });

  // 创建群聊表
  db.run(`
    CREATE TABLE IF NOT EXISTS Groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      avatar TEXT,
      creatorId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating Groups table:', err.message);
    else console.log('Groups table created or already exists');
  });

  // 创建群成员表
  db.run(`
    CREATE TABLE IF NOT EXISTS GroupMember (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      groupId INTEGER,
      userId INTEGER,
      role TEXT DEFAULT 'MEMBER',
      joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(groupId, userId)
    )
  `, (err) => {
    if (err) console.error('Error creating GroupMember table:', err.message);
    else console.log('GroupMember table created or already exists');
  });

  // 创建好友关系表
  db.run(`
    CREATE TABLE IF NOT EXISTS Friendship (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      friendId INTEGER,
      status TEXT DEFAULT 'PENDING',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, friendId)
    )
  `, (err) => {
    if (err) console.error('Error creating Friendship table:', err.message);
    else console.log('Friendship table created or already exists');
  });

  // 创建用户信用表
  db.run(`
    CREATE TABLE IF NOT EXISTS UserCredit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER UNIQUE,
      balance INTEGER DEFAULT 0,
      totalEarned INTEGER DEFAULT 0,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating UserCredit table:', err.message);
    else console.log('UserCredit table created or already exists');
  });

  // 创建信用交易表
  db.run(`
    CREATE TABLE IF NOT EXISTS CreditTransaction (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      type TEXT,
      amount INTEGER,
      remark TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating CreditTransaction table:', err.message);
    else console.log('CreditTransaction table created or already exists');
  });

  // 创建任务日志表
  db.run(`
    CREATE TABLE IF NOT EXISTS TaskLog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      taskKey TEXT,
      completedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating TaskLog table:', err.message);
    else console.log('TaskLog table created or already exists');
  });

  // 创建动态表
  db.run(`
    CREATE TABLE IF NOT EXISTS Moment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      content TEXT,
      images TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating Moment table:', err.message);
    else console.log('Moment table created or already exists');
  });

  // 创建点赞表
  db.run(`
    CREATE TABLE IF NOT EXISTS Like (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      momentId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, momentId)
    )
  `, (err) => {
    if (err) console.error('Error creating Like table:', err.message);
    else console.log('Like table created or already exists');
  });

  // 创建评论表
  db.run(`
    CREATE TABLE IF NOT EXISTS Comment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      momentId INTEGER,
      content TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating Comment table:', err.message);
    else console.log('Comment table created or already exists');
  });

  // 创建帖子表
  db.run(`
    CREATE TABLE IF NOT EXISTS Post (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      title TEXT,
      content TEXT,
      category TEXT DEFAULT 'general',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating Post table:', err.message);
    else console.log('Post table created or already exists');
  });

  // 创建帖子评论表
  db.run(`
    CREATE TABLE IF NOT EXISTS PostComment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      postId INTEGER,
      parentId INTEGER,
      content TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating PostComment table:', err.message);
    else console.log('PostComment table created or already exists');
  });

  // 创建帖子点赞表
  db.run(`
    CREATE TABLE IF NOT EXISTS PostLike (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      postId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, postId)
    )
  `, (err) => {
    if (err) console.error('Error creating PostLike table:', err.message);
    else console.log('PostLike table created or already exists');
  });

  // 添加测试用户
  db.get('SELECT * FROM User WHERE email = ?', ['test@example.com'], (err, row) => {
    if (err) {
      console.error('Error checking test user:', err.message);
    } else if (!row) {
      // 添加测试用户
      db.run(
        `INSERT INTO User (email, username, password, nickname, role) 
         VALUES (?, ?, ?, ?, ?)`,
        ['test@example.com', 'testuser', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Test User', 'USER'],
        (err) => {
          if (err) {
            console.error('Error creating test user:', err.message);
          } else {
            console.log('Test user created');
          }
        }
      );
    } else {
      console.log('Test user already exists');
    }
  });
}

// 封装查询方法
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// 封装单条查询方法
const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// 封装插入方法
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

// 导出数据库连接和方法
module.exports = {
  db,
  query,
  get,
  run
};