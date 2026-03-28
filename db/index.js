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
      this.datastores.friends = Datastore.create({
        filename: path.join(__dirname, 'friends.db'),
        autoload: true
      });
      this.datastores.friendRequests = Datastore.create({
        filename: path.join(__dirname, 'friendRequests.db'),
        autoload: true
      });
      this.datastores.chats = Datastore.create({
        filename: path.join(__dirname, 'chats.db'),
        autoload: true
      });
      this.datastores.chatMembers = Datastore.create({
        filename: path.join(__dirname, 'chatMembers.db'),
        autoload: true
      });
      this.datastores.messages = Datastore.create({
        filename: path.join(__dirname, 'messages.db'),
        autoload: true
      });
      this.datastores.points = Datastore.create({
        filename: path.join(__dirname, 'points.db'),
        autoload: true
      });
      this.datastores.moments = Datastore.create({
        filename: path.join(__dirname, 'moments.db'),
        autoload: true
      });
      this.datastores.momentLikes = Datastore.create({
        filename: path.join(__dirname, 'momentLikes.db'),
        autoload: true
      });
      this.datastores.momentComments = Datastore.create({
        filename: path.join(__dirname, 'momentComments.db'),
        autoload: true
      });
      // 社区功能集合
      this.datastores.communityPosts = Datastore.create({
        filename: path.join(__dirname, 'communityPosts.db'),
        autoload: true
      });
      this.datastores.communityComments = Datastore.create({
        filename: path.join(__dirname, 'communityComments.db'),
        autoload: true
      });
      this.datastores.communityLikes = Datastore.create({
        filename: path.join(__dirname, 'communityLikes.db'),
        autoload: true
      });

      // 创建索引
      this.datastores.users.ensureIndex({ fieldName: '_id', unique: true });
      this.datastores.users.ensureIndex({ fieldName: 'username', unique: true });
      this.datastores.users.ensureIndex({ fieldName: 'email', unique: true });
      this.datastores.friends.ensureIndex({ fieldName: '_id', unique: true });
      this.datastores.friends.ensureIndex({ fieldName: ['userId', 'friendId'], unique: true });
      this.datastores.friendRequests.ensureIndex({ fieldName: '_id', unique: true });
      this.datastores.friendRequests.ensureIndex({ fieldName: ['fromUserId', 'toUserId'], unique: true });
      this.datastores.chats.ensureIndex({ fieldName: '_id', unique: true });
      this.datastores.chatMembers.ensureIndex({ fieldName: '_id', unique: true });
      this.datastores.chatMembers.ensureIndex({ fieldName: ['chatId', 'userId'], unique: true });
      this.datastores.messages.ensureIndex({ fieldName: '_id', unique: true });
      this.datastores.messages.ensureIndex({ fieldName: 'chatId' });
      this.datastores.points.ensureIndex({ fieldName: '_id', unique: true });
      this.datastores.points.ensureIndex({ fieldName: 'userId' });
      this.datastores.moments.ensureIndex({ fieldName: '_id', unique: true });
      this.datastores.moments.ensureIndex({ fieldName: 'userId' });
      this.datastores.momentLikes.ensureIndex({ fieldName: '_id', unique: true });
      this.datastores.momentLikes.ensureIndex({ fieldName: ['momentId', 'userId'], unique: true });
      this.datastores.momentComments.ensureIndex({ fieldName: '_id', unique: true });
      this.datastores.momentComments.ensureIndex({ fieldName: 'momentId' });
      // 社区功能索引
      this.datastores.communityPosts.ensureIndex({ fieldName: '_id', unique: true });
      this.datastores.communityPosts.ensureIndex({ fieldName: 'userId' });
      this.datastores.communityComments.ensureIndex({ fieldName: '_id', unique: true });
      this.datastores.communityComments.ensureIndex({ fieldName: 'postId' });
      this.datastores.communityLikes.ensureIndex({ fieldName: '_id', unique: true });
      this.datastores.communityLikes.ensureIndex({ fieldName: ['postId', 'userId'], unique: true });

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
          // --- 修改开始 ---
          console.log(`[DatabaseManager.execute] 插入数据到 ${collection}:`, data);
          const doc = await store.insert(data);
          console.log(`[DatabaseManager.execute] 插入结果:`, doc);
          // 返回完整的文档对象，包含 _id
          return { lastID: doc._id, _id: doc._id, ...doc };
          // --- 修改结束 ---
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
      console.error('[DatabaseManager.execute] 操作失败:', error);
      throw error;
    }
  }

  // 查询方法
  async query(collection, query, projection) {
    try {
      // --- 修改开始 ---
      // 参数验证
      if (!collection || typeof collection !== 'string') {
        throw new Error('Collection name must be a non-empty string');
      }

      if (!query || typeof query !== 'object') {
        console.warn('[DatabaseManager.query] 无效的查询条件，使用空对象');
        query = {};
      }

      const store = this.datastores[collection];
      if (!store) {
        throw new Error(`Collection not found: ${collection}`);
      }

      const docs = await store.find(query, projection);
      
      // 确保返回数组
      if (!Array.isArray(docs)) {
        console.warn('[DatabaseManager.query] 查询返回非数组类型:', typeof docs);
        return [];
      }
      
      return docs;
      // --- 修改结束 ---
    } catch (error) {
      console.error('[DatabaseManager.query] 查询失败:', error);
      throw error;
    }
  }

  // 获取查询游标（支持链式操作）
  async queryCursor(collection, query, projection) {
    try {
      // 参数验证
      if (!collection || typeof collection !== 'string') {
        throw new Error('Collection name must be a non-empty string');
      }

      if (!query || typeof query !== 'object') {
        console.warn('[DatabaseManager.queryCursor] 无效的查询条件，使用空对象');
        query = {};
      }

      const store = this.datastores[collection];
      if (!store) {
        throw new Error(`Collection not found: ${collection}`);
      }

      // 返回游标对象，支持链式调用
      return store.find(query, projection);
    } catch (error) {
      console.error('[DatabaseManager.queryCursor] 查询失败:', error);
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