<script setup>
import { onMounted, watch } from 'vue'
import { useAuthStore } from './stores/auth'
import { useSocketStore } from './stores/socket'

const authStore = useAuthStore()
const socketStore = useSocketStore()

onMounted(async () => {
  if (authStore.token) {
    // 先获取用户信息，再初始化socket
    await authStore.fetchUser()
    socketStore.initSocket(authStore.token)
  }
})

watch(() => authStore.token, async (newToken) => {
  if (newToken) {
    // 当token变化时，重新获取用户信息
    await authStore.fetchUser()
    socketStore.initSocket(newToken)
  } else {
    // 断开socket连接
    socketStore.disconnectSocket()
  }
})
</script>

<template>
  <div class="app-container">
    <div class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page-transition" mode="out-in">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style>/* --- UI统一修改开始 --- */
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-primary);
  line-height: 1.6;
}

/* 应用容器 */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  padding: var(--spacing-4);
}

/* 页面过渡动画 */
.page-transition-enter-active,
.page-transition-leave-active {
  transition: all var(--duration-normal) var(--ease-in-out);
}

.page-transition-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-transition-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 卡片样式 */
.card {
  background-color: var(--card-color);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-6);
  margin-bottom: var(--spacing-6);
  transition: all var(--duration-normal) var(--ease-in-out);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* 按钮样式 */
.btn {
  padding: var(--spacing-3) var(--spacing-6);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-in-out);
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-text {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: var(--font-size-md);
  padding: var(--spacing-2) var(--spacing-4);
  transition: color var(--duration-fast) var(--ease-in-out);
}

.btn-text:hover {
  color: var(--primary-color);
}

/* 输入框样式 */
.input {
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  transition: all var(--duration-normal) var(--ease-in-out);
  background-color: var(--card-color);
  color: var(--text-primary);
}

.input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: var(--spacing-2);
  }
}
/* --- UI统一修改结束 --- */
</style>
