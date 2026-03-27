<script setup>
import { onMounted, watch } from 'vue'
import { useAuthStore } from './stores/auth'
import { useChatStore } from './stores/chat'

const authStore = useAuthStore()
const chatStore = useChatStore()

onMounted(async () => {
  if (authStore.token) {
    // 先获取用户信息，再初始化socket
    await authStore.fetchUser()
    chatStore.initializeSocket()
  }
})

watch(() => authStore.token, async (newToken) => {
  if (newToken) {
    // 当token变化时，重新获取用户信息
    await authStore.fetchUser()
    chatStore.initializeSocket()
  } else {
    // chatStore.disconnectSocket() // Implement this if needed
    if (chatStore.socket) chatStore.socket.disconnect()
  }
})
</script>

<template>
  <router-view v-slot="{ Component }">
    <transition name="page-transition" mode="out-in">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </transition>
  </router-view>
</template>

<style>
/* 页面过渡动画 */
.page-transition-enter-active,
.page-transition-leave-active {
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
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
  background-color: var(--white);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 16px;
  margin-bottom: 16px;
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* 按钮样式 */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
}

/* 输入框样式 */
.input {
  padding: 10px 16px;
  border: 1px solid var(--text-light);
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  background-color: var(--white);
  color: var(--text-color);
}

.input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}
</style>
