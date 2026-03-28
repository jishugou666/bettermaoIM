<template>
  <div class="friends-layout">
    <div class="friends-container">
      <div class="friends-header">
        <button class="btn btn-text" @click="router.push('/')">←</button>
        <h2>{{ $t('friends.title') }}</h2>
        <button class="btn btn-primary" @click="showAddModal = true">+</button>
      </div>
      
      <div class="friends-tabs">
        <button 
          :class="{ active: activeTab === 'friends' }" 
          @click="activeTab = 'friends'"
        >
          {{ $t('friends.my_friends') }} ({{ friendStore.friends.length }})
        </button>
        <button 
          :class="{ active: activeTab === 'requests' }" 
          @click="activeTab = 'requests'"
        >
          {{ $t('friends.requests') }} <span v-if="friendStore.requests.length" class="badge">{{ friendStore.requests.length }}</span>
        </button>
        <button 
          :class="{ active: activeTab === 'blocked' }" 
          @click="activeTab = 'blocked'"
        >
          {{ $t('friends.blocked') }}
        </button>
      </div>

      <div class="friends-list" v-if="activeTab === 'friends'">
        <div v-if="friendStore.loading" class="loading">{{ $t('common.loading') }}</div>
        <div v-else-if="friendStore.friends.length === 0" class="empty">{{ $t('friends.no_friends') }}</div>
        <div 
          v-for="friend in filteredFriends" 
          :key="friend.id" 
          class="friend-item"
        >
          <div class="friend-main" @click="startChat(friend.id)">
            <div class="friend-avatar">
              <Avatar :username="friend.nickname || friend.username" :src="friend.avatar" />
              <span v-if="chatStore.onlineUsers?.has(friend.id)" class="online-indicator"></span>
            </div>
            <div class="friend-info">
              <span class="friend-name">{{ friend.nickname || friend.username }}</span>
              <span class="friend-group">{{ friend.groupName || '默认分组' }}</span>
            </div>
          </div>
          <div class="friend-actions">
            <button class="btn btn-text" @click.stop="startChat(friend.id)">💬</button>
            <button class="btn btn-text" @click.stop="showEditFriendModal(friend)">✏️</button>
            <button class="btn btn-text" @click.stop="blockUser(friend.id)" title="Block">🚫</button>
          </div>
        </div>
      </div>

      <div class="friends-list" v-if="activeTab === 'blocked'">
        <div v-if="friendStore.blockedUsers.length === 0" class="empty">暂无屏蔽用户</div>
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

      <div class="friends-list" v-if="activeTab === 'requests'">
        <div v-if="friendStore.requests.length === 0" class="empty">{{ $t('friends.no_requests') }}</div>
        <div v-for="req in friendStore.requests" :key="req.id" class="request-item">
          <div class="request-info">
            <Avatar :username="req.user.username" :src="req.user.avatar" />
            <span class="request-name">{{ req.user.username }}</span>
          </div>
          <div class="request-actions">
            <button class="btn btn-primary" @click="friendStore.handleRequest(req.id, 'accepted')">✓</button>
            <button class="btn btn-secondary" @click="friendStore.handleRequest(req.id, 'rejected')">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Friend Modal -->
    <Modal
      :visible="showAddModal"
      :title="$t('friends.add_friend')"
      @close="showAddModal = false"
    >
      <div class="search-container">
        <input 
          v-model="searchQuery" 
          @input="handleSearch" 
          :placeholder="$t('friends.search_placeholder')" 
          class="input"
        />
        <button class="btn btn-primary" @click="handleSearch">🔍</button>
      </div>
      
      <div class="search-results">
        <div v-if="friendStore.loading" class="loading">{{ $t('common.loading') }}</div>
        <div 
          v-for="user in friendStore.searchResults" 
          :key="user.id" 
          class="result-item"
        >
          <div class="result-info">
            <Avatar :username="user.username" :src="user.avatar" size="30" />
            <span class="result-name">{{ user.username }}</span>
          </div>
          <button class="btn btn-primary" @click="sendRequest(user.id)">{{ $t('friends.add') }}</button>
        </div>
      </div>
    </Modal>

    <!-- Edit Friend Modal -->
    <Modal
      :visible="showEditFriendModalVisible"
      :title="'编辑好友信息'"
      @close="showEditFriendModalVisible = false"
      @confirm="handleUpdateFriendInfo"
    >
      <div class="form-group">
        <label class="form-label">备注</label>
        <input v-model="editFriendInfo.nickname" placeholder="输入备注" class="input" />
      </div>
      <div class="form-group">
        <label class="form-label">分组</label>
        <select v-model="editFriendInfo.groupName" class="input">
          <option v-for="group in friendGroups" :key="group" :value="group">{{ group }}</option>
          <option value="新分组">新分组</option>
        </select>
      </div>
      <div class="form-group" v-if="editFriendInfo.groupName === '新分组'">
        <label class="form-label">新分组名称</label>
        <input v-model="newGroupName" placeholder="输入新分组名称" class="input" />
      </div>
    </Modal>
  </div>
</template>

