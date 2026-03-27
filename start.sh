#!/bin/bash

# BetterMao IM - 启动脚本
NODE_VERSION_REQUIRED="16.0.0"

echo "=========================================="
echo "       BetterMao IM - 启动脚本"
echo "=========================================="

# 检查Node.js版本
echo "[1/5] 检查Node.js版本..."
NODE_VERSION=$(node -v | sed 's/v//')
NODE_VERSION_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)

if [ "$NODE_VERSION_MAJOR" -lt 16 ]; then
    echo "错误: Node.js版本过低，需要16.0.0或更高版本"
    echo "当前版本: $NODE_VERSION"
    read -p "按任意键退出..."
    exit 1
fi
echo "Node.js版本检查通过: $NODE_VERSION"

# 加载环境变量
if [ -f .env ]; then
    echo "[2/5] 加载环境变量..."
    export $(grep -v '^#' .env | xargs)
else
    echo "[2/5] 未找到.env文件，使用默认配置..."
fi

# 设置默认值
PORT=${PORT:-3000}
NODE_ENV=${NODE_ENV:-development}

# 创建日志目录
echo "[3/5] 启动配置:"
LOG_FILE="logs/startup.log"
mkdir -p logs
echo "端口: $PORT" > "$LOG_FILE"
echo "环境: $NODE_ENV" >> "$LOG_FILE"
echo "启动时间: $(date)" >> "$LOG_FILE"

# 启动后端服务
echo "[4/5] 启动后端服务..."
echo "启动后端服务，端口: $PORT，环境: $NODE_ENV"
echo "详细日志请查看: $LOG_FILE"

# 在后台启动后端服务
node app.js > "$LOG_FILE" 2>&1 &
BACKEND_PID=$!

echo "后端服务PID: $BACKEND_PID"

# 等待后端启动
echo "等待后端服务初始化 (3秒)..."
sleep 3

# 启动前端服务
echo "[5/5] 启动前端服务..."
cd ui && npm run dev &
FRONTEND_PID=$!

echo "前端服务PID: $FRONTEND_PID"

# 等待前端启动
echo "等待前端服务初始化 (5秒)..."
sleep 5

# 打开浏览器
echo "打开浏览器访问应用..."
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173
elif command -v open &> /dev/null; then
    open http://localhost:5173
elif command -v start &> /dev/null; then
    start http://localhost:5173
fi

echo "=========================================="
echo "       系统启动完成！"
echo "=========================================="
echo "服务已启动:"
echo "- 后端服务: http://localhost:$PORT"
echo "- 前端服务: http://localhost:5173"
echo ""
echo "提示:"
echo "1. 服务已在后台运行"
echo "2. 详细日志请查看: $LOG_FILE"
echo "3. 按Ctrl+C退出此脚本"
echo ""
echo "要停止服务，请使用以下命令:"
echo "kill $BACKEND_PID $FRONTEND_PID"

# 等待用户输入
read -p "按任意键关闭此窗口..."

# 停止服务
echo "停止服务..."
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
echo "服务已停止"
