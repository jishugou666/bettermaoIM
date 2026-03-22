<template>
  <div class="app-container">
    <nav class="navbar">
      <div class="container nav-content">
        <div class="logo">🐱 BetterMao</div>
        <div class="right-nav">
          <LanguageSwitcher />
          <div class="user-menu" v-if="authStore.user">
            <!-- 消息通知按钮 -->
            <div class="notification-btn clickable" @click="showNotifications = !showNotifications">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
            </div>
            <div class="user-info clickable" @click="router.push('/profile')">
              <Avatar :username="authStore.user.username" :src="authStore.user.avatar" :size="36" />
              <span class="username">{{ authStore.user.username }}</span>
            </div>
            <button @click="logout" class="logout-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
    
    <main class="container main-content">
      <div v-if="!authStore.user" class="loading-state">
        <div class="loader"></div>
      </div>
      
      <div v-else class="dashboard-grid">
        <div class="card welcome-card">
          <h2>{{ $t('home.welcome', { name: authStore.user.username }) }}</h2>
          <p>{{ $t('home.welcome_sub') }}</p>
        </div>
        
        <div class="card feature-card clickable" @click="router.push('/chat')">
          <div class="feature-icon">💬</div>
          <h3>{{ $t('nav.messaging') }}</h3>
          <p>{{ $t('chat.select_conversation_sub') }}</p>
          <button class="feature-btn primary">{{ $t('home.open_chat') }}</button>
        </div>

        <div class="card feature-card clickable" @click="router.push('/friends')">
          <div class="feature-icon">👥</div>
          <h3>{{ $t('nav.friends') }}</h3>
          <p>{{ $t('friends.title') }}</p>
          <button class="feature-btn primary">{{ $t('home.manage_friends') }}</button>
        </div>

        <div class="card feature-card clickable" @click="router.push('/credits')">
          <div class="feature-icon">💰</div>
          <h3>{{ $t('nav.credits') }}</h3>
          <p>{{ $t('credit.total_earned') }}</p>
          <button class="feature-btn primary">{{ $t('home.my_wallet') }}</button>
        </div>

        <div class="card feature-card clickable" @click="router.push('/moments')">
          <div class="feature-icon">📸</div>
          <h3>朋友圈</h3>
          <p>分享生活瞬间</p>
          <button class="feature-btn primary">查看朋友圈</button>
        </div>



        <div class="card feature-card clickable" @click="router.push('/profile')">
          <div class="feature-icon">👤</div>
          <h3>{{ $t('nav.profile') }}</h3>
          <p>{{ $t('profile.edit_title') }}</p>
          <button class="feature-btn primary">{{ $t('home.edit_profile') }}</button>
        </div>

        <div class="card status-card">
          <div class="status-header">
            <h3>{{ $t('home.status_title') }}</h3>
            <span class="badge success">{{ $t('common.online') }}</span>
          </div>
          <div class="status-details">
            <div class="status-item">
              <span class="label">{{ $t('home.user_id') }}</span>
              <span class="value">#{{ authStore.user.id }}</span>
            </div>
            <div class="status-item">
              <span class="label">{{ $t('home.role') }}</span>
              <span class="value">{{ authStore.user.role }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <!-- 消息通知模态框 -->
    <div v-if="showNotifications" class="modal-overlay" @click.self="showNotifications = false">
      <div class="notification-modal">
        <h3>{{ $t('notification.title') }}</h3>
        <div class="notification-list">
          <div v-if="notifications.length === 0" class="empty-notifications">
            {{ $t('notification.no_notifications') }}
          </div>
          <div v-else v-for="notification in notifications" :key="notification.id" class="notification-item clickable" @click="handleNotificationClick(notification)">
            <div class="notification-icon">{{ notification.icon }}</div>
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">{{ notification.time }}</div>
            </div>
            <div v-if="!notification.read" class="notification-dot"></div>
          </div>
        </div>
        <div class="notification-actions">
          <button class="cancel-btn" @click="showNotifications = false">{{ $t('common.close') }}</button>
          <button class="confirm-btn" @click="markAllAsRead">{{ $t('notification.mark_all_read') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onActivated, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import Avatar from '../components/Avatar.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import axios from 'axios'

const authStore = useAuthStore()
const router = useRouter()

// 消息通知相关状态
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)

// 从后端API获取通知
const fetchNotifications = async () => {
  try {
    const response = await axios.get('/api/notification', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    notifications.value = response.data.map(notification => ({
      ...notification,
      icon: getNotificationIcon(notification.type),
      time: formatTimeAgo(notification.createdAt)
    }))
    updateUnreadCount()
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
  }
}

// 获取通知图标
const getNotificationIcon = (type) => {
  switch (type) {
    case 'message': return '💬'
    case 'friend_request': return '👥'
    case 'moment': return '🌍'
    case 'system': return '📢'
    default: return '🔔'
  }
}

// 格式化时间
const formatTimeAgo = (dateString) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSecs < 60) {
    return '刚刚'
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString()
  }
}

// 更新未读消息计数
const updateUnreadCount = () => {
  unreadCount.value = notifications.value.filter(n => !n.read).length
}

// 标记通知为已读
const markNotificationAsRead = async (notificationId) => {
  try {
    await axios.put(`/api/notification/${notificationId}/read`, {}, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    // 更新本地状态
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      updateUnreadCount()
    }
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
  }
}

// 标记所有通知为已读
const markAllAsRead = async () => {
  try {
    await axios.put('/api/notification/read-all', {}, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    // 更新本地状态
    notifications.value.forEach(notification => {
      notification.read = true
    })
    unreadCount.value = 0
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
  }
}

const fetchUserData = async () => {
  if (!authStore.user) {
    await authStore.fetchUser()
  }
}

const handleNotificationClick = async (notification) => {
  // 标记为已读
  if (!notification.read) {
    await markNotificationAsRead(notification.id)
  }
  
  // 根据通知类型跳转到对应页面
  if (notification.type === 'message') {
    router.push('/chat')
  } else if (notification.type === 'friend_request') {
    router.push('/friends')
  } else if (notification.type === 'moment') {
    router.push('/moments') // 因为已经移除了社区，所以跳转到朋友圈
  }
  
  // 关闭通知面板
  showNotifications.value = false
}

onMounted(async () => {
  await fetchUserData()
  await fetchNotifications()
})

onActivated(async () => {
  await fetchUserData()
  await fetchNotifications()
})

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%);
}

