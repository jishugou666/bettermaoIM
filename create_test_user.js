const Datastore = require('nedb-promises');
const path = require('path');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    console.log('创建测试用户...');
    
    // 创建用户数据存储
    const usersDb = Datastore.create({
      filename: path.join(__dirname, 'db', 'users.db'),
      autoload: true
    });
    
    // 检查用户是否已存在
    const existingUser = await usersDb.findOne({ username: 'testuser' });
    if (existingUser) {
      console.log('测试用户已存在:');
      console.log('用户名: testuser');
      console.log('邮箱:', existingUser.email);
      console.log('用户ID:', existingUser._id);
      return;
    }
    
    // 创建测试用户
    const hashedPassword = await bcrypt.hash('test123456', 10);
    const newUser = {
      username: 'testuser',
      email: 'testuser@example.com',
      password: hashedPassword,
      nickname: '测试用户',
      avatar: null,
      signature: '这是一个测试用户',
      gender: 'unknown',
      birthday: null,
      bio: '',
      location: '',
      tags: [],
      points: 0,
      role: 'user',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    };
    
    const result = await usersDb.insert(newUser);
    console.log('测试用户创建成功:');
    console.log('用户名: testuser');
    console.log('密码: test123456');
    console.log('邮箱: testuser@example.com');
    console.log('用户ID:', result._id);
    
  } catch (error) {
    console.error('创建测试用户失败:', error);
  }
  
  process.exit(0);
}

createTestUser();
