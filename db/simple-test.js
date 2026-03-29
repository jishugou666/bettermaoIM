const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('='.repeat(60));
  console.log('测试 MySQL 连接');
  console.log('='.repeat(60));

  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bettermaoim'
  };

  console.log('\n配置信息:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Password: ${'*'.repeat(config.password.length)}`);
  console.log(`  Database: ${config.database}`);

  try {
    console.log('\n尝试连接...');
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    });
    console.log('✓ 连接成功！');

    console.log('\n创建数据库（如果不存在）...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✓ 数据库 ready');

    console.log('\n选择数据库...');
    await connection.execute(`USE \`${config.database}\``);
    console.log('✓ 已选择数据库');

    console.log('\n创建 users 表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        _id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nickname VARCHAR(50),
        avatar VARCHAR(500),
        status VARCHAR(20) DEFAULT 'online',
        bio TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ users 表创建成功');

    console.log('\n' + '='.repeat(60));
    console.log('连接测试通过！');
    console.log('='.repeat(60));

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ 连接失败:');
    console.error(`  错误: ${error.message}`);
    console.error(`  代码: ${error.code}`);
    console.error('\n请检查:');
    console.error('  1. MySQL 服务是否启动');
    console.error('  2. 用户名和密码是否正确');
    console.error('  3. .env 文件是否正确配置');
    process.exit(1);
  }
}

testConnection();
