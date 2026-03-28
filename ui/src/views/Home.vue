<template>
  <div class="home-layout">
    <div class="home-container">
      <div class="home-header">
        <h1>{{ $t('home.welcome') }}</h1>
        <p class="home-subtitle">{{ $t('home.welcome_sub') }}</p>
      </div>
      
      <div class="home-stats card">
        <h2>{{ $t('home.status_title') }}</h2>
        <div class="user-profile-section">
          <div class="user-avatar-large">
            <Avatar :username="authStore.user?.username || 'User'" :src="authStore.user?.avatar" size="80" />
          </div>
          <div class="user-info-detailed">
            <div class="user-name-large">{{ authStore.user?.username || authStore.user?.nickname || 'User' }}</div>
            <div class="user-online-status">
              <span class="status-dot online"></span>
              {{ $t('common.online') }}
            </div>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">{{ $t('home.user_id') }}</span>
            <span class="stat-value">{{ authStore.user?.id || authStore.user?._id || 'N/A' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ $t('home.role') }}</span>
            <span class="stat-value">{{ authStore.user?.role || 'User' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ $t('profile.nickname') }}</span>
            <span class="stat-value">{{ authStore.user?.nickname || authStore.user?.username || 'N/A' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ $t('auth.email') }}</span>
            <span class="stat-value">{{ authStore.user?.email || 'N/A' }}</span>
          </div>
        </div>
      </div>
      
      <div class="home-actions">
        <div class="action-grid">
          <div class="action-card card" @click="router.push('/chat')">
            <div class="action-icon">💬</div>
            <h3>{{ $t('nav.messaging') }}</h3>
            <p>{{ $t('home.open_chat') }}</p>
          </div>
          <div class="action-card card" @click="router.push('/friends')">
            <div class="action-icon">👥</div>
            <h3>{{ $t('nav.friends') }}</h3>
            <p>{{ $t('home.manage_friends') }}</p>
          </div>
          <div class="action-card card" @click="router.push('/points')">
            <div class="action-icon">💰</div>
            <h3>{{ $t('nav.credits') }}</h3>
            <p>{{ $t('home.my_wallet') }}</p>
          </div>
          <div class="action-card card" @click="router.push('/moments')">
            <div class="action-icon">📱</div>
            <h3>{{ $t('nav.moments') }}</h3>
            <p>{{ $t('home.explore_feed') }}</p>
          </div>
          <div class="action-card card" @click="router.push('/community')">
            <div class="action-icon">🌍</div>
            <h3>{{ $t('nav.community') }}</h3>
            <p>{{ $t('home.enter_community') }}</p>
          </div>
          <div class="action-card card" @click="router.push('/profile')">
            <div class="action-icon">👤</div>
            <h3>{{ $t('nav.profile') }}</h3>
            <p>{{ $t('home.edit_profile') }}</p>
          </div>
        </div>
      </div>
      
      <div class="home-footer">
        <button v-if="authStore.user?.role === 'admin'" class="btn btn-admin" @click="router.push('/admin')">
          后台管理
        </button>
        <button class="btn btn-text" @click="handleLogout">
          {{ $t('auth.logout') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>/* --- UI统一修改开始 --- */
import { onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Avatar from '../components/Avatar.vue'

const { t } = useI18n()
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
    // 即使失败也清除本地状态并跳转
    router.push('/login')
  }
}
/* --- UI统一修改结束 --- */
</script>

<style scoped>/* --- UI统一修改开始 --- */
.home-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--bg-color) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-6);
  margin: 0;
}

.home-container {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

.home-header {
  text-align: center;
  margin-bottom: var(--spacing-4);
}

.home-header h1 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.home-subtitle {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  margin: 0;
}

.home-stats {
  margin-bottom: var(--spacing-8);
}

.home-stats h2 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-4);
}

.user-profile-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-6);
  padding: var(--spacing-6);
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--bg-color) 100%);
  border-radius: var(--radius-xl);
  margin-bottom: var(--spacing-6);
}

.user-avatar-large {
  flex-shrink: 0;
}

.user-info-detailed {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.user-name-large {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.user-online-status {
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
  background-color: var(--success-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-4);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-3);
  background-color: var(--bg-color);
  border-radius: var(--radius-md);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  font-weight: var(--font-weight-medium);
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.home-actions {
  margin-bottom: var(--spacing-8);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-6);
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-8);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-in-out);
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.action-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-4);
}

.action-card h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.action-card p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

.home-footer {
  display: flex;
  justify-content: center;
  gap: var(--spacing-4);
  margin-top: var(--spacing-8);
}

.btn-admin {
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-in-out);
}

.btn-admin:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home-layout {
    padding: var(--spacing-4);
  }
  
  .home-header h1 {
    font-size: var(--font-size-2xl);
  }
  
  .action-grid {
    grid-template-columns: 1fr;
  }
  
  .action-card {
    padding: var(--spacing-6);
  }
  
  .action-icon {
    font-size: 2.5rem;
  }
}
/* --- UI统一修改结束 --- */
</style>
