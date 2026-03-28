# BetterMao IM UI设计规范

## 1. 颜色系统

### 主色调
- 主色: `--primary-color: #6366f1`
- 主色 hover: `--primary-hover: #4f46e5`

### 中性色
- 背景色: `--bg-color`
- 文本色: `--text-color`
- 次要文本色: `--text-light`
- 白色: `--white`

### 功能色
- 错误: `--error`
- 成功: `--success`

### 毛玻璃效果
- 背景: `--glass-bg`
- 边框: `--glass-border`
- 模糊: `--glass-blur`
- 阴影: `--glass-shadow`

## 2. 排版

### 字体
- 主要字体: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
- 字体平滑: `-webkit-font-smoothing: antialiased`

### 字号系统
- 大标题: 1.875rem (30px)
- 标题: 1.25rem (20px)
- 正文: 1rem (16px)
- 小文本: 0.875rem (14px)
- 极小文本: 0.75rem (12px)

### 字重
- 粗体: 700
- 半粗体: 600
- 中等: 500
- 常规: 400

## 3. 间距系统

- 极小组距: 0.25rem (4px)
- 小组距: 0.5rem (8px)
- 中等间距: 0.75rem (12px)
- 大间距: 1rem (16px)
- 更大间距: 1.25rem (20px)
- 最大间距: 1.5rem (24px)
- 超大间距: 2rem (32px)

## 4. 边框和圆角

### 圆角
- 小圆角: 8px
- 中等圆角: 12px
- 大圆角: 16px
- 超大圆角: 24px
- 圆形: 50%

### 边框
- 常规边框: 1px solid #e5e7eb
- 激活边框: 2px solid var(--primary-color)
- 错误边框: 2px solid var(--error)

## 5. 阴影

- 常规阴影: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
- 毛玻璃阴影: `var(--glass-shadow)`
- 悬浮阴影: 常规阴影 + 轻微上移效果

## 6. 组件样式

### 按钮
- 主要按钮: 背景色 `var(--primary-color)`, 文字白色, 圆角 12px, 悬停效果
- 次要按钮: 背景色 `--bg-color`, 文字 `--text-light`, 圆角 12px
- 禁用状态: 透明度 0.7, 光标 not-allowed

### 输入框
- 常规状态: 边框 2px solid #e5e7eb, 背景色 #f9fafb, 圆角 12px
- 聚焦状态: 边框色 `var(--primary-color)`, 背景色白色, 阴影 `0 0 0 4px rgba(99, 102, 241, 0.1)`
- 错误状态: 边框色 `var(--error)`, 抖动动画

### 弹窗
- 统一使用 Modal 组件
- 背景色: 白色 (深色模式下为 `--white`)
- 圆角: 16px
- 阴影: 常规阴影
- 动画: 淡入 + 上移效果
- 按钮布局: 右侧对齐，间距 1rem

### 卡片
- 背景色: 白色 (深色模式下为 `--white`)
- 圆角: 16px
- 阴影: 常规阴影
- 内边距: 1.5rem

### 头像
- 圆角: 50%
- 默认背景色: #e0e7ff
- 默认文字色: #4f46e5
- 字体大小: 头像尺寸的 40%

## 7. 动画效果

### 过渡动画
- 持续时间: 0.3s
- 缓动函数: ease-out

### 悬停动画
- 按钮: 轻微上移 (transform: translateY(-1px))
- 卡片: 轻微上移 + 阴影增强

### 加载动画
- 旋转动画: 1s linear infinite
- 淡入动画: 0.3s ease-in-out
- 抖动动画: 0.5s ease-in-out (用于错误状态)

## 8. 响应式设计

### 断点
- 移动端: < 480px
- 平板: 480px - 768px
- 桌面: > 768px

### 移动端适配
- 弹窗: 宽度 95%, 内边距 1.5rem
- 按钮: 宽度 100%
- 表单: 垂直布局

## 9. 暗黑模式

- 遵循系统暗黑模式设置
- 提供手动切换选项
- 所有颜色变量在暗黑模式下有对应的值
- 确保文本可读性

## 10. 无障碍设计

- 确保足够的颜色对比度
- 提供键盘导航支持
- 使用语义化HTML元素
- 添加适当的ARIA属性

## 11. 实现指南

1. 所有组件必须使用全局CSS变量
2. 避免硬编码颜色值
3. 遵循统一的命名规范
4. 组件样式应该可复用
5. 考虑性能优化
6. 确保跨浏览器兼容性
