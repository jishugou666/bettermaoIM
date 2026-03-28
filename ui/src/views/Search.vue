<template>
  <div class="search-layout">
    <div class="search-container">
      <div class="search-header">
        <button class="back-btn" @click="router.push('/')">←</button>
        <h2>{{ $t('common.search') }}</h2>
      </div>
      
      <div class="search-bar">
        <input 
          v-model="searchQuery" 
          @input="handleSearch" 
          :placeholder="$t('friends.search_placeholder')" 
          class="search-input"
        />
        <button class="search-btn" @click="handleSearch">🔍</button>
      </div>
      
      <div class="search-results">
        <div v-if="userStore.loading" class="loading">{{ $t('common.loading') }}</div>
        <div v-else-if="searchResults.length === 0 && searchQuery.trim()" class="empty">
          {{ $t('friends.no_friends') }}
        </div>
        <div 
          v-for="user in searchResults" 
          :key="user.id" 
          class="user-item"
        >
          <div class="user-info">
            <Avatar :username="user.nickname || user.username" :src="user.avatar" />
            <div class="user-details">
              <span class="username">{{ user.nickname || user.username }}</span>
              <span class="email">{{ user.email }}</span>
            </div>
          </div>
          <button class="add-btn" @click="sendFriendRequest(user.id)">
            {{ $t('friends.add') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useFriendStore } from '../stores/friend'
import { useRouter } from 'vue-router'
import Avatar from '../components/Avatar.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const userStore = useUserStore()
const friendStore = useFriendStore()
const router = useRouter()

const searchQuery = ref('')
const searchResults = ref([])
let searchTimeout = null

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    if (searchQuery.value.trim()) {
      try {
        const results = await userStore.searchUsersByKeyword(searchQuery.value)
        searchResults.value = results
      } catch (error) {
        console.error('Search failed:', error)
        searchResults.value = []
      }
    } else {
      searchResults.value = []
    }
  }, 300)
}

const sendFriendRequest = async (userId) => {
  try {
    const success = await friendStore.sendRequest(userId)
    if (success) {
      alert(t('friends.request_sent'))
    }
  } catch (error) {
    alert(error.message || t('friends.request_failed'))
  }
}

onMounted(() => {
  // 页面加载时的初始化操作
})
</script>

<style scoped>
.search-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%);
  display: flex;
  justify-content: center;
  padding-top: 2rem;
  margin: 0;
}

.search-container {
  width: 100%;
  max-width: 600px;
  background: white;
  border-radius: 20px;
  box-shadow: var(--shadow);
  overflow: hidden;
  min-height: 500px;
}

.search-header {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
}

.back-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-light);
  padding: 0;
  display: flex;
  align-items: center;
  margin-right: 1rem;
}

.back-btn:hover {
  color: var(--primary-color);
}

.search-bar {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
}

.search-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-btn:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
}

.search-results {
  padding: 1rem;
  max-height: 600px;
  overflow-y: auto;
}

.loading, .empty {
  text-align: center;
  padding: 2rem;
  color: var(--text-light);
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 12px;
  transition: background 0.2s;
  cursor: pointer;
}

.user-item:hover {
  background-color: #f9fafb;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.username {
  font-weight: 600;
  color: var(--text-color);
}

.email {
  font-size: 0.8rem;
  color: var(--text-light);
}

.add-btn {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.add-btn:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .search-bar {
    flex-direction: column;
  }
  
  .search-input {
    width: 100%;
  }
  
  .search-btn {
    width: 100%;
  }
}
</style>