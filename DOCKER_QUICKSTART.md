# 🚀 BetterMao IM - Docker 快速启动指南

## 前提条件

确保你已安装 Docker Desktop for Windows

## 快速启动（推荐）

### 1. 启动完整服务（MySQL + 后端）

```bash
docker-compose up -d
```

这将会：
- 自动启动 MySQL 8.0 数据库
- 自动创建数据库和表结构
- 启动 BetterMao IM 后端服务

### 2. 查看服务状态

```bash
docker-compose ps
```

### 3. 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 只查看 MySQL 日志
docker-compose logs -f mysql

# 只查看后端日志
docker-compose logs -f bettermao-im
```

### 4. 访问应用

- 后端服务: http://localhost:3000
- 健康检查: http://localhost:3000/health

### 5. 停止服务

```bash
docker-compose down
```

### 6. 停止并删除数据（谨慎使用）

```bash
docker-compose down -v
```

## 数据库配置

### 连接信息（Docker 内部）
- Host: `mysql`
- Port: `3306`
- User: `root`
- Password: `B3tt3rM40!m2024`
- Database: `bettermaoim`

### 从本地连接 MySQL

如果你想用本地工具（如 MySQL Workbench）连接：
- Host: `localhost`
- Port: `3306`
- User: `root`
- Password: `B3tt3rM40!m2024`

## 手动启动（不使用 Docker）

如果你不想用 Docker，需要手动安装 MySQL：

1. 下载并安装 MySQL: https://dev.mysql.com/downloads/installer/
2. 安装后运行: `node db/init-db.js`
3. 启动后端: `npm start`

详细步骤请查看 `MYSQL_SETUP.md`

## 常见问题

### Q: Docker 容器启动失败？
A: 确保 Docker Desktop 正在运行

### Q: 数据库连接失败？
A: 等待约 30 秒让 MySQL 完全启动

### Q: 如何重启单个服务？
A: `docker-compose restart mysql` 或 `docker-compose restart bettermao-im`
