<template>
  <div class="system-status-bar">
    <div class="status-left">
      <div class="system-status" :class="{ 'online': isSystemOnline }">
        <span class="status-dot"></span>
        {{ isSystemOnline ? $t('status.system_online') : $t('status.system_offline') }}
      </div>
    </div>
    
    <div class="status-center">
      <div class="user-info" v-if="authStore.user">
        <span class="user-id">ID: {{ authStore.user.id || authStore.user._id || 'N/A' }}</span>
        <span class="user-name">{{ authStore.user.username || authStore.user.nickname || 'User' }}</span>
        <span class="status-dot" :class="{ 'online': isUserOnline }"></span>
        {{ isUserOnline ? $t('status.online') : $t('status.offline') }}
      </div>
    </div>
    
    <div class="status-right">
      <div class="notification-badge" v-if="unreadNotifications > 0">
        {{ unreadNotifications }}
      </div>
      <div class="system-time">{{ currentTime }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const currentTime = ref('')
const unreadNotifications = ref(0)
const isSystemOnline = ref(true)
const isUserOnline = ref(true)

// 更新当前时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString()
}

// 模拟系统状态检查
const checkSystemStatus = () => {
  // 实际项目中应该通过API检查系统状态
  isSystemOnline.value = true
}

// 模拟用户在线状态检查
const checkUserStatus = () => {
  // 实际项目中应该通过WebSocket或API检查用户在线状态
  isUserOnline.value = authStore.token ? true : false
}

// 模拟获取未读通知数
const fetchUnreadNotifications = () => {
  // 实际项目中应该通过API获取未读通知数
  unreadNotifications.value = 0
}

onMounted(() => {
  // 初始化
  updateTime()
  checkSystemStatus()
  checkUserStatus()
  fetchUnreadNotifications()
  
  // 定时更新
  const timeInterval = setInterval(updateTime, 1000)
  const statusInterval = setInterval(() => {
    checkSystemStatus()
    checkUserStatus()
    fetchUnreadNotifications()
  }, 30000) // 每30秒检查一次状态
  
  // 清理定时器
  onUnmounted(() => {
    clearInterval(timeInterval)
    clearInterval(statusInterval)
  })
})
</script>

<style scoped>
.system-status-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 32px;
  background-color: var(--card-color);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--spacing-4);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  z-index: 1000;
  box-shadow: var(--shadow-sm);
}

.status-left, .status-center, .status-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.system-status, .user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.user-id {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.user-name {
  font-weight: var(--font-weight-semibold);
  color: var(--primary-color);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--error-color);
  transition: background-color var(--duration-fast) var(--ease-in-out);
}

.status-dot.online {
  background-color: var(--success-color);
}

.notification-badge {
  background-color: var(--error-color);
  color: white;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px 6px;
  border-radius: var(--radius-full);
  min-width: 18px;
  text-align: center;
}

.system-time {
  color: var(--text-tertiary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .system-status-bar {
    padding: 0 var(--spacing-2);
  }
  
  .status-center {
    display: none;
  }
  
  .status-left, .status-right {
    gap: var(--spacing-2);
  }
}
</style>