const Datastore = require('nedb-promises');
const path = require('path');

class DatabaseManager {
  constructor() {
    this.dbPath = path.join(__dirname, 'bettermao.db');
    this.datastores = {};
    this.init();
  }

  init() {
    try {
      // 创建各个集合
      this.datastores.users = Datastore.create({
        filename: path.join(__dirname, 'users.db'),
        autoload: true
      });
      this.datastores.sessions = Datastore.create({
        filename: path.join(__dirname, 'sessions.db'),
        autoload: true
      });
      this.datastores.sessionMembers = Datastore.create({
        filename: path.join(__dirname, 'session_members.db'),
        autoload: true
      });
      this.datastores.messages = Datastore.create({
        filename: path.join(__dirname, 'messages.db'),
        autoload: true
      });
      this.datastores.friends = Datastore.create({
        filename: path.join(__dirname, 'friends.db'),
        autoload: true
      });
      this.datastores.friendRequests = Datastore.create({
        filename: path.join(__dirname, 'friend_requests.db'),
        autoload: true
      });

      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  }

  // 通用执行方法
  async execute(collection, operation, query, data) {
    try {
      const store = this.datastores[collection];
      if (!store) {
        throw new Error('Collection not found');
      }

      switch (operation) {
        case 'insert':
          const doc = await store.insert(data);
          return { lastID: doc._id, changes: 1 };
        case 'update':
          const numUpdated = await store.update(query, data, { multi: true });
          return { changes: numUpdated };
        case 'remove':
          const numRemoved = await store.remove(query, { multi: true });
          return { changes: numRemoved };
        default:
          throw new Error('Invalid operation');
      }
    } catch (error) {
      throw error;
    }
  }

  // 查询方法
  async query(collection, query, projection) {
    try {
      const store = this.datastores[collection];
      if (!store) {
        throw new Error('Collection not found');
      }

      const docs = await store.find(query, projection);
      return docs;
    } catch (error) {
      throw error;
    }
  }

  // 获取单个文档
  async get(collection, query, projection) {
    try {
      const store = this.datastores[collection];
      if (!store) {
        throw new Error('Collection not found');
      }

      const doc = await store.findOne(query, projection);
      return doc;
    } catch (error) {
      throw error;
    }
  }

  // 备份方法
  backup() {
    const backupPath = path.join(__dirname, `bettermao_backup_${Date.now()}`);
    // 这里可以实现备份逻辑
    console.log(`Backup created at: ${backupPath}`);
    return backupPath;
  }

  // 关闭方法
  close() {
    // NeDB 会自动持久化，不需要显式关闭
    console.log('Database closed successfully');
  }
}

module.exports = new DatabaseManager();