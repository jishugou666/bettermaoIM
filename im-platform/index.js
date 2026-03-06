const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

// 连接SQLite数据库
const db = new sqlite3.Database('./im_platform.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
    // 创建表结构
    createTables();
  }
});

// 创建表结构
function createTables() {
  // 用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    nickname TEXT,
    password TEXT NOT NULL,
    create_time TEXT DEFAULT CURRENT_TIMESTAMP,
    update_time TEXT DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table created successfully');
      // 插入测试数据
      db.run(`INSERT OR IGNORE INTO users (username, nickname, password) VALUES ('张三', '张三', 'Aa123123'), ('李四', '李四', 'Aa123123')`, (err) => {
        if (err) {
          console.error('Error inserting test users:', err);
        } else {
          console.log('Test users inserted successfully');
        }
      });
    }
  });
  
  // 消息表
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    type INTEGER NOT NULL,
    status INTEGER NOT NULL,
    create_time TEXT DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating messages table:', err);
    } else {
      console.log('Messages table created successfully');
    }
  });
  
  // 好友表
  db.run(`CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    status INTEGER NOT NULL,
    create_time TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id)
  )`, (err) => {
    if (err) {
      console.error('Error creating friends table:', err);
    } else {
      console.log('Friends table created successfully');
      // 插入测试数据
      db.run(`INSERT OR IGNORE INTO friends (user_id, friend_id, status) VALUES (1, 2, 1), (2, 1, 1)`, (err) => {
        if (err) {
          console.error('Error inserting test friends:', err);
        } else {
          console.log('Test friends inserted successfully');
        }
      });
    }
  });
  
  // 群聊表
  db.run(`CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    creator_id INTEGER NOT NULL,
    create_time TEXT DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating groups table:', err);
    } else {
      console.log('Groups table created successfully');
      // 插入测试数据
      db.run(`INSERT OR IGNORE INTO groups (name, creator_id) VALUES ('测试群聊', 1)`, (err) => {
        if (err) {
          console.error('Error inserting test groups:', err);
        } else {
          console.log('Test groups inserted successfully');
        }
      });
    }
  });
  
  // 群成员表
  db.run(`CREATE TABLE IF NOT EXISTS group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role INTEGER NOT NULL,
    join_time TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
  )`, (err) => {
    if (err) {
      console.error('Error creating group_members table:', err);
    } else {
      console.log('Group_members table created successfully');
      // 插入测试数据
      db.run(`INSERT OR IGNORE INTO group_members (group_id, user_id, role) VALUES (1, 1, 1), (1, 2, 2)`, (err) => {
        if (err) {
          console.error('Error inserting test group members:', err);
        } else {
          console.log('Test group members inserted successfully');
        }
      });
    }
  });
  
  // 群消息表
  db.run(`CREATE TABLE IF NOT EXISTS group_messages (
    id TEXT PRIMARY KEY,
    group_id INTEGER NOT NULL,
    from_user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    type INTEGER NOT NULL,
    create_time TEXT DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating group_messages table:', err);
    } else {
      console.log('Group_messages table created successfully');
    }
  });
}

// 模拟Redis客户端
const redisClient = {
  get: async () => null,
  set: async () => {},
  del: async () => {},
  lPush: async () => {}
};

