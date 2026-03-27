# 使用Alpine镜像作为基础
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 安装依赖
RUN apk add --no-cache git sqlite

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装npm依赖
RUN npm install --production

# 复制源代码
COPY . .

# 创建必要的目录
RUN mkdir -p logs uploads db/backups

# 构建前端
RUN cd ui && npm install && npm run build && cd ..

# 暴露端口
EXPOSE 3000

# 环境变量
ENV NODE_ENV=production

# 启动命令
CMD ["node", "app.js"]