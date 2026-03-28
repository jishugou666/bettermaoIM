# BetterMao IM 登录API测试用例文档

## 测试范围
- 登录API端点测试
- 注册API端点测试
- Token生成与验证测试
- 错误处理测试
- 前后端通信测试

## 测试环境
- 服务器地址: http://localhost:3000
- API端点: /api/auth/login
- 数据库: NeDB
- Node版本: >=16.0.0

---

## 一、正常流程测试用例

### TC-AUTH-001: 使用用户名正常登录
**测试目标**: 验证用户可以使用用户名和密码成功登录

**前置条件**:
- 数据库中存在测试用户
- 用户名: testuser
- 密码: Test123456

**测试步骤**:
1. 发送POST请求到 /api/auth/login
2. 请求体: {"identifier": "testuser", "password": "Test123456"}
3. 验证响应状态码为200
4. 验证响应包含token字段
5. 验证响应包含user字段
6. 验证user对象不包含password字段

**预期结果**:
- 状态码: 200
- 响应格式: {"user": {...}, "token": "jwt_token_string"}
- token为有效的JWT字符串
- user对象包含必要字段(username, email, _id等)
- user对象不包含password字段

**优先级**: 高

---

### TC-AUTH-002: 使用邮箱正常登录
**测试目标**: 验证用户可以使用邮箱和密码成功登录

**前置条件**:
- 数据库中存在测试用户
- 邮箱: test@example.com
- 密码: Test123456

**测试步骤**:
1. 发送POST请求到 /api/auth/login
2. 请求体: {"identifier": "test@example.com", "password": "Test123456"}
3. 验证响应状态码为200
4. 验证响应包含token和user字段

**预期结果**:
- 状态码: 200
- 成功返回token和user信息
- Token可以用于后续API调用

**优先级**: 高

---

### TC-AUTH-003: 正常用户注册
**测试目标**: 验证新用户可以成功注册

**前置条件**:
- 用户名和邮箱未被注册

**测试步骤**:
1. 发送POST请求到 /api/auth/register
2. 请求体: {"username": "newuser", "email": "newuser@example.com", "password": "NewUser123"}
3. 验证响应状态码为201
4. 验证响应包含user字段
5. 验证数据库中创建了新用户记录

**预期结果**:
- 状态码: 201
- 响应格式: {"user": {...}}
- user对象包含username, email, nickname等字段
- 密码已加密存储
- 默认角色为'user'

**优先级**: 高

---

### TC-AUTH-004: Token验证成功
**测试目标**: 验证有效Token可以访问受保护的API

**前置条件**:
- 已获取有效Token

**测试步骤**:
1. 发送GET请求到 /api/auth/profile
2. Header: Authorization: Bearer {valid_token}
3. 验证响应状态码为200
4. 验证返回用户信息

**预期结果**:
- 状态码: 200
- 返回当前用户详细信息
- 不包含密码字段

**优先级**: 高

---

### TC-AUTH-005: 用户登出
**测试目标**: 验证用户可以成功登出

**前置条件**:
- 用户已登录
- 拥有有效Token

**测试步骤**:
1. 发送POST请求到 /api/auth/logout
2. Header: Authorization: Bearer {valid_token}
3. 验证响应状态码为200
4. 验证用户状态更新为offline

**预期结果**:
- 状态码: 200
- 响应: {"message": "Logged out successfully"}
- 用户状态在数据库中更新为offline

**优先级**: 中

---

## 二、异常流程测试用例

### TC-AUTH-ERR-001: 用户名不存在
**测试目标**: 验证使用不存在的用户名登录时的错误处理

**测试步骤**:
1. 发送POST请求到 /api/auth/login
2. 请求体: {"identifier": "nonexistent", "password": "Test123456"}

**预期结果**:
- 状态码: 401
- 响应: {"error": "Invalid username/email or password"}
- 不泄露用户是否存在的信息

**优先级**: 高

---

### TC-AUTH-ERR-002: 密码错误
**测试目标**: 验证密码错误时的错误处理

**前置条件**:
- 用户存在

**测试步骤**:
1. 发送POST请求到 /api/auth/login
2. 请求体: {"identifier": "testuser", "password": "WrongPassword"}

**预期结果**:
- 状态码: 401
- 响应: {"error": "Invalid username/email or password"}

**优先级**: 高

---

### TC-AUTH-ERR-003: 缺少必填字段(identifier)
**测试目标**: 验证缺少identifier字段时的错误处理

**测试步骤**:
1. 发送POST请求到 /api/auth/login
2. 请求体: {"password": "Test123456"}

**预期结果**:
- 状态码: 400
- 响应: {"error": "Missing required fields"}

**优先级**: 高

---

### TC-AUTH-ERR-004: 缺少必填字段(password)
**测试目标**: 验证缺少password字段时的错误处理

**测试步骤**:
1. 发送POST请求到 /api/auth/login
2. 请求体: {"identifier": "testuser"}

**预期结果**:
- 状态码: 400
- 响应: {"error": "Missing required fields"}