// 路由
app.post('/api/register', (req, res) => {
  const { username, nickname, password } = req.body;
  
  // 检查用户是否已存在
  const checkSql = 'SELECT * FROM users WHERE username = ?';
  db.get(checkSql, [username], (err, result) => {
    if (err) {
      res.status(500).json({ code: 5000, message: 'Server error' });
      return;
    }
    
    if (result) {
      res.status(400).json({ code: 1001, message: 'User already exists' });
      return;
    }
    
    // 插入新用户
    const insertSql = 'INSERT INTO users (username, nickname, password) VALUES (?, ?, ?)';
    db.run(insertSql, [username, nickname || username, password], function(err) {
      if (err) {
        res.status(500).json({ code: 5000, message: 'Server error' });
        return;
      }
      
      res.json({ code: 0, message: 'success', data: { id: this.lastID, username, nickname: nickname || username } });
    });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.get(sql, [username, password], (err, result) => {
    if (err) {
      res.status(500).json({ code: 5000, message: 'Server error' });
      return;
    }
    
    if (!result) {
      res.status(400).json({ code: 1002, message: 'Invalid username or password' });
      return;
    }
    
    res.json({ code: 0, message: 'success', data: { id: result.id, username: result.username, nickname: result.nickname || result.username } });
  });
});

app.get('/api/users', (req, res) => {
  const sql = 'SELECT id, username, nickname FROM users';
  db.all(sql, (err, results) => {
    if (err) {
      res.status(500).json({ code: 5000, message: 'Server error' });
      return;
    }
    
    res.json({ code: 0, message: 'success', data: results });
  });
});

app.get('/api/groups', (req, res) => {
  const sql = `
    SELECT g.id, g.name, COUNT(gm.user_id) as memberCount 
    FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    GROUP BY g.id
  `;
  db.all(sql, (err, results) => {
    if (err) {
      res.status(500).json({ code: 5000, message: 'Server error' });
      return;
    }
    
    res.json({ code: 0, message: 'success', data: results });
  });
});

app.get('/api/messages', (req, res) => {
  const { userId, currentUserId } = req.query;
  
  const sql = `
    SELECT * FROM messages 
    WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)
    ORDER BY create_time ASC
  `;
  db.all(sql, [userId, currentUserId, currentUserId, userId], (err, results) => {
    if (err) {
      res.status(500).json({ code: 5000, message: 'Server error' });
      return;
    }
    
    // 确保消息的fromUserId和toUserId正确
    const messages = results.map(msg => ({
      id: msg.id,
      fromUserId: msg.from_user_id,
      toUserId: msg.to_user_id,
      content: msg.content,
      type: msg.type,
      status: msg.status,
      createTime: msg.create_time
    }));
    
    res.json({ code: 0, message: 'success', data: messages });
  });
});

app.get('/api/group-messages', (req, res) => {
  const { groupId } = req.query;
  
  const sql = `
    SELECT gm.*, u.username FROM group_messages gm
    JOIN users u ON gm.from_user_id = u.id
    WHERE gm.group_id = ?
    ORDER BY gm.create_time ASC
  `;
  db.all(sql, [groupId], (err, results) => {
    if (err) {
      res.status(500).json({ code: 5000, message: 'Server error' });
      return;
    }
    
    res.json({ code: 0, message: 'success', data: results });
  });
});

app.post('/api/send-message', async (req, res) => {
  const { fromUserId, toUserId, content, type } = req.body;
  
  // 生成消息ID
  const messageId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  // 保存消息到数据库
  const insertSql = 'INSERT INTO messages (id, from_user_id, to_user_id, content, type, status, create_time) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.run(insertSql, [messageId, fromUserId, toUserId, content, type, 1, new Date()], (err) => {
    if (err) {
      res.status(500).json({ code: 5000, message: 'Server error' });
      return;
    }
  });
  
  // 检查接收者所在的服务器
  const targetServerId = await redisClient.get(`im:user:${toUserId}`);
  
  if (targetServerId) {
    // 发送消息到Redis队列
    const message = {
      id: messageId,
      fromUserId,
      toUserId,
      content,
      type,
      createTime: new Date().toISOString()
    };
    
    await redisClient.lPush(`im:unread:${targetServerId}`, JSON.stringify(message));
  }
  
  res.json({ code: 0, message: 'success', data: { messageId } });
});