.navbar {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.right-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary-color);
  letter-spacing: -0.5px;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.notification-btn {
  position: relative;
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-btn:hover {
  background-color: #f3f4f6;
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: var(--error);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  line-height: 1;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 36px;
  height: 36px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
}

.username {
  font-weight: 500;
  color: var(--text-color);
}

.logout-btn {
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.logout-btn:hover {
  background-color: #fee2e2;
  color: var(--error);
}

.main-content {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding-top: 4rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: 20px;
  padding: 1.5rem;
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-2px);
}

.clickable {
  cursor: pointer;
}

.welcome-card {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, var(--primary-color) 0%, #4338ca 100%);
  color: white;
}

.welcome-card h2 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.welcome-card p {
  opacity: 0.9;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge.success {
  background-color: #d1fae5;
  color: #065f46;
}

.status-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.status-item:last-child {
  border-bottom: none;
}

.label {
  color: var(--text-light);
  font-size: 0.9rem;
}

.value {
  font-weight: 500;
}

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background-color: #f3f4f6;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.feature-card h3 {
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.feature-card p {
  color: var(--text-light);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.feature-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  color: var(--text-light);
  font-size: 0.875rem;
  cursor: default;
}

.feature-btn.primary {
  background-color: var(--primary-color);
  color: white;
  border: none;
  cursor: pointer;
}

.feature-btn.disabled {
  opacity: 0.6;
}

.loader {
  border: 3px solid #f3f3f3;
  border-radius: 50%;
  border-top: 3px solid var(--primary-color);
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 消息通知模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.notification-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 450px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}

.notification-modal h3 {
  padding: 1.5rem;
  margin: 0;
  border-bottom: 1px solid #f3f4f6;
  color: var(--text-color);
  font-size: 1.125rem;
  font-weight: 600;
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.empty-notifications {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-light);
  font-size: 0.9rem;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f9fafb;
}

.notification-icon {
  font-size: 1.25rem;
  background-color: #f3f4f6;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.notification-message {
  color: var(--text-light);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

.notification-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--error);
  margin-top: 0.5rem;
  flex-shrink: 0;
}

.notification-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #f3f4f6;
}

.cancel-btn {
  background: #f3f4f6;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-color);
  transition: all 0.2s;
}

.cancel-btn:hover {
  background-color: #e5e7eb;
}

.confirm-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.confirm-btn:hover {
  background-color: #4f46e5;
}
</style>
