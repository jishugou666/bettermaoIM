# BetterMao IM 安装指南

## 环境要求

### 硬件要求
- **CPU**：至少 1 核
- **内存**：至少 1GB
- **存储空间**：至少 10GB

### 软件要求
- **Node.js**：16.0.0 或更高版本
- **npm**：8.0.0 或更高版本
- **SQLite3**：3.0.0 或更高版本（会自动安装）
- **Git**：2.0.0 或更高版本（用于克隆仓库）

## 安装步骤

### 步骤 1：安装 Node.js

#### Windows
1. 访问 [Node.js 官网](https://nodejs.org/zh-cn/download/)
2. 下载并安装 Node.js 16.x 或更高版本
3. 验证安装：
   ```cmd
   node -v
   npm -v
   ```

#### Linux
1. 使用 nvm 安装 Node.js：
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
   nvm install 16
   nvm use 16
   ```
2. 验证安装：
   ```bash
   node -v
   npm -v
   ```

#### macOS
1. 使用 Homebrew 安装 Node.js：
   ```bash
   brew install node@16
   ```
2. 验证安装：
   ```bash
   node -v
   npm -v
   ```

### 步骤 2：克隆仓库

```bash
git clone https://github.com/yourusername/bettermao-im.git
cd bettermao-im
```

### 步骤 3：安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd ui
npm install
cd ..
```

### 步骤 4：配置环境变量

1. **复制环境变量模板**：
   ```bash
   cp .env.example .env
   ```

2. **编辑 .env 文件**：
   ```bash
   # 服务器配置
   PORT=3000
   NODE_ENV=development
   
   # 前端 URL
   FRONTEND_URL=http://localhost:5173
   
   # JWT 密钥（生产环境请修改）
   JWT_SECRET=your-secret-key-change-in-production
   ```

### 步骤 5：初始化数据库

```bash
node db/init.js
```

### 步骤 6：构建前端

```bash
cd ui
npm run build
cd ..
```

## 多环境启动命令

### 开发环境

```bash
# 启动后端开发服务器
npm run dev

# 启动前端开发服务器（在另一个终端）
cd ui
npm run dev
```

### 生产环境

```bash
# 构建前端
npm run build

# 启动生产服务器
npm run start:prod
```

### 测试环境

```bash
# 设置测试环境变量
NODE_ENV=test npm run start
```

## 使用启动脚本

### Windows

```cmd
./start.bat
```

### Linux/Mac

```bash
chmod +x start.sh
./start.sh
```

启动脚本会自动：
1. 检查 Node.js 版本
2. 加载环境变量
3. 启动后端服务
4. 启动前端服务
5. 打开浏览器访问应用

## 验证安装

1. **检查服务状态**：
   - 后端服务：`http://localhost:3000/health`
   - 前端服务：`http://localhost:5173`

2. **测试登录**：
   - 默认账号：admin
   - 默认密码：123456

## 常见问题

### 1. 依赖安装失败

**解决方案**：
- 检查网络连接
- 清理 npm 缓存：`npm cache clean --force`
- 重新安装依赖：`npm install`

### 2. 端口被占用

**解决方案**：
- 停止占用端口的进程
- 修改 `.env` 文件中的 `PORT` 变量

### 3. 数据库初始化失败

**解决方案**：
- 检查 SQLite3 是否安装
- 检查数据库目录权限
- 重新初始化数据库：`node db/init.js`

### 4. 前端无法访问后端 API

**解决方案**：
- 检查后端服务是否运行
- 检查 `.env` 文件中的 `FRONTEND_URL` 是否正确
- 检查 CORS 配置

## 卸载

1. **停止服务**：
   ```bash
   # 停止后端服务
   # 停止前端服务
   ```

2. **删除项目目录**：
   ```bash
   rm -rf bettermao-im
   ```

3. **删除数据库文件**：
   ```bash
   rm -rf db/*.db
   ```