app.post('/api/send-group-message', async (req, res) => {
  const { fromUserId, groupId, content, type } = req.body;
  
  // 生成消息ID
  const messageId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  // 保存消息到数据库
  const insertSql = 'INSERT INTO group_messages (id, group_id, from_user_id, content, type, create_time) VALUES (?, ?, ?, ?, ?, ?)';
  db.run(insertSql, [messageId, groupId, fromUserId, content, type, new Date()], (err) => {
    if (err) {
      res.status(500).json({ code: 5000, message: 'Server error' });
      return;
    }
  });
  
  // 获取群成员
  const membersSql = 'SELECT user_id FROM group_members WHERE group_id = ?';
  db.all(membersSql, [groupId], async (err, members) => {
    if (err) {
      res.status(500).json({ code: 5000, message: 'Server error' });
      return;
    }
    
    // 发送消息给群成员
    for (const member of members) {
      if (member.user_id !== fromUserId) {
        const targetServerId = await redisClient.get(`im:user:${member.user_id}`);
        if (targetServerId) {
          const message = {
            id: messageId,
            groupId,
            fromUserId,
            content,
            type,
            createTime: new Date().toISOString()
          };
          await redisClient.lPush(`im:unread:${targetServerId}`, JSON.stringify(message));
        }
      }
    }
  });
  
  res.json({ code: 0, message: 'success', data: { messageId } });
});

app.post('/api/recall-message', (req, res) => {
  const { messageId } = req.body;
  
  // 更新消息状态
  const updateSql = 'UPDATE messages SET content = ?, status = ? WHERE id = ?';
  db.run(updateSql, ['[消息已撤回]', 4, messageId], (err) => {
    if (err) {
      res.status(500).json({ code: 5000, message: 'Server error' });
      return;
    }
    
    res.json({ code: 0, message: 'success' });
  });
});

app.post('/api/mark-as-read', (req, res) => {
  const { fromUserId, toUserId } = req.body;
  
  // 更新消息状态
  const updateSql = 'UPDATE messages SET status = ? WHERE from_user_id = ? AND to_user_id = ? AND status < ?';
  db.run(updateSql, [3, fromUserId, toUserId, 3], (err) => {
    if (err) {
      res.status(500).json({ code: 5000, message: 'Server error' });
      return;
    }
    
    res.json({ code: 0, message: 'success' });
  });
});

app.post('/api/add-friend', (req, res) => {
  const { userId, friendUsername } = req.body;
  
  // 查找好友用户
  const findUserSql = 'SELECT id FROM users WHERE username = ?';
  db.get(findUserSql, [friendUsername], (err, friend) => {
    if (err) {
      res.status(500).json({ code: 5000, message: 'Server error' });
      return;
    }
    
    if (!friend) {
      res.status(400).json({ code: 1002, message: 'User not found' });
      return;
    }
    
    // 检查是否已经是好友
    const checkFriendSql = 'SELECT * FROM friends WHERE user_id = ? AND friend_id = ?';
    db.get(checkFriendSql, [userId, friend.id], (err, existingFriend) => {
      if (err) {
        res.status(500).json({ code: 5000, message: 'Server error' });
        return;
      }
      
      if (existingFriend) {
        res.status(400).json({ code: 1001, message: 'Already friends' });
        return;
      }
      
      // 添加好友关系
      const insertFriendSql = 'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)';
      db.run(insertFriendSql, [userId, friend.id, 1], (err) => {
        if (err) {
          res.status(500).json({ code: 5000, message: 'Server error' });
          return;
        }
        
        // 双向添加好友关系
        db.run(insertFriendSql, [friend.id, userId, 1], (err) => {
          if (err) {
            res.status(500).json({ code: 5000, message: 'Server error' });
            return;
          }
          
          res.json({ code: 0, message: 'success' });
        });
      });
    });
  });
});

app.post('/api/create-group', (req, res) => {
  const { creatorId, groupName } = req.body;
  
  // 创建群聊
  const insertGroupSql = 'INSERT INTO groups (name, creator_id) VALUES (?, ?)';
  db.run(insertGroupSql, [groupName, creatorId], function(err) {
    if (err) {
      res.status(500).json({ code: 5000, message: 'Server error' });
      return;
    }
    
    const groupId = this.lastID;
    
    // 添加创建者为群成员
    const insertMemberSql = 'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)';
    db.run(insertMemberSql, [groupId, creatorId, 1], (err) => {
      if (err) {
        res.status(500).json({ code: 5000, message: 'Server error' });
        return;
      }
      
      res.json({ code: 0, message: 'success', data: { groupId } });
    });
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`IM Platform running on port ${PORT}`);
});

module.exports = app;