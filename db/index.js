const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, 'bettermao.db');
    this.db = null;
    this.pool = [];
    this.poolSize = 5;
    this.connectionsInUse = 0;
    this.init();
  }

  async init() {
    try {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
        } else {
          console.log('Database connected successfully');
          this.createTables();
        }
      });
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  }

  createTables() {
    const createUserTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nickname TEXT NOT NULL,
        avatar TEXT DEFAULT 'default.png',
        status TEXT DEFAULT 'offline',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createSessionTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createSessionMemberTable = `
      CREATE TABLE IF NOT EXISTS session_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(session_id, user_id)
      );
    `;

    const createMessageTable = `
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        type TEXT DEFAULT 'text',
        status TEXT DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    const createFriendsTable = `
      CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, friend_id)
      );
    `;

    const createFriendRequestsTable = `
      CREATE TABLE IF NOT EXISTS friend_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(sender_id, receiver_id, status)
      );
    `;

    const createIndexOnMessages = `
      CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    `;

    this.db.run(createUserTable, (err) => {
      if (err) console.error('Error creating users table:', err.message);
    });

    this.db.run(createSessionTable, (err) => {
      if (err) console.error('Error creating sessions table:', err.message);
    });

    this.db.run(createSessionMemberTable, (err) => {
      if (err) console.error('Error creating session_members table:', err.message);
    });

    this.db.run(createMessageTable, (err) => {
      if (err) console.error('Error creating messages table:', err.message);
    });

    this.db.run(createFriendsTable, (err) => {
      if (err) console.error('Error creating friends table:', err.message);
    });

    this.db.run(createFriendRequestsTable, (err) => {
      if (err) console.error('Error creating friend_requests table:', err.message);
    });

    this.db.run(createIndexOnMessages, (err) => {
      if (err) console.error('Error creating indexes:', err.message);
    });
  }

  getConnection() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
      } else {
        reject(new Error('Database not initialized'));
      }
    });
  }

  async execute(sql, params = []) {
    const db = await this.getConnection();
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async query(sql, params = []) {
    const db = await this.getConnection();
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async get(sql, params = []) {
    const db = await this.getConnection();
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async backup() {
    const backupPath = path.join(__dirname, `bettermao_backup_${Date.now()}.db`);
    return new Promise((resolve, reject) => {
      const backupDb = new sqlite3.Database(backupPath, (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.db.serialize(() => {
          this.db.each(
            "SELECT type, name, sql FROM sqlite_master WHERE type='table'",
            (err, table) => {
              if (err) {
                reject(err);
                return;
              }
              if (table.sql) {
                backupDb.run(table.sql);
              }
            },
            (err) => {
              if (err) {
                reject(err);
                return;
              }
              this.db.each(
                "SELECT name FROM sqlite_master WHERE type='index'",
                (err, index) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  this.db.get(
                    `SELECT sql FROM sqlite_master WHERE type='index' AND name='${index.name}'`,
                    (err, indexSql) => {
                      if (err) {
                        reject(err);
                        return;
                      }
                      if (indexSql && indexSql.sql) {
                        backupDb.run(indexSql.sql);
                      }
                    }
                  );
                },
                (err) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  backupDb.close(() => {
                    resolve(backupPath);
                  });
                }
              );
            }
          );
        });
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database closed successfully');
        }
      });
    }
  }
}

module.exports = new Database();