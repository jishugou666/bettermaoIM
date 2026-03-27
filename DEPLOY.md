# BetterMao IM 部署指南

## 部署方式

### 1. Docker 部署（推荐）

#### 准备工作

1. **安装 Docker**：
   - 参考 [Docker 官方文档](https://docs.docker.com/get-docker/)

2. **安装 Docker Compose**：
   - 参考 [Docker Compose 官方文档](https://docs.docker.com/compose/install/)

#### 部署步骤

1. **克隆仓库**：
   ```bash
   git clone https://github.com/yourusername/bettermao-im.git
   cd bettermao-im
   ```

2. **配置环境变量**：
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，设置生产环境配置
   ```

3. **构建并启动容器**：
   ```bash
   docker-compose up -d
   ```

4. **验证部署**：
   - 访问：`http://服务器IP:3000`
   - 健康检查：`http://服务器IP:3000/health`

#### 容器管理

- **查看容器状态**：
  ```bash
  docker-compose ps
  ```

- **查看容器日志**：
  ```bash
  docker-compose logs -f
  ```

- **重启容器**：
  ```bash
  docker-compose restart
  ```

- **停止容器**：
  ```bash
  docker-compose down
  ```

### 2. 传统部署

#### 准备工作

1. **服务器要求**：
   - Ubuntu 20.04 LTS 或更高版本
   - Node.js 16.0.0 或更高版本
   - SQLite3 3.0.0 或更高版本

2. **安装依赖**：
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm sqlite3 git
   ```

#### 部署步骤

1. **克隆仓库**：
   ```bash
   git clone https://github.com/yourusername/bettermao-im.git
   cd bettermao-im
   ```

2. **安装依赖**：
   ```bash
   npm install
   cd ui && npm install && npm run build && cd ..
   ```

3. **配置环境变量**：
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，设置生产环境配置
   ```

4. **初始化数据库**：
   ```bash
   node db/init.js
   ```

5. **启动服务**：
   - 使用 PM2（推荐）：
     ```bash
     npm install -g pm2
     pm2 start app.js --name bettermao-im
     pm2 save
     ```
   - 或使用 systemd：
     ```bash
     sudo cp deploy/bettermao-im.service /etc/systemd/system/
     sudo systemctl daemon-reload
     sudo systemctl start bettermao-im
     sudo systemctl enable bettermao-im
     ```

6. **验证部署**：
   - 访问：`http://服务器IP:3000`
   - 健康检查：`http://服务器IP:3000/health`

## CI/CD 配置

### GitHub Actions

项目已配置 GitHub Actions CI/CD 流程，自动执行以下任务：

1. **代码检查**：ESLint 代码质量检查
2. **单元测试**：Jest 单元测试
3. **构建**：构建前端和后端
4. **部署**：构建 Docker 镜像并推送到 Docker Hub

#### 配置步骤

1. **在 GitHub 仓库中设置 Secrets**：
   - `DOCKER_USERNAME`：Docker Hub 用户名
   - `DOCKER_PASSWORD`：Docker Hub 密码或访问令牌

2. **推送代码到主分支**：
   ```bash
   git push origin main
   ```

3. **查看 CI/CD 状态**：
   - 访问 GitHub 仓库的 "Actions" 标签页

## 运维文档

### 监控

1. **健康检查**：
   - 访问 `http://服务器IP:3000/health` 检查服务状态

2. **日志监控**：
   - Docker 容器日志：`docker-compose logs -f`
   - PM2 日志：`pm2 logs bettermao-im`
   - 系统日志：`journalctl -u bettermao-im -f`（使用 systemd 时）

3. **性能监控**：
   - 使用 `htop` 监控 CPU 和内存使用
   - 使用 `docker stats` 监控容器资源使用

### 日志管理

1. **日志位置**：
   - 应用日志：`logs/app.log`
   - 启动日志：`logs/startup.log`

2. **日志轮转**：
   - 建议配置 logrotate 进行日志轮转：
     ```bash
     sudo nano /etc/logrotate.d/bettermao-im
     ```
     ```
     /path/to/bettermao-im/logs/*.log {
         daily
         rotate 7
         compress
         delaycompress
         missingok
         copytruncate
     }
     ```

### 排障命令

1. **检查服务状态**：
   - Docker：`docker-compose ps`
   - PM2：`pm2 status`
   - systemd：`systemctl status bettermao-im`

2. **检查端口占用**：
   ```bash
   lsof -i :3000
   ```

3. **检查数据库**：
   ```bash
   sqlite3 db/bettermao.db
   .tables
   SELECT * FROM users LIMIT 5;
   ```

4. **检查网络连接**：
   ```bash
   curl -X GET http://localhost:3000/health
   ```

5. **查看应用错误**：
   ```bash
   tail -f logs/app.log | grep ERROR
   ```

## 生产环境部署注意事项

1. **安全配置**：
   - 修改 `.env` 文件中的 `JWT_SECRET` 为强密钥
   - 配置 HTTPS（使用 Nginx 或 Let's Encrypt）
   - 限制服务器访问端口（使用防火墙）

2. **性能优化**：
   - 启用 gzip 压缩
   - 配置缓存策略
   - 优化数据库查询

3. **备份策略**：
   - 定期备份数据库文件：`db/bettermao.db`
   - 备份上传文件：`uploads/` 目录
   - 使用 `node db/index.js` 中的备份功能

4. **扩展方案**：
   - 对于高并发场景，考虑使用 Redis 作为缓存
   - 对于更大规模，考虑使用 PostgreSQL 替代 SQLite

## 回滚机制

### Docker 部署回滚

1. **查看历史镜像**：
   ```bash
   docker images | grep bettermao-im
   ```

2. **回滚到指定版本**：
   ```bash
   # 修改 docker-compose.yml 中的镜像标签
   docker-compose up -d
   ```

### 传统部署回滚

1. **使用版本控制**：
   ```bash
   git checkout <commit-hash>
   npm install
   cd ui && npm install && npm run build && cd ..
   pm2 restart bettermao-im
   ```

2. **使用备份**：
   - 恢复数据库备份
   - 恢复代码备份

## 常见问题与解决方案

### 1. 服务启动失败

**症状**：服务无法启动，日志显示错误

**解决方案**：
- 检查端口是否被占用
- 检查数据库连接
- 检查环境变量配置
- 查看详细日志：`docker-compose logs -f` 或 `pm2 logs bettermao-im`

### 2. 数据库连接错误

**症状**：应用无法连接到数据库

**解决方案**：
- 检查数据库文件权限：`chmod 644 db/bettermao.db`
- 检查数据库文件是否存在
- 重新初始化数据库：`node db/init.js`

### 3. 前端无法访问后端 API

**症状**：前端显示 API 连接错误

**解决方案**：
- 检查 CORS 配置：确保 `.env` 文件中的 `FRONTEND_URL` 正确
- 检查后端服务是否运行
- 检查网络防火墙设置

### 4. 性能问题

**症状**：应用响应缓慢

**解决方案**：
- 检查服务器资源使用情况
- 优化数据库查询
- 启用缓存
- 考虑升级服务器配置

## 联系方式

- **项目地址**：https://github.com/yourusername/bettermao-im
- **问题反馈**：请在 GitHub 仓库提交 Issue
- **技术支持**：contact@bettermao.com