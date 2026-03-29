const mysql = require('mysql2/promise');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');

class DatabaseManager {
  constructor() {
    this.pool = null;
    this.datastores = {};
    this.init();
  }

  init() {
    try {
      // 创建 MySQL 连接池
      const mysqlConfig = config.database.mysql;
      this.pool = mysql.createPool({
        host: mysqlConfig.host,
        port: mysqlConfig.port,
        user: mysqlConfig.user,
        password: mysqlConfig.password,
        database: mysqlConfig.database,
        connectionLimit: mysqlConfig.connectionLimit,
        waitForConnections: mysqlConfig.waitForConnections,
        queueLimit: mysqlConfig.queueLimit,
        charset: 'utf8mb4'
      });

      console.log('MySQL Database connected successfully');
    } catch (error) {
      console.error('MySQL Database initialization error:', error);
      throw error;
    }
  }

  // 获取连接
  async getConnection() {
    return await this.pool.getConnection();
  }

  // 执行 SQL 查询
  async executeSql(sql, params = []) {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('[DatabaseManager.executeSql] SQL执行失败:', sql, params, error);
      throw error;
    }
  }

  // 构建 WHERE 条件
  buildWhereClause(conditions) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return { clause: '', params: [] };
    }

    const clauses = [];
    const params = [];

    for (const [key, value] of Object.entries(conditions)) {
      if (value === null) {
        clauses.push(`${key} IS NULL`);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // 处理操作符，如 $in, $gt 等
        const opKeys = Object.keys(value);
        for (const op of opKeys) {
          if (op === '$in' && Array.isArray(value[op])) {
            const placeholders = value[op].map(() => '?').join(',');
            clauses.push(`${key} IN (${placeholders})`);
            params.push(...value[op]);
          } else if (op === '$gt') {
            clauses.push(`${key} > ?`);
            params.push(value[op]);
          } else if (op === '$gte') {
            clauses.push(`${key} >= ?`);
            params.push(value[op]);
          } else if (op === '$lt') {
            clauses.push(`${key} < ?`);
            params.push(value[op]);
          } else if (op === '$lte') {
            clauses.push(`${key} <= ?`);
            params.push(value[op]);
          } else if (op === '$ne') {
            clauses.push(`${key} != ?`);
            params.push(value[op]);
          }
        }
      } else if (Array.isArray(value)) {
        const placeholders = value.map(() => '?').join(',');
        clauses.push(`${key} IN (${placeholders})`);
        params.push(...value);
      } else {
        clauses.push(`${key} = ?`);
        params.push(value);
      }
    }

    return {
      clause: ' WHERE ' + clauses.join(' AND '),
      params
    };
  }

  // 通用执行方法 - 保持与 NeDB 接口兼容
  async execute(collection, operation, query, data) {
    try {
      switch (operation) {
        case 'insert':
          console.log(`[DatabaseManager.execute] 插入数据到 ${collection}:`, data);
          // 确保有 _id
          if (!data._id) {
            data._id = uuidv4();
          }
          const columns = Object.keys(data);
          const values = Object.values(data);
          const placeholders = columns.map(() => '?').join(',');
          const sql = `INSERT INTO ${collection} (${columns.join(',')}) VALUES (${placeholders})`;
          await this.executeSql(sql, values);
          console.log(`[DatabaseManager.execute] 插入结果:`, data);
          return { lastID: data._id, _id: data._id, ...data };

        case 'update':
          // 处理 $set 操作符
          const updateData = data && data.$set ? data.$set : data;
          const setClauses = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
          const { clause: whereClause, params: whereParams } = this.buildWhereClause(query);
          const updateSql = `UPDATE ${collection} SET ${setClauses}${whereClause}`;
          const updateParams = [...Object.values(updateData), ...whereParams];
          const [updateResult] = await this.pool.execute(updateSql, updateParams);
          return { changes: updateResult.affectedRows };

        case 'remove':
          const { clause: removeWhere, params: removeParams } = this.buildWhereClause(query);
          const removeSql = `DELETE FROM ${collection}${removeWhere}`;
          const [removeResult] = await this.pool.execute(removeSql, removeParams);
          return { changes: removeResult.affectedRows };

        default:
          throw new Error('Invalid operation');
      }
    } catch (error) {
      console.error('[DatabaseManager.execute] 操作失败:', error);
      throw error;
    }
  }

  // 查询方法 - 保持与 NeDB 接口兼容
  async query(collection, query, projection) {
    try {
      if (!collection || typeof collection !== 'string') {
        throw new Error('Collection name must be a non-empty string');
      }

      if (!query || typeof query !== 'object') {
        console.warn('[DatabaseManager.query] 无效的查询条件，使用空对象');
        query = {};
      }

      const selectFields = projection ? Object.keys(projection).join(',') : '*';
      const { clause: whereClause, params } = this.buildWhereClause(query);
      const sql = `SELECT ${selectFields} FROM ${collection}${whereClause}`;
      
      const docs = await this.executeSql(sql, params);
      
      if (!Array.isArray(docs)) {
        console.warn('[DatabaseManager.query] 查询返回非数组类型:', typeof docs);
        return [];
      }
      
      return docs;
    } catch (error) {
      console.error('[DatabaseManager.query] 查询失败:', error);
      throw error;
    }
  }

  // 获取查询游标（支持链式操作）- 保持兼容性
  async queryCursor(collection, query, projection) {
    try {
      if (!collection || typeof collection !== 'string') {
        throw new Error('Collection name must be a non-empty string');
      }

      if (!query || typeof query !== 'object') {
        console.warn('[DatabaseManager.queryCursor] 无效的查询条件，使用空对象');
        query = {};
      }

      // 返回一个模拟的游标对象，实际执行查询
      const self = this;
      return {
        sort: function(sortObj) {
          this._sort = sortObj;
          return this;
        },
        skip: function(skipVal) {
          this._skip = skipVal;
          return this;
        },
        limit: function(limitVal) {
          this._limit = limitVal;
          return this;
        },
        exec: async function() {
          const selectFields = projection ? Object.keys(projection).join(',') : '*';
          const { clause: whereClause, params } = self.buildWhereClause(query);
          
          let sql = `SELECT ${selectFields} FROM ${collection}${whereClause}`;
          
          if (this._sort) {
            const sortClauses = [];
            for (const [key, direction] of Object.entries(this._sort)) {
              sortClauses.push(`${key} ${direction === 1 ? 'ASC' : 'DESC'}`);
            }
            sql += ` ORDER BY ${sortClauses.join(', ')}`;
          }
          
          if (this._limit) {
            if (this._skip) {
              sql += ` LIMIT ${parseInt(this._skip, 10)}, ${parseInt(this._limit, 10)}`;
            } else {
              sql += ` LIMIT ${parseInt(this._limit, 10)}`;
            }
          }
          
          return await self.executeSql(sql, params);
        }
      };
    } catch (error) {
      console.error('[DatabaseManager.queryCursor] 查询失败:', error);
      throw error;
    }
  }

  // 获取单个文档 - 保持与 NeDB 接口兼容
  async get(collection, query, projection) {
    try {
      const selectFields = projection ? Object.keys(projection).join(',') : '*';
      const { clause: whereClause, params } = this.buildWhereClause(query);
      const sql = `SELECT ${selectFields} FROM ${collection}${whereClause} LIMIT 1`;
      
      const docs = await this.executeSql(sql, params);
      return docs.length > 0 ? docs[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // 备份方法
  backup() {
    const backupPath = `./db/mysql_backup_${Date.now()}.sql`;
    console.log(`Backup would be created at: ${backupPath}`);
    return backupPath;
  }

  // 关闭方法
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('MySQL Database closed successfully');
    }
  }

  // 兼容性方法：执行原生 SQL 查询
  async query(sql, params = []) {
    try {
      const [rows] = await this.pool.execute(sql, params);
      // 字段名兼容性处理：id -> _id, user_id -> userId, etc.
      return rows.map(row => this.normalizeRow(row));
    } catch (error) {
      console.error('[DatabaseManager.query] SQL执行失败:', sql, params, error);
      throw error;
    }
  }

  // 兼容性方法：执行原生 SQL 写操作
  async execute(sql, params = []) {
    try {
      const [result] = await this.pool.execute(sql, params);
      return result;
    } catch (error) {
      console.error('[DatabaseManager.execute] SQL执行失败:', sql, params, error);
      throw error;
    }
  }

  // 兼容性方法：获取单条记录
  async get(sql, params = []) {
    try {
      const [rows] = await this.pool.execute(sql, params);
      if (rows.length > 0) {
        return this.normalizeRow(rows[0]);
      }
      return null;
    } catch (error) {
      console.error('[DatabaseManager.get] SQL执行失败:', sql, params, error);
      throw error;
    }
  }

  // 字段名标准化：处理 snake_case 到 camelCase，以及 id -> _id
  normalizeRow(row) {
    if (!row) return row;
    const normalized = {};
    for (const [key, value] of Object.entries(row)) {
      // 将 id 转换为 _id
      if (key === 'id') {
        normalized._id = value;
      }
      // 将 snake_case 转换为 camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      normalized[camelKey] = value;
      // 同时保留原始键名
      normalized[key] = value;
    }
    return normalized;
  }
}

module.exports = new DatabaseManager();
