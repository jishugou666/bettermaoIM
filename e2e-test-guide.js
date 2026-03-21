// e2e-test.js
// 这是一个模拟脚本，用于手动运行或参考测试流程
// 真实环境可以使用 Cypress 或 Playwright

/*
测试场景：用户 A 加用户 B 为好友并聊天

步骤 1: 准备环境
- 打开两个浏览器窗口 (Browser A, Browser B)
- 确保后端运行在 localhost:3000
- 确保前端运行在 localhost:5173

步骤 2: 用户注册 (Browser A & B)
- A: 访问 /register -> 注册 "UserA"
- B: 访问 /register -> 注册 "UserB"

步骤 3: 发送好友请求 (Browser A)
- A: 点击主页 "Manage Friends"
- A: 点击 "+" 按钮
- A: 输入 "UserB" 搜索
- A: 点击 "Add" 按钮
- 预期: 提示 "Friend request sent!"

步骤 4: 接受好友请求 (Browser B)
- B: 点击主页 "Manage Friends"
- B: 点击 "Requests" 标签页
- B: 看到来自 "UserA" 的请求
- B: 点击 "✓" 按钮
- 预期: 请求消失，"My Friends" 列表出现 "UserA"

步骤 5: 验证好友列表 (Browser A)
- A: 刷新或切换标签页
- 预期: "My Friends" 列表出现 "UserB"

步骤 6: 聊天测试 (Browser A -> B)
- A: 在好友列表点击 "UserB" -> 跳转到 /chat
- A: 输入 "Hello UserB" -> 发送
- B: 在好友列表点击 "UserA" -> 跳转到 /chat
- 预期: B 看到 "Hello UserB" 气泡

步骤 7: 实时输入测试
- B: 在输入框打字
- 预期: A 看到顶部显示 "typing..."
*/

console.log('请按照上述步骤手动执行 E2E 测试');
