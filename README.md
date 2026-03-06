# 贝特猫IM (BetterMao IM)

贝特猫IM是一个仿微信的即时通讯系统，基于Node.js和Vue.js开发，支持实时消息、好友添加、群聊等功能。

## 项目结构

```
├── im-platform/         # 后端API服务
├── im-server/           # WebSocket服务
├── im-web/              # 前端界面
├── package.json         # 项目依赖
└── README.md            # 项目说明
```

## 功能特性

- **用户管理**：注册、登录、退出
- **好友系统**：添加好友、好友列表
- **群聊功能**：创建群聊、群成员管理
- **实时消息**：基于WebSocket的实时消息传输
- **消息管理**：发送消息、撤回消息、标记已读
- **界面设计**：Apple风格的简洁界面

## 技术栈

- **前端**：Vue.js 2.x
- **后端**：Node.js + Express.js
- **数据库**：SQLite
- **实时通讯**：Socket.io

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动服务

1. 启动后端API服务

```bash
cd im-platform
node index.js
```

2. 启动WebSocket服务

```bash
cd im-server
node index.js
```

3. 启动前端本地服务器

```bash
cd im-web
python -m http.server 8000
```

### 访问系统

打开浏览器，访问 `http://localhost:8000`

## 数据库结构

- **users**：用户信息
- **messages**：单聊消息
- **friends**：好友关系
- **groups**：群聊信息
- **group_members**：群成员
- **group_messages**：群聊消息

## 项目截图

### 登录页面

![登录页面](https://i.imgur.com/example-login.png)

### 聊天界面

![聊天界面](https://i.imgur.com/example-chat.png)

## 开发说明

### 前端开发

前端使用Vue.js 2.x开发，主要文件位于 `im-web/index.html`。

### 后端开发

后端使用Node.js + Express.js开发，主要文件位于 `im-platform/index.js`。

### WebSocket服务

WebSocket服务使用Socket.io开发，主要文件位于 `im-server/index.js`。

## 许可证

MIT License

## 作者

jishugou666
