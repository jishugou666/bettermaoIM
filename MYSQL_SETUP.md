# MySQL 数据库安装和配置指南

## 重要信息

- **数据库名称**: bettermaoim
- **用户名**: root
- **密码**: B3tt3rM40!m2024
- **端口**: 3306

## 一、MySQL 安装

### 方法1: 使用 MySQL Installer（推荐）

1. 下载 MySQL Installer for Windows:
   - 访问: https://dev.mysql.com/downloads/installer/
   - 下载 mysql-installer-community-8.x.x.x.msi

2. 运行安装程序，选择 "Developer Default" 安装类型

3. 配置 MySQL Server:
   - 设置 root 密码为: `B3tt3rM40!m2024`
   - 确保端口为 3306
   - 完成安装

### 方法2: 使用 Chocolatey（如果已安装）

```powershell
choco install mysql
```

## 二、验证 MySQL 安装

打开命令行或 PowerShell，运行:

```bash
mysql --version
```

## 三、初始化数据库

### 方法1: 使用命令行

1. 登录 MySQL:
```bash
mysql -u root -p
# 输入密码: B3tt3rM40!m2024
```

2. 执行 schema.sql 文件:
```bash
mysql -u root -p < db\schema.sql
```

### 方法2: 使用 MySQL Workbench 或其他 GUI 工具

1. 打开 MySQL Workbench
2. 连接到本地 MySQL 服务器（用户名: root, 密码: B3tt3rM40!m2024）
3. 打开并执行 `db\schema.sql` 文件

## 四、测试连接

安装并初始化完成后，您可以启动应用测试连接:

```bash
npm start
```

如果一切正常，您会看到 "MySQL Database connected successfully" 的消息。
