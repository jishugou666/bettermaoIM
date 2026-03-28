<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <nav class="navbar glass-card">
      <div class="navbar-content">
        <div class="navbar-brand">
          <div class="brand-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#gradient)"/>
              <path d="M16 8L22 12V20L16 24L10 20V12L16 8Z" fill="white"/>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
                  <stop stop-color="#4F46E5"/>
                  <stop offset="1" stop-color="#7C3AED"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span class="brand-text">BetterMao IM</span>
        </div>
        
        <div class="navbar-actions">
          <button v-if="authStore.user?.role === 'admin'" class="btn btn-secondary" @click="router.push('/admin')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            后台管理
          </button>
          <button class="btn btn-text" @click="handleLogout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            退出登录
          </button>
        </div>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <!-- 欢迎区域 -->
      <section class="welcome-section">
        <div class="welcome-text">
          <h1>欢迎回来，{{ authStore.user?.username || '用户' }}</h1>
          <p class="welcome-subtitle">今天想做什么？</p>
        </div>
        
        <!-- 用户信息卡片 -->
        <div class="user-card glass-card card-transition">
          <div class="user-card-header">
            <div class="user-avatar">
              <Avatar :username="authStore.user?.username || 'User'" :src="authStore.user?.avatar" size="64" />
            </div>
            <div class="user-info">
              <h3>{{ authStore.user?.username || authStore.user?.nickname || 'User' }}</h3>
              <div class="user-status">
                <span class="status-dot online status-dot-pulse"></span>
                <span>在线</span>
              </div>
            </div>
          </div>
          <div class="user-card-stats">
            <div class="stat">
              <span class="stat-label">用户ID</span>
              <span class="stat-value">{{ authStore.user?.id || authStore.user?._id || 'N/A' }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">角色</span>
              <span class="stat-value role-badge" :class="authStore.user?.role">{{ authStore.user?.role || 'user' }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 功能卡片区域 -->
      <section class="features-section">
        <h2>功能导航</h2>
        <div class="features-grid">
          <!-- 聊天 -->
          <div class="feature-card glass-card card-transition" @click="router.push('/chat')">
            <div class="feature-icon" style="background: linear-gradient(135deg, #4F46E5, #7C3AED);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <h3>聊天</h3>
            <p>与好友实时聊天</p>
          </div>

          <!-- 好友 -->
          <div class="feature-card glass-card card-transition" @click="router.push('/friends')">
            <div class="feature-icon" style="background: linear-gradient(135deg, #10B981, #059669);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <h3>好友</h3>
            <p>管理好友列表</p>
          </div>

          <!-- 朋友圈 -->
          <div class="feature-card glass-card card-transition" @click="router.push('/moments')">
            <div class="feature-icon" style="background: linear-gradient(135deg, #F59E0B, #D97706);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
            </div>
            <h3>朋友圈</h3>
            <p>分享精彩瞬间</p>
          </div>

          <!-- 积分 -->
          <div class="feature-card glass-card card-transition" @click="router.push('/points')">
            <div class="feature-icon" style="background: linear-gradient(135deg, #EC4899, #DB2777);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
              </svg>
            </div>
            <h3>积分</h3>
            <p>查看积分余额</p>
          </div>

          <!-- 个人资料 -->
          <div class="feature-card glass-card card-transition" @click="router.push('/profile')">
            <div class="feature-icon" style="background: linear-gradient(135deg, #3B82F6, #2563EB);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h3>个人资料</h3>
            <p>编辑个人信息</p>
          </div>

          <!-- 社区 -->
          <div class="feature-card glass-card card-transition" @click="router.push('/community')">
            <div class="feature-icon" style="background: linear-gradient(135deg, #8B5CF6, #7C3AED);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            </div>
            <h3>社区</h3>
            <p>浏览社区动态</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import Avatar from '../components/Avatar.vue'

const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  if (authStore.token) {
    await authStore.fetchUser()
  }
})

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
    router.push('/login')
  }
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  padding-bottom: var(--spacing-8);
}

/* 导航栏 */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  margin: var(--spacing-6) var(--spacing-12);
  border-radius: var(--radius-3xl);
  padding: var(--spacing-4) var(--spacing-8);
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-text {
  font-family: 'Outfit', sans-serif;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  background: linear-gradient(135deg, var(--primary-color), #7C3AED);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

/* 主要内容 */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-12);
}

/* 欢迎区域 */
.welcome-section {
  margin-bottom: var(--spacing-12);
}

.welcome-text {
  margin-bottom: var(--spacing-8);
}

.welcome-text h1 {
  margin-bottom: var(--spacing-2);
}

.welcome-subtitle {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
}

/* 用户卡片 */
.user-card {
  padding: var(--spacing-6);
  border-radius: var(--radius-3xl);
}

.user-card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.user-info h3 {
  margin-bottom: var(--spacing-1);
}

.user-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--success-color);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background-color: var(--success-color);
}

.user-card-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
}

.stat-value {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.role-badge {
  display: inline-block;
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.role-badge.admin {
  background-color: var(--primary-100);
  color: var(--primary-700);
}

.role-badge.user {
  background-color: var(--success-50);
  color: var(--success-color);
}

/* 功能区域 */
.features-section h2 {
  margin-bottom: var(--spacing-6);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-6);
}

.feature-card {
  padding: var(--spacing-6);
  border-radius: var(--radius-3xl);
  cursor: pointer;
  text-align: center;
}

.feature-card:hover {
  transform: translateY(-8px);
}

.feature-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-2xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-4);
}

.feature-card h3 {
  margin-bottom: var(--spacing-2);
}

.feature-card p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar {
    margin: var(--spacing-4);
    padding: var(--spacing-3) var(--spacing-4);
  }
  
  .main-content {
    padding: 0 var(--spacing-4);
  }
  
  .welcome-text h1 {
    font-size: var(--font-size-2xl);
  }
  
  .user-card-stats {
    grid-template-columns: 1fr;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
