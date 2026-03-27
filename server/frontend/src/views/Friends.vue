<template>
  <div class="friends-layout">
    <div class="sidebar">
      <div class="sidebar-header">
        <button class="back-btn" @click="router.push('/')">←</button>
        <h3>{{ $t('friends.title') }}</h3>
        <button class="add-btn" @click="showAddModal = true">+</button>
      </div>
      
      <div class="tabs">
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

      <div class="list-container" v-if="activeTab === 'friends'">
        <div v-if="friendStore.friends.length === 0" class="empty">{{ $t('friends.no_friends') }}</div>
        <div 
          v-for="friend in filteredFriends" 
          :key="friend.id" 
          class="user-item"
        >
          <div class="user-main" @click="startChat(friend.id)">
            <div class="avatar-wrapper">
              <Avatar :username="friend.nickname || friend.username" :src="friend.avatar" />
              <span v-if="chatStore.onlineUsers.has(friend.id)" class="online-indicator"></span>
            </div>
            <div class="friend-info">
              <span class="username">{{ friend.nickname || friend.username }}</span>
              <span class="group-name">{{ friend.groupName || '默认分组' }}</span>
            </div>
          </div>
          <div class="actions">
            <button class="action-btn chat" @click.stop="startChat(friend.id)">💬</button>
            <button class="action-btn edit" @click.stop="showEditFriendModal(friend)">✏️</button>
            <button class="action-btn block" @click.stop="blockUser(friend.id)" title="Block">🚫</button>
          </div>
        </div>
      </div>

      <div class="list-container" v-if="activeTab === 'blocked'">
        <div v-if="friendStore.blockedUsers.length === 0" class="empty">暂无屏蔽用户</div>
        <div 
          v-for="user in friendStore.blockedUsers" 
          :key="user.id" 
          class="user-item"
        >
          <div class="user-main">
            <Avatar :username="user.username" :src="user.avatar" />
            <span class="username">{{ user.username }}</span>
          </div>
          <button class="action-btn unblock" @click="unblockUser(user.id)">解除屏蔽</button>
        </div>
      </div>

      <div class="list-container" v-if="activeTab === 'requests'">
        <div v-if="friendStore.requests.length === 0" class="empty">{{ $t('friends.no_requests') }}</div>
        <div v-for="req in friendStore.requests" :key="req.id" class="request-item">
          <div class="req-info">
            <Avatar :username="req.user.username" :src="req.user.avatar" />
            <span class="username">{{ req.user.username }}</span>
          </div>
          <div class="req-actions">
            <button class="accept-btn" @click="friendStore.acceptRequest(req.id)">✓</button>
            <button class="reject-btn" @click="friendStore.rejectRequest(req.id)">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Friend Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <h3>{{ $t('friends.add_friend') }}</h3>
        <div class="search-container">
          <input 
            v-model="searchQuery" 
            @input="handleSearch" 
            :placeholder="$t('friends.search_placeholder')" 
            class="search-input"
          />
          <button @click="handleSearch" class="search-btn">🔍</button>
        </div>
        
        <div class="search-results">
          <div v-if="friendStore.loading" class="loading">{{ $t('common.loading') }}</div>
          <div 
            v-for="user in friendStore.searchResults" 
            :key="user.id" 
            class="result-item"
          >
            <div class="user-info">
              <Avatar :username="user.username" :src="user.avatar" :size="30" />
              <span>{{ user.username }}</span>
            </div>
            <button @click="sendRequest(user.id)" class="add-user-btn">{{ $t('friends.add') }}</button>
          </div>
        </div>
        
        <button class="close-btn" @click="showAddModal = false">{{ $t('common.close') }}</button>
      </div>
    </div>

    <!-- Alert Modal -->
    <Modal
      :visible="showAlertModal"
      :title="$t('common.alert')"
      :showCancel="false"
      :confirmText="$t('common.ok')"
      @close="showAlertModal = false"
      @confirm="showAlertModal = false"
    >
      <div>{{ alertMessage }}</div>
    </Modal>

    <!-- Confirm Modal -->
    <Modal
      :visible="showConfirmModal"
      :title="$t('common.confirm')"
      @close="showConfirmModal = false"
      @confirm="handleConfirm"
    >
      <div>{{ confirmMessage }}</div>
    </Modal>

    <!-- Edit Friend Modal -->
    <div v-if="showEditFriendModalVisible" class="modal-overlay" @click.self="showEditFriendModalVisible = false">
      <div class="modal">
        <h3>编辑好友信息</h3>
        <div class="form-group">
          <label>备注</label>
          <input v-model="editFriendInfo.nickname" placeholder="输入备注" class="modal-input" />
        </div>
        <div class="form-group">
          <label>分组</label>
          <select v-model="editFriendInfo.groupName" class="modal-input">
            <option v-for="group in friendGroups" :key="group" :value="group">{{ group }}</option>
            <option value="新分组">新分组</option>
          </select>
        </div>
        <div class="form-group" v-if="editFriendInfo.groupName === '新分组'">
          <label>新分组名称</label>
          <input v-model="newGroupName" placeholder="输入新分组名称" class="modal-input" />
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showEditFriendModalVisible = false">{{ $t('common.cancel') }}</button>
          <button class="confirm-btn" @click="handleUpdateFriendInfo">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useFriendStore } from '../stores/friend'
