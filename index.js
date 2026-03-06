const express = require('express');
const path = require('path');

const app = express();

// 托管静态文件
app.use(express.static(path.join(__dirname, 'im-web')));

// 启动服务器
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

module.exports = app;