# BetterMao 本地安装与运行（非部署）

本文档仅用于本地/内网环境运行，不包含生产部署说明。

## 运行前准备
- 安装 Node.js LTS（包含 npm）
- Windows 环境

## 一键启动
1. 双击运行 `start.bat`
2. 浏览器访问 `http://localhost:5173`

## 常见问题
- 端口冲突：确保 3000（后端）与 5173（前端）未被占用
- 清空本地数据：删除 `server/dev.db` 后重新运行 `npm run migrate`