import { useRouter } from 'vue-router'
import { useChatStore } from '../stores/chat'
import Avatar from '../components/Avatar.vue'
import Modal from '../components/Modal.vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'

const { t } = useI18n()
const friendStore = useFriendStore()
const chatStore = useChatStore()
const router = useRouter()

const activeTab = ref('friends')
const showAddModal = ref(false)
const searchQuery = ref('')
let searchTimeout = null

// Modal state
const showAlertModal = ref(false)
const alertMessage = ref('')
const showConfirmModal = ref(false)
const confirmMessage = ref('')
const confirmCallback = ref(null)

// Edit friend modal
const showEditFriendModalVisible = ref(false)
const editFriendInfo = ref({ id: '', nickname: '', groupName: '' })
const friendGroups = ref(['默认分组'])
const newGroupName = ref('')

onMounted(async () => {
  await friendStore.fetchFriends()
  await friendStore.fetchRequests()
  await friendStore.fetchBlockedUsers()
  await fetchFriendGroups()
})

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    friendStore.searchUsers(searchQuery.value)
  }, 300)
}

const showAlert = (message) => {
  alertMessage.value = message
  showAlertModal.value = true
}

const showConfirm = (message, callback) => {
  confirmMessage.value = message
  confirmCallback.value = callback
  showConfirmModal.value = true
}

const handleConfirm = () => {
  if (confirmCallback.value) {
    confirmCallback.value()
  }
  showConfirmModal.value = false
  confirmCallback.value = null
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
    const res = await axios.get('/api/friend/groups', {
      headers: { Authorization: `Bearer ${friendStore.token}` }
    })
    friendGroups.value = res.data
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

    await axios.put(`/api/friend/${editFriendInfo.value.id}`, 
      { 
        nickname: editFriendInfo.value.nickname, 
        groupName 
      }, 
      {
        headers: { Authorization: `Bearer ${friendStore.token}` }
      }
    )
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
      showAlert(t('friends.request_sent'))
      showAddModal.value = false
      searchQuery.value = ''
      friendStore.searchResults = []
    }
  } catch (error) {
    showAlert(error.message || t('friends.request_failed'))
  }
}

const startChat = (friendId) => {
  chatStore.setActiveConversation(friendId)
  router.push('/chat')
}

const blockUser = async (userId) => {
  showConfirm('确定要屏蔽这个用户吗？', async () => {
    await friendStore.blockUser(userId);
  })
}

const unblockUser = async (userId) => {
  await friendStore.unblockUser(userId);
}
</script>

<style scoped>
.friends-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%);
  display: flex;
  justify-content: center;
  padding-top: 2rem;
  margin: 0;
}

/* ... existing styles ... */

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-radius: 12px;
  transition: background 0.2s;
}

.user-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  flex: 1;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;
  border-radius: 4px;
}

.action-btn:hover {
  background-color: #e5e7eb;
}

.action-btn.block {
  font-size: 1rem;
  opacity: 0.6;
}

.action-btn.block:hover {
  opacity: 1;
  color: var(--error);
}

.action-btn.unblock {
  font-size: 0.9rem;
  color: var(--primary-color);
  font-weight: 500;
}

.request-item {
  display: flex;
  justify-content: center;
  padding-top: 2rem;
}

.sidebar {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 20px;
  box-shadow: var(--shadow);
  overflow: hidden;
  min-height: 500px;
}

.sidebar-header {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
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

.add-btn {
  background-color: var(--primary-color);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #f3f4f6;
}

.tabs button {
  flex: 1;
  padding: 1rem;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-light);
  border-bottom: 2px solid transparent;
}

.tabs button.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.badge {
  background-color: var(--error);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  margin-left: 5px;
}

.list-container {
  padding: 1rem;
}

.user-item, .request-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  justify-content: space-between;
}

.user-item:hover {
  background-color: #f9fafb;
}

.req-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 40px;
  height: 40px;
  background-color: #e0e7ff;
  color: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.avatar-wrapper {
  position: relative;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background-color: #10b981;
  border: 2px solid white;
  border-radius: 50%;
}

.username {
  font-weight: 500;
}

.req-actions {
  display: flex;
  gap: 0.5rem;
}

.accept-btn {
  background-color: var(--success);
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
}

.reject-btn {
  background-color: var(--error);
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 20px;
  width: 90%;
  max-width: 400px;
}

.search-container {
  display: flex;
  align-items: center;
  margin: 1rem 0;
  width: 100%;
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

/* 响应式设计 */
@media (max-width: 480px) {
  .search-container {
    flex-direction: column;
  }
  
  .search-input {
    width: 100%;
  }
  
  .search-btn {
    width: 100%;
  }
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
  margin: 1rem 0;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  overflow: hidden;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  transition: background 0.2s;
}

.result-item:hover {
  background-color: #f9fafb;
}

.friend-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.group-name {
  font-size: 0.8rem;
  color: var(--text-light);
}

.action-btn.edit {
  font-size: 1rem;
  opacity: 0.6;
}

.action-btn.edit:hover {
  opacity: 1;
  color: var(--primary-color);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.add-user-btn {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.add-user-btn:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.close-btn {
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}
</style>
