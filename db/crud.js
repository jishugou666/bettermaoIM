const db = require('./index');

class CRUD {
  constructor(table) {
    this.table = table;
    this.locks = new Map();
  }

  async create(data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, index) => `?`).join(', ');
    
    const sql = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${placeholders})`;
    return await db.execute(sql, values);
  }

  async read(conditions = {}, fields = '*') {
    const whereClause = Object.keys(conditions).length > 0 
      ? 'WHERE ' + Object.keys(conditions).map(key => `${key} = ?`).join(' AND ')
      : '';
    
    const sql = `SELECT ${fields} FROM ${this.table} ${whereClause}`;
    const params = Object.values(conditions);
    
    return await db.query(sql, params);
  }

  async update(conditions, data) {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
    
    const sql = `UPDATE ${this.table} SET ${setClause} WHERE ${whereClause}`;
    const params = [...Object.values(data), ...Object.values(conditions)];
    
    return await db.execute(sql, params);
  }

  async delete(conditions) {
    const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
    const sql = `DELETE FROM ${this.table} WHERE ${whereClause}`;
    const params = Object.values(conditions);
    
    return await db.execute(sql, params);
  }

  async getById(id) {
    const sql = `SELECT * FROM ${this.table} WHERE id = ?`;
    return await db.get(sql, [id]);
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
const sessionMembers = new CRUD('session_members');
const messages = new CRUD('messages');

module.exports = {
  users,
  sessions,
  sessionMembers,
  messages,
  CRUD
};