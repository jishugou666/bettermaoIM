#!/bin/bash

# 检查依赖是否安装
if [ ! -d "client/node_modules" ] || [ ! -d "server/node_modules" ]; then
  echo "Installing dependencies..."
  cd client && npm install && cd ../server && npm install && cd ..
fi

# 启动后端服务
echo "Starting backend server..."
cd server && npm start &
SERVER_PID=$!

# 等待后端服务启动
sleep 3

# 启动前端服务
echo "Starting frontend server..."
cd ../client && npm run dev &
CLIENT_PID=$!

# 等待服务启动
echo "Services starting..."
echo "Backend PID: $SERVER_PID"
echo "Frontend PID: $CLIENT_PID"

# 清理函数
cleanup() {
  echo "Stopping services..."
  kill $SERVER_PID $CLIENT_PID
  exit 0
}

# 捕获信号
trap cleanup SIGINT SIGTERM

# 等待服务运行
wait