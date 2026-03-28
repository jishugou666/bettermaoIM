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

  async read(conditions = {}, fields = '*') {
    try {
      // 使用 nedb 的 find 操作
      const docs = await db.query(this.table, conditions, fields === '*' ? {} : fields);
      return docs;
    } catch (error) {
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
const sessions = new CRUD('sessions');
const sessionMembers = new CRUD('sessionMembers');
const messages = new CRUD('messages');
const friends = new CRUD('friends');
const friendRequests = new CRUD('friendRequests');

module.exports = {
  users,
  sessions,
  sessionMembers,
  messages,
  friends,
  friendRequests,
  CRUD
};