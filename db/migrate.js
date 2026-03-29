const Datastore = require('nedb-promises');
const mysql = require('mysql2/promise');
const path = require('path');
const config = require('../config');

const collections = [
  'users',
  'friends',
  'friendRequests',
  'chats',
  'chatMembers',
  'messages',
  'points',
  'moments',
  'momentLikes',
  'momentComments',
  'communityPosts',
  'communityComments',
  'communityLikes',
  'adminUsers'
];

async function migrateCollection(pool, collectionName, nedbPath) {
  console.log(`\n开始迁移集合: ${collectionName}`);
  
  // 加载 NeDB 数据
  const nedb = Datastore.create({
    filename: nedbPath,
    autoload: true
  });
  
  const docs = await nedb.find({});
  console.log(`从 NeDB 读取了 ${docs.length} 条记录`);
  
  if (docs.length === 0) {
    console.log(`集合 ${collectionName} 没有数据，跳过`);
    return;
  }
  
  let successCount = 0;
  let failCount = 0;
  
  for (const doc of docs) {
    try {
      // 处理 JSON 字段
      const processedDoc = {};
      for (const [key, value] of Object.entries(doc)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          processedDoc[key] = JSON.stringify(value);
        } else if (Array.isArray(value)) {
          processedDoc[key] = JSON.stringify(value);
        } else {
          processedDoc[key] = value;
        }
      }
      
      const columns = Object.keys(processedDoc);
      const values = Object.values(processedDoc);
      const placeholders = columns.map(() => '?').join(',');
      
      const sql = `INSERT INTO ${collectionName} (${columns.join(',')}) VALUES (${placeholders})`;
      await pool.execute(sql, values);
      
      successCount++;
    } catch (error) {
      console.error(`迁移记录失败 (ID: ${doc._id}):`, error.message);
      failCount++;
    }
  }
  
  console.log(`集合 ${collectionName} 迁移完成: 成功 ${successCount}, 失败 ${failCount}`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('BetterMao IM 数据迁移工具 - 从 NeDB 到 MySQL');
  console.log('='.repeat(60));
  
  let pool = null;
  
  try {
    // 连接 MySQL
    const mysqlConfig = config.database.mysql;
    pool = mysql.createPool({
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      user: mysqlConfig.user,
      password: mysqlConfig.password,
      database: mysqlConfig.database,
      connectionLimit: 5,
      charset: 'utf8mb4'
    });
    
    console.log('\n成功连接到 MySQL 数据库');
    
    // 迁移所有集合
    for (const collection of collections) {
      const nedbPath = path.join(__dirname, `${collection}.db`);
      await migrateCollection(pool, collection, nedbPath);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('数据迁移完成！');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n迁移过程中发生错误:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

main();
