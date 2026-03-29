const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            data: JSON.parse(body)
          };
          resolve(response);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

const BASE_OPTIONS = {
  hostname: 'localhost',
  port: 3000,
  headers: {
    'Content-Type': 'application/json'
  }
};

async function testAdminAPI() {
  try {
    console.log('=== 开始测试 BetterMao 后台管理 API ===\n');
    
    // 1. 登录获取 Token
    console.log('1. 测试管理员登录...');
    const loginOptions = {
      ...BASE_OPTIONS,
      path: '/api/admin/login',
      method: 'POST'
    };
    const loginRes = await request(loginOptions, {
      username: '技术狗',
      password: 'cyccodemao1234'
    });
    console.log('   登录响应:', loginRes.data.success ? '成功' : '失败');
    
    if (!loginRes.data.success) {
      console.log('   登录失败，退出测试');
      return;
    }
    
    const token = loginRes.data.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    console.log('   Token 已获取\n');
    
    // 2. 测试获取数据库统计
    console.log('2. 测试获取数据库统计...');
    const statsOptions = {
      ...BASE_OPTIONS,
      path: '/api/admin/database/stats',
      method: 'GET',
      headers: authHeaders
    };
    const statsRes = await request(statsOptions);
    console.log('   数据库统计:', Object.keys(statsRes.data).length, '个表\n');
    
    // 3. 测试获取用户列表
    console.log('3. 测试获取用户列表...');
    const usersOptions = {
      ...BASE_OPTIONS,
      path: '/api/admin/users?page=1&limit=10',
      method: 'GET',
      headers: authHeaders
    };
    const usersRes = await request(usersOptions);
    console.log('   用户数量:', usersRes.data.users.length, '，总用户数:', usersRes.data.total, '\n');
    
    // 4. 测试获取私聊列表
    console.log('4. 测试获取私聊列表...');
    try {
      const chatsOptions = {
        ...BASE_OPTIONS,
        path: '/api/admin/chats/private',
        method: 'GET',
        headers: authHeaders
      };
      const chatsRes = await request(chatsOptions);
      console.log('   私聊数量:', chatsRes.data.length, '\n');
      
      // 如果有私聊，测试获取聊天记录
      if (chatsRes.data.length > 0) {
        const firstChat = chatsRes.data[0];
        console.log('5. 测试获取第一条私聊的聊天记录...');
        const messagesOptions = {
          ...BASE_OPTIONS,
          path: `/api/admin/chats/private/${firstChat._id}/messages?page=1&limit=10`,
          method: 'GET',
          headers: authHeaders
        };
        const messagesRes = await request(messagesOptions);
        console.log('   聊天记录条数:', messagesRes.data.messages.length, '，总记录数:', messagesRes.data.total, '\n');
      }
    } catch (error) {
      console.log('   获取私聊失败:', error.message, '\n');
    }
    
    // 6. 测试获取群组列表
    console.log('6. 测试获取群组列表...');
    try {
      const groupsOptions = {
        ...BASE_OPTIONS,
        path: '/api/admin/groups',
        method: 'GET',
        headers: authHeaders
      };
      const groupsRes = await request(groupsOptions);
      console.log('   群组数量:', groupsRes.data.length, '\n');
      
      // 如果有群组，测试获取群组详情
      if (groupsRes.data.length > 0) {
        const firstGroup = groupsRes.data[0];
        console.log('7. 测试获取第一个群组详情...');
        const groupDetailOptions = {
          ...BASE_OPTIONS,
          path: `/api/admin/groups/${firstGroup._id}`,
          method: 'GET',
          headers: authHeaders
        };
        const groupDetailRes = await request(groupDetailOptions);
        console.log('   群组成员数:', groupDetailRes.data.members?.length || 0, '\n');
      }
    } catch (error) {
      console.log('   获取群组失败:', error.message, '\n');
    }
    
    // 8. 测试获取朋友圈列表
    console.log('8. 测试获取朋友圈列表...');
    try {
      const momentsOptions = {
        ...BASE_OPTIONS,
        path: '/api/admin/moments?page=1&limit=10',
        method: 'GET',
        headers: authHeaders
      };
      const momentsRes = await request(momentsOptions);
      console.log('   朋友圈数量:', momentsRes.data.moments.length, '，总数量:', momentsRes.data.total, '\n');
      
      // 如果有朋友圈，测试获取详情
      if (momentsRes.data.moments.length > 0) {
        const firstMoment = momentsRes.data.moments[0];
        console.log('9. 测试获取第一条朋友圈详情...');
        const momentDetailOptions = {
          ...BASE_OPTIONS,
          path: `/api/admin/moments/${firstMoment._id}?commentPage=1&commentLimit=10`,
          method: 'GET',
          headers: authHeaders
        };
        const momentDetailRes = await request(momentDetailOptions);
        console.log('   评论数量:', momentDetailRes.data.comments?.length || 0, '\n');
      }
    } catch (error) {
      console.log('   获取朋友圈失败:', error.message, '\n');
    }
    
    // 10. 测试获取帖子列表
    console.log('10. 测试获取帖子列表...');
    try {
      const postsOptions = {
        ...BASE_OPTIONS,
        path: '/api/admin/posts?page=1&limit=10',
        method: 'GET',
        headers: authHeaders
      };
      const postsRes = await request(postsOptions);
      console.log('    帖子数量:', postsRes.data.posts.length, '，总数量:', postsRes.data.total, '\n');
      
      // 如果有帖子，测试获取详情
      if (postsRes.data.posts.length > 0) {
        const firstPost = postsRes.data.posts[0];
        console.log('11. 测试获取第一条帖子详情...');
        const postDetailOptions = {
          ...BASE_OPTIONS,
          path: `/api/admin/posts/${firstPost._id}?commentPage=1&commentLimit=10`,
          method: 'GET',
          headers: authHeaders
        };
        const postDetailRes = await request(postDetailOptions);
        console.log('    评论数量:', postDetailRes.data.comments?.length || 0, '\n');
      }
    } catch (error) {
      console.log('    获取帖子失败:', error.message, '\n');
    }
    
    console.log('=== 测试完成 ===');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    process.exit(1);
  }
}

testAdminAPI();