**优先级**: 高

---

### TC-AUTH-ERR-005: 空请求体
**测试目标**: 验证空请求体时的错误处理

**测试步骤**:
1. 发送POST请求到 /api/auth/login
2. 请求体: {}

**预期结果**:
- 状态码: 400
- 响应: {"error": "Missing required fields"}

**优先级**: 高

---

### TC-AUTH-ERR-006: 用户名已存在注册
**测试目标**: 验证使用已存在用户名注册时的错误处理

**前置条件**:
- 用户名testuser已存在

**测试步骤**:
1. 发送POST请求到 /api/auth/register
2. 请求体: {"username": "testuser", "email": "new@example.com", "password": "Test123"}

**预期结果**:
- 状态码: 400
- 响应: {"error": "用户名已存在"}

**优先级**: 高

---

### TC-AUTH-ERR-007: 邮箱已存在注册
**测试目标**: 验证使用已存在邮箱注册时的错误处理

**前置条件**:
- 邮箱test@example.com已存在

**测试步骤**:
1. 发送POST请求到 /api/auth/register
2. 请求体: {"username": "newuser", "email": "test@example.com", "password": "Test123"}

**预期结果**:
- 状态码: 400
- 响应: {"error": "邮箱已被注册,请更换邮箱"}

**优先级**: 高

---

### TC-AUTH-ERR-008: Token无效
**测试目标**: 验证无效Token访问受保护API时的错误处理

**测试步骤**:
1. 发送GET请求到 /api/auth/profile
2. Header: Authorization: Bearer invalid_token_string

**预期结果**:
- 状态码: 401
- 响应: {"error": "Invalid token"}

**优先级**: 高

---

### TC-AUTH-ERR-009: Token缺失
**测试目标**: 验证无Token访问受保护API时的错误处理

**测试步骤**:
1. 发送GET请求到 /api/auth/profile
2. 不提供Authorization header

**预期结果**:
- 状态码: 401
- 响应: {"error": "No token provided"}

**优先级**: 高

---

### TC-AUTH-ERR-010: Token过期
**测试目标**: 验证过期Token访问受保护API时的错误处理

**前置条件**:
- Token已过期(24小时后)

**测试步骤**:
1. 发送GET请求到 /api/auth/profile
2. Header: Authorization: Bearer {expired_token}

**预期结果**:
- 状态码: 401
- 响应: {"error": "Invalid token"}

**优先级**: 中

---

## 三、边界值测试用例

### TC-AUTH-BOUND-001: 用户名最小长度
**测试目标**: 验证用户名最小长度限制

**测试步骤**:
1. 发送POST请求到 /api/auth/register
2. 请求体: {"username": "a", "email": "test@example.com", "password": "Test123"}

**预期结果**:
- 根据实际业务规则验证是否允许
- 如不允许,应返回相应错误信息

**优先级**: 中

---

### TC-AUTH-BOUND-002: 用户名最大长度
**测试目标**: 验证用户名最大长度限制

**测试步骤**:
1. 发送POST请求到 /api/auth/register
2. 请求体: {"username": "a"*256, "email": "test@example.com", "password": "Test123"}

**预期结果**:
- 应有长度限制
- 超过限制应返回错误

**优先级**: 中

---

### TC-AUTH-BOUND-003: 密码最小长度
**测试目标**: 验证密码最小长度限制

**测试步骤**:
1. 发送POST请求到 /api/auth/register
2. 请求体: {"username": "testuser", "email": "test@example.com", "password": "123"}

**预期结果**:
- 应有最小密码长度要求
- 过短密码应返回错误

**优先级**: 中

---

### TC-AUTH-BOUND-004: 密码最大长度
**测试目标**: 验证密码最大长度限制

**测试步骤**:
1. 发送POST请求到 /api/auth/register
2. 请求体: {"username": "testuser", "email": "test@example.com", "password": "a"*1000}

**预期结果**:
- 应有长度限制
- 超过限制应返回错误或截断

**优先级**: 低

---

### TC-AUTH-BOUND-005: 邮箱格式验证
**测试目标**: 验证邮箱格式验证

**测试步骤**:
1. 发送POST请求到 /api/auth/register
2. 请求体: {"username": "testuser", "email": "invalid-email", "password": "Test123"}

**预期结果**:
- 状态码: 400
- 返回邮箱格式错误信息

**优先级**: 高

---

### TC-AUTH-BOUND-006: 特殊字符用户名
**测试目标**: 验证用户名中特殊字符的处理

**测试步骤**:
1. 发送POST请求到 /api/auth/register
2. 请求体包含特殊字符: {"username": "test@user#$%", "email": "test@example.com", "password": "Test123"}

**预期结果**:
- 根据业务规则验证
- 应有明确的字符限制规则

**优先级**: 中

---

### TC-AUTH-BOUND-007: SQL注入测试
**测试目标**: 验证对SQL注入的防护

**测试步骤**:
1. 发送POST请求到 /api/auth/login
2. 请求体: {"identifier": "admin'--", "password": "anything"}

