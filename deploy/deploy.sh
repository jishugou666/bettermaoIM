#!/bin/bash

# BetterMao IM 部署脚本
# 功能：一键部署到Linux服务器

# 颜色定义
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}BetterMao IM 部署脚本${NC}"
echo -e "${GREEN}=====================================${NC}"

# 检查是否以root用户运行
if [ "$(id -u)" != "0" ]; then
    echo -e "${RED}错误：请以root用户运行此脚本${NC}"
    exit 1
fi

# 安装必要的依赖
echo -e "${YELLOW}1. 安装必要的依赖...${NC}"

# 更新系统包
echo -e "${YELLOW}  - 更新系统包...${NC}"
apt update -y

# 安装Node.js 16+
echo -e "${YELLOW}  - 安装Node.js 16+...${NC}"
apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 安装git
echo -e "${YELLOW}  - 安装git...${NC}"
apt install -y git

# 安装unzip
echo -e "${YELLOW}  - 安装unzip...${NC}"
apt install -y unzip

# 创建部署目录
echo -e "${YELLOW}2. 创建部署目录...${NC}"
DEPLOY_DIR="/opt/bettermao-im"
if [ -d "$DEPLOY_DIR" ]; then
    echo -e "${YELLOW}  - 目录已存在，删除旧文件...${NC}"
    rm -rf "$DEPLOY_DIR"
fi
mkdir -p "$DEPLOY_DIR"

# 克隆代码
echo -e "${YELLOW}3. 克隆代码...${NC}"
cd "$DEPLOY_DIR"
git clone https://github.com/yourusername/bettermao-im.git .

# 安装依赖
echo -e "${YELLOW}4. 安装依赖...${NC}"
# 安装后端依赖
npm install

# 安装前端依赖并构建
echo -e "${YELLOW}  - 安装前端依赖并构建...${NC}"
cd ui
npm install
npm run build
cd ..

# 创建环境配置文件
echo -e "${YELLOW}5. 创建环境配置文件...${NC}"
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

echo -e "${GREEN}  - 环境配置文件创建成功${NC}"

# 初始化数据库
echo -e "${YELLOW}6. 初始化数据库...${NC}"
node db/init.js

# 创建systemd服务
echo -e "${YELLOW}7. 创建systemd服务...${NC}"
cat > /etc/systemd/system/bettermao-im.service << EOF
[Unit]
Description=BetterMao IM Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$DEPLOY_DIR
ExecStart=/usr/bin/node app.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# 重新加载systemd配置
systemctl daemon-reload

# 启动服务
echo -e "${YELLOW}8. 启动服务...${NC}"
systemctl start bettermao-im

# 设置开机自启
systemctl enable bettermao-im

# 检查服务状态
echo -e "${YELLOW}9. 检查服务状态...${NC}"
sleep 3
systemctl status bettermao-im

# 显示部署结果
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}服务已启动，可通过以下地址访问：${NC}"
echo -e "${GREEN}http://服务器IP:3000${NC}"
echo -e "${GREEN}=====================================${NC}"
echo -e "${YELLOW}常用命令：${NC}"
echo -e "${YELLOW}  - 查看服务状态：systemctl status bettermao-im${NC}"
echo -e "${YELLOW}  - 重启服务：systemctl restart bettermao-im${NC}"
echo -e "${YELLOW}  - 停止服务：systemctl stop bettermao-im${NC}"
echo -e "${YELLOW}  - 查看日志：journalctl -u bettermao-im -f${NC}"
echo -e "${GREEN}=====================================${NC}"