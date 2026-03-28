const DatabaseManager = require('./db/index');

async function addRoleField() {
  try {
    console.log('开始为所有用户添加role字段...');
    
    // 查询所有用户
    const allUsers = await DatabaseManager.query('users', {});
    console.log(`找到 ${allUsers.length} 个用户`);
    
    // 为每个用户添加role字段
    for (const user of allUsers) {
      if (!user.role) {
        // 默认角色为user
        let role = 'user';
        
        // 为特定用户设置为admin
        if (user._id === 'Cb69OymuG0GshrDM' || user.username === '技术狗') {
          role = 'admin';
        }
        
        // 更新用户
        await DatabaseManager.execute('users', 'update', { _id: user._id }, { $set: { role } });
        console.log(`用户 ${user.username} (${user._id}) 已设置角色为: ${role}`);
      } else {
        console.log(`用户 ${user.username} (${user._id}) 已有角色: ${user.role}`);
      }
    }
    
    // 验证更新
    console.log('\n验证更新结果:');
    const updatedUsers = await DatabaseManager.query('users', {});
    updatedUsers.forEach(user => {
      console.log(`  ${user.username}: role = ${user.role || '未设置'}`);
    });
    
    console.log('\n所有用户角色设置完成！');
    process.exit(0);
  } catch (error) {
    console.error('操作失败:', error);
    process.exit(1);
  }
}

addRoleField();
