const { adminUsers } = require('./db/crud');

async function checkAdmin() {
  try {
    const admins = await adminUsers.read({});
    console.log('管理员用户数量:', admins.length);
    
    if (admins.length > 0) {
      console.log('管理员列表:');
      admins.forEach(admin => {
        console.log(`  - 用户名: ${admin.username}, 昵称: ${admin.nickname || '无'}, 角色: ${admin.role}`);
      });
    } else {
      console.log('没有找到管理员用户！');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('检查管理员失败:', error);
    process.exit(1);
  }
}

checkAdmin();
