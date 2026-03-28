<template>
  <div class="friends-layout">
    <div class="friends-container">
      <div class="friends-header">
        <button class="btn btn-text" @click="router.push('/')">←</button>
        <!-- --- 修改开始 --- -->
        <h2>黑名单管理</h2>
        <!-- --- 修改结束 --- -->
      </div>
      
      <!-- --- 修改开始 --- -->
      <!-- 简化为黑名单管理 -->
      <div class="friends-tabs">
        <button 
          :class="{ active: activeTab === 'blocked' }" 
          @click="activeTab = 'blocked'"
        >
          黑名单 ({{ friendStore.blockedUsers.length }})
        </button>
      </div>

      <div class="friends-list">
        <div v-if="friendStore.loading" class="loading">{{ $t('common.loading') }}</div>
        <div v-else-if="friendStore.blockedUsers.length === 0" class="empty">暂无屏蔽用户</div>
        <div 
          v-for="user in friendStore.blockedUsers" 
          :key="user.id" 
          class="friend-item"
        >
          <div class="friend-main">
            <Avatar :username="user.username" :src="user.avatar" />
            <span class="friend-name">{{ user.username }}</span>
          </div>
          <button class="btn btn-text" @click="unblockUser(user.id)">解除屏蔽</button>
        </div>
      </div>
      <!-- --- 修改结束 --- -->
    </div>
  </div>
</template>

<script setup>
/* --- UI统一修改开始 --- */
import { ref, onMounted } from 'vue'
import { useFriendStore } from '../stores/friend'
import { useRouter } from 'vue-router'
import Avatar from '../components/Avatar.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const friendStore = useFriendStore()
const router = useRouter()

const activeTab = ref('blocked')

onMounted(async () => {
  await friendStore.fetchBlockedUsers()
})

const unblockUser = async (userId) => {
  if (confirm('确定要解除屏蔽这个用户吗？')) {
    await friendStore.unblockUser(userId)
  }
}
/* --- UI统一修改结束 --- */
</script>

<style scoped>
.friends-layout {
  min-height: 100vh;
  background: var(--bg-gradient);
  display: flex;
  justify-content: center;
  padding-top: var(--spacing-6);
  margin: 0;
}

.friends-container {
  width: 100%;
  max-width: 600px;
  background: var(--card-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: var(--radius-4xl);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  min-height: 500px;
  transition: all 0.4s var(--ease-bounce);
}

.friends-container:hover {
  box-shadow: var(--shadow-hover);
}

.friends-header {
  padding: var(--spacing-4);
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-light);
  gap: var(--spacing-4);
}

.friends-header h2 {
  flex: 1;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.friends-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-light);
}

.friends-tabs button {
  flex: 1;
  padding: var(--spacing-3);
  border: none;
  background: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-in-out);
  border-bottom: 2px solid transparent;
  position: relative;
}

.friends-tabs button.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.friends-list {
  padding: var(--spacing-4);
  max-height: 600px;
  overflow-y: auto;
}

.loading, .empty {
  text-align: center;
  padding: var(--spacing-8);
  color: var(--text-tertiary);
}

.friend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  border-radius: var(--radius-xl);
  transition: all var(--duration-fast) var(--ease-in-out);
  margin-bottom: var(--spacing-2);
}

.friend-item:hover {
  background-color: rgba(255, 255, 255, 0.5);
  transform: translateX(4px);
}

.friend-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex: 1;
  cursor: pointer;
}

.friend-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .friends-layout {
    padding-top: var(--spacing-4);
  }
  
  .friends-container {
    max-width: 100%;
    margin: 0 var(--spacing-2);
    border-radius: var(--radius-3xl);
  }
  
  .friends-header {
    padding: var(--spacing-3);
  }
  
  .friends-header h2 {
    font-size: var(--font-size-lg);
  }
  
  .friends-list {
    padding: var(--spacing-3);
  }
  
  .friend-item {
    padding: var(--spacing-2);
  }
}
</style>