<script setup>/* --- UI统一修改开始 --- */
import { ref, onMounted, computed } from 'vue'
import { useFriendStore } from '../stores/friend'
import { useChatStore } from '../stores/chat'
import { useRouter } from 'vue-router'
import Avatar from '../components/Avatar.vue'
import Modal from '../components/Modal.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const friendStore = useFriendStore()
const chatStore = useChatStore()
const router = useRouter()

const activeTab = ref('friends')
const showAddModal = ref(false)
const searchQuery = ref('')
let searchTimeout = null

// Edit friend modal
const showEditFriendModalVisible = ref(false)
const editFriendInfo = ref({ id: '', nickname: '', groupName: '' })
const friendGroups = ref(['默认分组'])
const newGroupName = ref('')

onMounted(async () => {
  await friendStore.fetchFriends()
  await friendStore.fetchFriendRequests()
  await friendStore.fetchBlockedUsers()
  await fetchFriendGroups()
})

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    friendStore.searchUsers(searchQuery.value)
  }, 300)
}

const filteredFriends = computed(() => {
  if (!searchQuery.value.trim()) return friendStore.friends
  const query = searchQuery.value.toLowerCase()
  return friendStore.friends.filter(f => 
    (f.nickname || f.username).toLowerCase().includes(query) ||
    (f.groupName || '默认分组').toLowerCase().includes(query)
  )
})

const fetchFriendGroups = async () => {
  try {
    // 这里应该调用 API 获取好友分组
    // 暂时使用模拟数据
    friendGroups.value = ['默认分组', '家人', '朋友', '同事']
  } catch (error) {
    console.error('Failed to fetch friend groups:', error)
  }
}

const showEditFriendModal = (friend) => {
  editFriendInfo.value = {
    id: friend.id,
    nickname: friend.nickname || '',
    groupName: friend.groupName || '默认分组'
  }
  newGroupName.value = ''
  showEditFriendModalVisible.value = true
}

const handleUpdateFriendInfo = async () => {
  try {
    let groupName = editFriendInfo.value.groupName
    if (groupName === '新分组') {
      if (!newGroupName.value.trim()) {
        alert('请输入新分组名称')
        return
      }
      groupName = newGroupName.value
    }

    // 这里应该调用 API 更新好友信息
    console.log('Updating friend info:', editFriendInfo.value.id, {
      nickname: editFriendInfo.value.nickname,
      groupName
    })
    
    showEditFriendModalVisible.value = false
    await friendStore.fetchFriends()
    await fetchFriendGroups()
  } catch (error) {
    console.error('Failed to update friend info:', error)
    alert('更新好友信息失败')
  }
}

const sendRequest = async (userId) => {
  try {
    const success = await friendStore.sendRequest(userId)
    if (success) {
      alert(t('friends.request_sent'))
      showAddModal.value = false
      searchQuery.value = ''
      friendStore.searchResults = []
    }
  } catch (error) {
    alert(error.message || t('friends.request_failed'))
  }
}

const startChat = (friendId) => {
  router.push('/chat')
}

const blockUser = async (userId) => {
  if (confirm('确定要屏蔽这个用户吗？')) {
    await friendStore.blockUser(userId)
  }
}

const unblockUser = async (userId) => {
  await friendStore.unblockUser(userId)
}
/* --- UI统一修改结束 --- */
</script>

<style scoped>/* --- UI统一修改开始 --- */
.friends-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--bg-color) 100%);
  display: flex;
  justify-content: center;
  padding-top: var(--spacing-6);
  margin: 0;
}

.friends-container {
  width: 100%;
  max-width: 600px;
  background: var(--card-color);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  min-height: 500px;
}

.friends-header {
  padding: var(--spacing-4);
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--divider-color);
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
  border-bottom: 1px solid var(--divider-color);
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

.badge {
  background-color: var(--error-color);
  color: white;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  margin-left: var(--spacing-1);
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
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--ease-in-out);
  margin-bottom: var(--spacing-2);
}

.friend-item:hover {
  background-color: var(--bg-color);
}

.friend-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex: 1;
  cursor: pointer;
}

.friend-avatar {
  position: relative;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background-color: var(--success-color);
  border: 2px solid var(--card-color);
  border-radius: var(--radius-full);
}

.friend-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  flex: 1;
}

.friend-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.friend-group {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
}

.friend-actions {
  display: flex;
  gap: var(--spacing-2);
}

.request-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--ease-in-out);
  margin-bottom: var(--spacing-2);
  background-color: var(--bg-color);
}

.request-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex: 1;
}

.request-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.request-actions {
  display: flex;
  gap: var(--spacing-2);
}

.search-container {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
}

.search-container .input {
  flex: 1;
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-2);
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--ease-in-out);
  margin-bottom: var(--spacing-2);
}

.result-item:hover {
  background-color: var(--bg-color);
}

.result-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex: 1;
}

.result-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.form-group {
  margin-bottom: var(--spacing-4);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-2);
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
  
  .request-item {
    padding: var(--spacing-2);
  }
  
  .search-container {
    flex-direction: column;
  }
  
  .search-container .input {
    width: 100%;
  }
  
  .search-container .btn {
    width: 100%;
  }
}
/* --- UI统一修改结束 --- */
</style>