**预期结果**:
- 应正常处理为普通字符串
- 不应导致数据库错误或注入成功
- 返回正常的认证失败信息

**优先级**: 高

---

### TC-AUTH-BOUND-008: XSS攻击测试
**测试目标**: 验证对XSS攻击的防护

**测试步骤**:
1. 发送POST请求到 /api/auth/register
2. 请求体: {"username": "<script>alert('xss')</script>", "email": "test@example.com", "password": "Test123"}

**预期结果**:
- 应转义或拒绝特殊字符
- 不应执行脚本代码

**优先级**: 高

---

### TC-AUTH-BOUND-009: 并发登录测试
**测试目标**: 验证同一用户并发登录的处理

**测试步骤**:
1. 同时发送多个登录请求(10个并发)
2. 使用相同的用户名和密码

**预期结果**:
- 所有请求都应正常处理
- 每个请求返回不同的Token
- 不应出现竞态条件或数据错误

**优先级**: 中

---

### TC-AUTH-BOUND-010: 速率限制测试
**测试目标**: 验证API速率限制功能

**测试步骤**:
1. 在短时间内发送大量登录请求(超过100次/15分钟)
2. 观察服务器响应

**预期结果**:
- 超过限制后应返回429状态码
- 应有明确的错误提示
- 速率限制应在15分钟后重置

**优先级**: 中

---

## 四、安全性测试用例

### TC-AUTH-SEC-001: 密码加密验证
**测试目标**: 验证密码使用bcrypt加密存储

**测试步骤**:
1. 注册新用户
2. 直接查询数据库
3. 检查password字段

**预期结果**:
- 密码应为bcrypt哈希值
- 格式: $2a$10$...
- 不应存储明文密码

**优先级**: 高

---

### TC-AUTH-SEC-002: JWT签名验证
**测试目标**: 验证JWT使用正确密钥签名

**测试步骤**:
1. 登录获取Token
2. 使用JWT库解码Token
3. 验证签名算法和密钥

**预期结果**:
- Token应使用HS256算法
- 应使用配置的JWT_SECRET签名
- Token包含正确的payload(userId, username)

**优先级**: 高

---

### TC-AUTH-SEC-003: 密码比较时序攻击防护
**测试目标**: 验证bcrypt.compare防止时序攻击

**测试步骤**:
1. 使用错误密码登录多次
2. 记录每次响应时间
3. 使用正确密码登录
4. 比较响应时间差异

**预期结果**:
- 错误密码和正确密码的验证时间应相近
- bcrypt.compare应使用恒定时间比较

**优先级**: 中

---

## 五、前后端集成测试用例

### TC-AUTH-INT-001: 前端登录表单提交
**测试目标**: 验证前端登录表单与后端API的集成

**测试步骤**:
1. 在前端登录页面输入用户名和密码
2. 点击登录按钮
3. 观察网络请求和响应
4. 验证Token存储到localStorage
5. 验证页面跳转

**预期结果**:
- 发送正确的API请求
- Token成功存储
- 用户信息存储到Pinia store
- 页面跳转到首页

**优先级**: 高

---

### TC-AUTH-INT-002: 前端错误提示显示
**测试目标**: 验证前端正确显示后端错误信息

**测试步骤**:
1. 输入错误的用户名或密码
2. 点击登录按钮
3. 观察错误提示

**预期结果**:
- 前端显示后端返回的错误信息
- 错误信息清晰易懂
- 不应暴露敏感信息

**优先级**: 高

---

### TC-AUTH-INT-003: Token自动附加到请求
**测试目标**: 验证前端自动将Token附加到API请求

**测试步骤**:
1. 用户登录成功
2. 调用需要认证的API
3. 检查请求header

**预期结果**:
- Authorization header自动附加
- 格式: Bearer {token}
- 后端成功验证Token

**优先级**: 高

---

## 测试数据准备

### 测试用户数据
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test123456",
  "nickname": "Test User"
}
```

### 测试管理员数据
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "Admin123456",
  "role": "admin"
}
```

---

## 测试工具
- Postman / Insomnia: API测试
- Jest: 单元测试
- Supertest: 集成测试
- Chrome DevTools: 前端调试
- MongoDB Compass: 数据库查看

---

## 测试执行顺序
1. 执行静态代码分析
2. 准备测试数据
3. 执行正常流程测试
4. 执行异常流程测试
5. 执行边界值测试
6. 执行安全性测试
7. 执行前后端集成测试
8. 记录测试结果
9. 生成测试报告

---

## 缺陷等级定义
- **Critical**: 系统崩溃、数据丢失、安全漏洞
- **Major**: 功能无法使用、错误结果
- **Minor**: UI问题、提示不友好
- **Enhancement**: 改进建议

---

## 测试完成标准
- 所有高优先级测试用例通过
- 无Critical和Major级别缺陷
- 代码覆盖率 >= 80%
- 所有API响应时间 < 500ms
- 安全测试全部通过
