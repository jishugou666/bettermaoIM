const bcrypt = require('bcryptjs');
const { adminUsers } = require('./db/crud');

const DEFAULT_ADMIN = {
  username: '技术狗',
  password: 'cyccodemao1234',
  nickname: '技术狗',
  role: 'super_admin'
};

async function initAdmin() {
  try {
    console.log('开始初始化管理员账号...');
    
    // 检查是否已存在该管理员
    const existing = await adminUsers.read({ username: DEFAULT_ADMIN.username });
    if (existing.length > 0) {
      console.log(`管理员 "${DEFAULT_ADMIN.username}" 已存在，跳过创建`);
      process.exit(0);
    }
    
    // 哈希密码
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
    
    // 创建管理员
    const newAdmin = await adminUsers.create({
      username: DEFAULT_ADMIN.username,
      password: hashedPassword,
      nickname: DEFAULT_ADMIN.nickname,
      role: DEFAULT_ADMIN.role,
      createdAt: new Date(),
      createdBy: 'system'
    });
    
    console.log('✅ 管理员账号创建成功！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`用户名: ${DEFAULT_ADMIN.username}`);
    console.log(`密码: ${DEFAULT_ADMIN.password}`);
    console.log(`角色: ${DEFAULT_ADMIN.role} (站长)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化管理员失败:', error);
    process.exit(1);
  }
}

// 等待数据库初始化
setTimeout(initAdmin, 1000);
