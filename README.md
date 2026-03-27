# BetterMao IM

## 项目介绍

BetterMao IM 是一个基于 Node.js 和 Vue.js 的实时即时通讯应用，支持单聊、群聊、消息收发、会话管理和在线状态同步等核心功能。

### 技术栈

- **后端**：Node.js、Express、Socket.IO、SQLite3
- **前端**：Vue 3、Pinia、Vue Router、Socket.IO Client
- **数据库**：SQLite（轻量级嵌入式数据库）
- **部署**：Docker、Docker Compose、GitHub Actions

## 快速启动

### 环境要求

- **Node.js**：16.0.0 或更高版本
- **npm**：8.0.0 或更高版本
- **SQLite3**：3.0.0 或更高版本（会自动安装）

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/yourusername/bettermao-im.git
   cd bettermao-im
   ```

2. **安装依赖**
   ```bash
   npm install
   cd ui && npm install && cd ..
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，设置必要的环境变量
   ```

4. **启动应用**
   - 使用启动脚本（推荐）：
     ```bash
     # Windows
     ./start.bat
     
     # Linux/Mac
     chmod +x start.sh
     ./start.sh
     ```
   - 手动启动：
     ```bash
     # 启动后端
     npm run dev
     
     # 启动前端（在另一个终端）
     cd ui && npm run dev
     ```

5. **访问应用**
   打开浏览器访问：`http://localhost:5173`

## 目录结构

```
bettermao-im/
├── app.js             # 主应用入口
├── package.json       # 项目配置和依赖
├── start.bat          # Windows 启动脚本
├── start.sh           # Linux/Mac 启动脚本
├── config/            # 配置文件目录
│   ├── default.js     # 默认配置
│   ├── development.js # 开发环境配置
│   ├── test.js        # 测试环境配置
│   ├── production.js  # 生产环境配置
│   └── index.js       # 配置加载和验证
├── db/                # 数据库目录
│   ├── index.js       # 数据库连接和操作
│   ├── crud.js        # CRUD 操作封装
│   └── init.js        # 数据库初始化
├── biz/               # 业务逻辑目录
│   ├── auth/          # 认证模块
│   ├── user/          # 用户模块
│   ├── chat/          # 聊天模块
│   ├── friend/        # 好友模块
│   └── socket/        # Socket 处理
├── middleware/        # 中间件目录
│   ├── auth.js        # 认证中间件
│   ├── error.js       # 错误处理中间件
│   ├── logger.js      # 日志中间件
│   └── security.js    # 安全中间件
├── ui/                # 前端代码
│   ├── src/           # 源代码
│   ├── package.json   # 前端依赖
│   └── vite.config.js # Vite 配置
├── utils/             # 工具函数
├── deploy/            # 部署脚本和文档
├── logs/              # 日志目录
├── uploads/           # 上传文件目录
└── .github/           # GitHub Actions 配置
```

## 核心功能

1. **用户管理**：注册、登录、注销、个人资料管理
2. **消息收发**：单聊、群聊、消息编辑、消息撤回
3. **会话管理**：创建会话、管理会话成员、会话列表
4. **状态同步**：在线状态、消息已读状态、typing 状态
5. **好友关系**：添加好友、好友请求、好友列表

## 环境变量

| 变量名 | 描述 | 默认值 |
|-------|------|--------|
| PORT | 服务器端口 | 3000 |
| NODE_ENV | 运行环境 | development |
| JWT_SECRET | JWT 密钥 | your-secret-key-change-in-production |
| FRONTEND_URL | 前端 URL | http://localhost:5173 |

## 常见问题

### 1. 启动失败，提示端口被占用

**解决方案**：
- 检查端口占用情况：`lsof -i :3000`（Linux/Mac）或 `netstat -ano | findstr :3000`（Windows）
- 停止占用端口的进程：`kill <进程ID>`（Linux/Mac）或 `taskkill /PID <进程ID> /F`（Windows）
- 或修改 `.env` 文件中的 `PORT` 变量

### 2. 数据库初始化失败

**解决方案**：
- 检查 SQLite3 是否安装：`sqlite3 --version`
- 检查数据库目录权限：`chmod -R 755 db/`（Linux/Mac）
- 重新初始化数据库：`node db/init.js`

### 3. 前端无法连接到后端

**解决方案**：
- 检查后端服务是否运行：`http://localhost:3000/health`
- 检查 `.env` 文件中的 `FRONTEND_URL` 是否正确
- 检查 CORS 配置是否正确

## 贡献指南

1. **Fork 仓库**
2. **创建分支**：`git checkout -b feature/your-feature`
3. **提交代码**：`git commit -m "feat: add your feature"`
4. **推送到远程**：`git push origin feature/your-feature`
5. **创建 Pull Request**

## 许可证

MIT License

## 联系方式

- **项目地址**：https://github.com/yourusername/bettermao-im
- **问题反馈**：请在 GitHub 仓库提交 Issue