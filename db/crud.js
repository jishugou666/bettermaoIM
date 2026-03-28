const db = require('./index');

class CRUD {
  constructor(table) {
    this.table = table;
    this.locks = new Map();
  }

  async create(data) {
    try {
      // 使用 nedb 的 insert 操作
      const result = await db.execute(this.table, 'insert', null, data);
      return result;
    } catch (error) {
      throw new Error(`Create failed: ${error.message}`);
    }
  }

  async read(conditions = {}, options = {}) {
    try {
      // --- 修改开始 ---
      // 参数验证
      if (!conditions || typeof conditions !== 'object') {
        console.warn('[CRUD.read] 无效的查询条件，使用空对象');
        conditions = {};
      }

      // 支持选项参数：sort, limit, skip, projection
      const { sort, limit, skip, projection } = options;
      
      // 使用 nedb-promises 的链式查询
      let cursor = db.datastores[this.table].find(conditions, projection);
      
      // 应用排序
      if (sort) {
        cursor = cursor.sort(sort);
      }
      
      // 应用跳过
      if (skip) {
        cursor = cursor.skip(skip);
      }
      
      // 应用限制
      if (limit) {
        cursor = cursor.limit(limit);
      }
      
      // 执行查询
      const docs = await cursor.exec();
      
      // 确保返回数组
      if (!Array.isArray(docs)) {
        console.warn('[CRUD.read] 数据库返回非数组类型:', typeof docs);
        return [];
      }
      
      return docs;
      // --- 修改结束 ---
    } catch (error) {
      console.error(`[CRUD.read] 查询失败 - 表: ${this.table}, 条件:`, conditions, '错误:', error);
      throw new Error(`Read failed: ${error.message}`);
    }
  }

  async update(conditions, data) {
    try {
      // 使用 nedb 的 update 操作
      const result = await db.execute(this.table, 'update', conditions, { $set: data });
      return result;
    } catch (error) {
      throw new Error(`Update failed: ${error.message}`);
    }
  }

  async delete(conditions) {
    try {
      // 使用 nedb 的 remove 操作
      const result = await db.execute(this.table, 'remove', conditions, null);
      return result;
    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      // 使用 nedb 的 findOne 操作
      const doc = await db.get(this.table, { _id: id }, {});
      return doc;
    } catch (error) {
      throw new Error(`Get by id failed: ${error.message}`);
    }
  }

  async lock(resourceId) {
    while (this.locks.has(resourceId)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.locks.set(resourceId, true);
  }

  async unlock(resourceId) {
    this.locks.delete(resourceId);
  }

  async withLock(resourceId, callback) {
    try {
      await this.lock(resourceId);
      return await callback();
    } finally {
      await this.unlock(resourceId);
    }
  }
}

// 导出CRUD实例
const users = new CRUD('users');
const friends = new CRUD('friends');
const friendRequests = new CRUD('friendRequests');
const chats = new CRUD('chats');
const chatMembers = new CRUD('chatMembers');
const messages = new CRUD('messages');
const points = new CRUD('points');
const moments = new CRUD('moments');
const momentLikes = new CRUD('momentLikes');
const momentComments = new CRUD('momentComments');
// 社区功能CRUD实例
const communityPosts = new CRUD('communityPosts');
const communityComments = new CRUD('communityComments');
const communityLikes = new CRUD('communityLikes');

module.exports = {
  users,
  friends,
  friendRequests,
  chats,
  chatMembers,
  messages,
  points,
  moments,
  momentLikes,
  momentComments,
  communityPosts,
  communityComments,
  communityLikes,
  CRUD
};