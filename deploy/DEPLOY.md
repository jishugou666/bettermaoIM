# BetterMao IM 部署文档

## 1. 部署环境要求

### 1.1 系统要求
- **操作系统**：Ubuntu 20.04 LTS 或 Ubuntu 22.04 LTS
- **CPU**：至少 1 核
- **内存**：至少 1GB
- **存储空间**：至少 10GB
- **网络**：可访问互联网，开放 3000 端口

### 1.2 软件要求
- **Node.js**：16.x 或更高版本
- **npm**：8.x 或更高版本
- **Git**：2.x 或更高版本
- **SQLite3**：3.x 或更高版本（会自动安装）

## 2. 快速部署步骤

### 2.1 使用部署脚本（推荐）
1. **下载部署脚本**
   ```bash
   wget https://raw.githubusercontent.com/yourusername/bettermao-im/main/deploy/deploy.sh
   chmod +x deploy.sh
   ```

2. **执行部署脚本**
   ```bash
   sudo ./deploy.sh
   ```

3. **等待部署完成**
   脚本会自动完成以下操作：
   - 安装必要的依赖
   - 克隆代码
   - 安装前端和后端依赖
   - 构建前端项目
   - 初始化数据库
   - 创建并启动服务

4. **访问应用**
   部署完成后，可通过以下地址访问：
   ```
   http://服务器IP:3000
   ```

### 2.2 手动部署步骤

#### 2.2.1 安装依赖
```bash
# 更新系统包
sudo apt update -y

# 安装Node.js 18+
sudo apt install -y curl
sudo curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
sudo apt install -y nodejs

# 安装git
sudo apt install -y git
```

#### 2.2.2 克隆代码
```bash
cd /opt
sudo git clone https://github.com/yourusername/bettermao-im.git
sudo chown -R $USER:$USER bettermao-im
cd bettermao-im
```

#### 2.2.3 安装依赖并构建
```bash
# 安装后端依赖
npm install

# 安装前端依赖并构建
cd ui
npm install
npm run build
cd ..
```

#### 2.2.4 创建环境配置文件
```bash
cat > .env << EOF
# 服务器配置
PORT=3000
NODE_ENV=production

# 前端URL
FRONTEND_URL=http://localhost:3000

# JWT密钥
JWT_SECRET=your-secret-key-change-in-production

# 数据库配置
DATABASE_URL=sqlite://./db/bettermao.db
EOF
```

#### 2.2.5 初始化数据库
```bash
node db/init.js
```

#### 2.2.6 启动服务
```bash
# 直接启动（测试用）
node app.js

# 或创建systemd服务（生产环境）
sudo cat > /etc/systemd/system/bettermao-im.service << EOF
[Unit]
Description=BetterMao IM Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/bettermao-im
ExecStart=/usr/bin/node app.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start bettermao-im
sudo systemctl enable bettermao-im
```

## 3. 常见问题解决

### 3.1 端口占用问题
**症状**：服务启动失败，提示端口被占用

**解决方案**：
1. 检查端口占用情况：
   ```bash
   sudo lsof -i :3000
   ```
2. 停止占用端口的进程：
   ```bash
   sudo kill -9 <进程ID>
   ```
3. 重新启动服务：
   ```bash
   sudo systemctl restart bettermao-im
   ```

### 3.2 依赖安装失败
**症状**：npm install 执行失败

**解决方案**：
1. 检查网络连接
2. 清理npm缓存：
   ```bash
   npm cache clean --force
   ```
3. 重新安装依赖：
   ```bash
   npm install
   ```

### 3.3 数据库初始化失败
**症状**：执行 node db/init.js 失败

**解决方案**：
1. 检查SQLite3是否安装：
   ```bash
   sudo apt install -y sqlite3
   ```
2. 检查数据库目录权限：
   ```bash
   sudo chmod -R 755 db/
   ```
3. 重新初始化数据库：
   ```bash
   node db/init.js
   ```

### 3.4 服务启动失败
**症状**：systemctl start bettermao-im 失败

**解决方案**：
1. 查看服务日志：
   ```bash
   sudo journalctl -u bettermao-im -f
   ```
2. 根据日志提示解决问题
3. 重新启动服务：
   ```bash
   sudo systemctl restart bettermao-im
   ```

## 4. 服务管理命令

### 4.1 查看服务状态
```bash
sudo systemctl status bettermao-im
```

### 4.2 重启服务
```bash
sudo systemctl restart bettermao-im
```

### 4.3 停止服务
```bash
sudo systemctl stop bettermao-im
```

### 4.4 查看服务日志
```bash
sudo journalctl -u bettermao-im -f
```

## 5. 安全建议

1. **修改JWT密钥**：在生产环境中，务必修改.env文件中的JWT_SECRET
2. **设置防火墙**：配置防火墙只开放必要的端口
3. **定期备份**：定期备份数据库文件（db/bettermao.db）
4. **更新依赖**：定期更新项目依赖以修复安全漏洞

## 6. 升级步骤

1. **停止服务**：
   ```bash
   sudo systemctl stop bettermao-im
   ```

2. **拉取最新代码**：
   ```bash
   cd /opt/bettermao-im
   git pull
   ```

3. **更新依赖**：
   ```bash
   npm install
   cd ui
   npm install
   npm run build
   cd ..
   ```

4. **重启服务**：
   ```bash
   sudo systemctl start bettermao-im
   ```

## 7. 联系方式

- **项目地址**：https://github.com/yourusername/bettermao-im
- **问题反馈**：请在GitHub仓库提交Issue

---

**部署完成后，默认登录账号：**
- 用户名：admin
- 密码：123456

**请在首次登录后修改默认密码！**