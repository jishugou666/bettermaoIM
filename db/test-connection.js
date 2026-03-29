const db = require('./index');
const config = require('../config');

async function testDatabaseConnection() {
  console.log('='.repeat(60));
  console.log('测试 MySQL 数据库连接');
  console.log('='.repeat(60));
  
  console.log('\n配置信息:');
  console.log(`  Host: ${config.database.mysql.host}`);
  console.log(`  Port: ${config.database.mysql.port}`);
  console.log(`  User: ${config.database.mysql.user}`);
  console.log(`  Database: ${config.database.mysql.database}`);
  
  try {
    console.log('\n1. 测试基本连接...');
    const connection = await db.getConnection();
    console.log('   ✓ 连接成功');
    connection.release();
    
    console.log('\n2. 测试查询...');
    const result = await db.executeSql('SELECT 1 + 1 AS solution');
    console.log(`   ✓ 查询成功，结果: ${result[0].solution}`);
    
    console.log('\n3. 检查表是否存在...');
    const tables = await db.executeSql(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [config.database.mysql.database]);
    
    console.log(`   ✓ 数据库中共有 ${tables.length} 个表`);
    if (tables.length > 0) {
      console.log('   表列表:');
      tables.forEach(table => {
        console.log(`     - ${table.TABLE_NAME}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('所有测试通过！数据库连接正常。');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 测试失败:');
    console.error(`  错误信息: ${error.message}`);
    console.error('\n提示:');
    console.error('  1. 请确保 MySQL 服务已启动');
    console.error('  2. 请检查 .env 文件中的数据库配置');
    console.error('  3. 请确保数据库 "bettermao" 已创建');
    console.error('  4. 可执行: mysql -u root -p < db/schema.sql');
    process.exit(1);
  }
}

testDatabaseConnection();
