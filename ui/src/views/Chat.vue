<template>
  <div class="chat-layout">
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <h2>{{ $t('chat.title') }}</h2>
        <button class="btn btn-text" @click="showCreateGroupModal = true">+</button>
      </div>
      
      <div class="chat-tabs">
        <button 
          :class="{ active: activeTab === 'friends' }" 
          @click="activeTab = 'friends'"
        >
          {{ $t('chat.friends') }}
        </button>
        <button 
          :class="{ active: activeTab === 'groups' }" 
          @click="activeTab = 'groups'"
        >
          {{ $t('chat.groups') }}
        </button>
      </div>
      
      <div class="chat-list">
        <div v-if="chatStore.loading" class="loading">{{ $t('common.loading') }}</div>
        <div v-else-if="filteredChats.length === 0" class="empty">{{ $t('chat.select_conversation') }}</div>
        <div 
          v-for="chat in filteredChats" 
          :key="chat.id" 
          class="chat-item"
          :class="{ active: chat.id === chatStore.currentChat?.id }"
          @click="selectChat(chat)"
        >
          <div class="chat-avatar">
            <Avatar :username="chat.name" :src="chat.avatar" />
            <span v-if="chat.unreadCount > 0" class="unread-badge">{{ chat.unreadCount }}</span>
          </div>
          <div class="chat-info">
            <div class="chat-name">{{ chat.name }}</div>
            <div class="chat-last-message">{{ chat.lastMessage || $t('chat.select_conversation') }}</div>
          </div>
          <div class="chat-time">{{ chat.lastMessageTime || '' }}</div>
        </div>
      </div>
    </div>
    
    <div class="chat-main" v-if="chatStore.currentChat">
      <div class="chat-header">
        <div class="chat-header-info">
          <Avatar :username="chatStore.currentChat.name" :src="chatStore.currentChat.avatar" />
          <div class="chat-header-details">
            <h3>{{ chatStore.currentChat.name }}</h3>
            <span class="chat-status" v-if="chatStore.currentChat.type === 'private'">
              {{ getFriendStatus(chatStore.currentChat.id) }}
            </span>
          </div>
        </div>
        <div class="chat-header-actions">
          <button class="btn btn-text" @click="showGroupSettingsModal = true" v-if="chatStore.currentChat.type === 'group'">
            ⚙️
          </button>
        </div>
      </div>
      
      <div class="chat-messages">
        <div v-if="chatStore.loading" class="loading">{{ $t('common.loading') }}</div>
        <div v-else-if="chatStore.messages.length === 0" class="empty">{{ $t('chat.select_conversation_sub') }}</div>
        <div 
          v-for="message in chatStore.messages" 
          :key="message.id" 
          class="message-item"
          :class="{ 'own-message': message.userId === authStore.user?.id }"
        >
          <div class="message-avatar">
            <Avatar :username="message.user?.username || 'User'" :src="message.user?.avatar" size="32" />
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="message-sender">{{ message.user?.username || 'User' }}</span>
              <span class="message-time">{{ formatTime(message.createTime) }}</span>
            </div>
            <div class="message-text">{{ message.content }}</div>
          </div>
        </div>
      </div>
      
      <div class="chat-input">
        <input 
          type="text" 
          v-model="messageInput" 
          :placeholder="$t('chat.type_message')" 
          class="input"
          @keyup.enter="sendMessage"
        />
        <button class="btn btn-primary" @click="sendMessage" :disabled="!messageInput.trim()">
          {{ $t('common.send') }}
        </button>
      </div>
    </div>
    
    <div class="chat-empty" v-else>
      <div class="empty-content">
        <h3>{{ $t('chat.select_conversation') }}</h3>
        <p>{{ $t('chat.select_conversation_sub') }}</p>
      </div>
    </div>
    
    <!-- Create Group Modal -->
    <Modal
      :visible="showCreateGroupModal"
      :title="$t('chat.create_group')"
      @close="showCreateGroupModal = false"
      @confirm="createGroup"
    >
      <div class="form-group">
        <label class="form-label">{{ $t('chat.group_name') }}</label>
        <input type="text" v-model="groupName" class="input" required />
      </div>
      <div class="form-group">
        <label class="form-label">{{ $t('chat.group_desc') }}</label>
        <input type="text" v-model="groupDescription" class="input" />
      </div>
      <div class="form-group">
        <label class="form-label">{{ $t('chat.add_members') }}</label>
        <div class="member-selector">
          <div 
            v-for="friend in friendStore.friends" 
            :key="friend.id"
            class="member-item"
            :class="{ selected: selectedMembers.includes(friend.id) }"
            @click="toggleMember(friend.id)"
          >
            <Avatar :username="friend.nickname || friend.username" :src="friend.avatar" size="32" />
            <span>{{ friend.nickname || friend.username }}</span>
          </div>
        </div>
      </div>
    </Modal>
    
    <!-- Group Settings Modal -->
    <Modal
      :visible="showGroupSettingsModal"
      :title="$t('chat.group_settings')"
      @close="showGroupSettingsModal = false"
    >
      <div v-if="chatStore.currentChat" class="group-settings">
        <div class="setting-item">
          <span class="setting-label">{{ $t('chat.name') }}</span>
          <span class="setting-value">{{ chatStore.currentChat.name }}</span>
        </div>
        <div class="setting-item">
          <span class="setting-label">{{ $t('chat.description') }}</span>
          <span class="setting-value">{{ chatStore.currentChat.description || 'N/A' }}</span>
        </div>
        <div class="setting-item">
          <span class="setting-label">{{ $t('chat.members') }}</span>
          <span class="setting-value">{{ chatStore.currentChat.memberCount || 0 }}</span>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>/* --- UI统一修改开始 --- */
import { ref, computed, onMounted, watch } from 'vue'
import { useChatStore } from '../stores/chat'
import { useFriendStore } from '../stores/friend'
import { useAuthStore } from '../stores/auth'
import { useSocketStore } from '../stores/socket'
import Avatar from '../components/Avatar.vue'
import Modal from '../components/Modal.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const chatStore = useChatStore()
const friendStore = useFriendStore()
const authStore = useAuthStore()
const socketStore = useSocketStore()

const activeTab = ref('friends')
const messageInput = ref('')
const showCreateGroupModal = ref(false)
const showGroupSettingsModal = ref(false)
const groupName = ref('')
const groupDescription = ref('')
const selectedMembers = ref([])

const filteredChats = computed(() => {
  if (activeTab.value === 'friends') {
    return chatStore.chats.filter(chat => chat.type === 'private')
  } else {
    return chatStore.chats.filter(chat => chat.type === 'group')
  }
})

const selectChat = async (chat) => {
  chatStore.setCurrentChat(chat)
  await chatStore.fetchMessages(chat.id)
  socketStore.joinChat(chat.id)
}

const sendMessage = async () => {
  if (!messageInput.value.trim() || !chatStore.currentChat) return
  
  await chatStore.sendMessage(chatStore.currentChat.id, messageInput.value)
  socketStore.sendMessage(chatStore.currentChat.id, messageInput.value)
  messageInput.value = ''
}

const createGroup = async () => {
  if (!groupName.value.trim() || selectedMembers.value.length === 0) return
  
  const chatId = await chatStore.createChat('group', groupName.value, '', selectedMembers.value)
  if (chatId) {
    await chatStore.fetchChats()
    showCreateGroupModal.value = false
    groupName.value = ''
    groupDescription.value = ''
    selectedMembers.value = []
  }
}

const toggleMember = (userId) => {
  const index = selectedMembers.value.indexOf(userId)
  if (index > -1) {
    selectedMembers.value.splice(index, 1)
  } else {
    selectedMembers.value.push(userId)
  }
}

const getFriendStatus = (chatId) => {
  // 这里应该根据好友ID获取在线状态
  return t('common.online')
}

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString()
}

onMounted(async () => {
  if (authStore.token) {
    await chatStore.fetchChats()
    await friendStore.fetchFriends()
  }
})

watch(() => authStore.token, async (newToken) => {
  if (newToken) {
    await chatStore.fetchChats()
    await friendStore.fetchFriends()
  }
})
/* --- UI统一修改结束 --- */
</script>

<style scoped>/* --- UI统一修改开始 --- */
.chat-layout {
  min-height: 100vh;
  background-color: var(--bg-color);
  display: flex;
  margin: 0;
}

.chat-sidebar {
  width: 300px;
  background-color: var(--card-color);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
}

.sidebar-header {
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--divider-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.chat-tabs {
  display: flex;
  border-bottom: 1px solid var(--divider-color);
}

.chat-tabs button {
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
}

.chat-tabs button.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-2);
}

.chat-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-in-out);
  margin-bottom: var(--spacing-1);
}

.chat-item:hover {
  background-color: var(--bg-color);
}

.chat-item.active {
  background-color: var(--primary-50);
}

.chat-avatar {
  position: relative;
  margin-right: var(--spacing-3);
}

.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: var(--error-color);
  color: white;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px 6px;
  border-radius: var(--radius-full);
  min-width: 18px;
  text-align: center;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-last-message {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-left: var(--spacing-2);
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
}

.chat-header {
  padding: var(--spacing-4);
  background-color: var(--card-color);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-sm);
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.chat-header-details h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-1) 0;
}

.chat-status {
  font-size: var(--font-size-sm);
  color: var(--success-color);
}

.chat-header-actions {
  display: flex;
  gap: var(--spacing-2);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.message-item {
  display: flex;
  gap: var(--spacing-3);
  align-items: flex-start;
}

.message-item.own-message {
  flex-direction: row-reverse;
}

.message-avatar {
  margin-top: var(--spacing-1);
}

.message-content {
  max-width: 70%;
  background-color: var(--card-color);
  padding: var(--spacing-3);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.message-item.own-message .message-content {
  background-color: var(--primary-color);
  color: white;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-1);
  font-size: var(--font-size-xs);
}

.message-sender {
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
}

.message-item.own-message .message-sender {
  color: rgba(255, 255, 255, 0.8);
}

.message-time {
  color: var(--text-tertiary);
}

.message-item.own-message .message-time {
  color: rgba(255, 255, 255, 0.6);
}

.message-text {
  font-size: var(--font-size-md);
  line-height: var(--line-height-normal);
}

.chat-input {
  padding: var(--spacing-4);
  background-color: var(--card-color);
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: var(--spacing-3);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.chat-input .input {
  flex: 1;
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  background-color: var(--bg-color);
  color: var(--text-primary);
}

.chat-input .input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.chat-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-color);
  color: var(--text-tertiary);
}

.empty-content {
  text-align: center;
}

.empty-content h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-2);
  color: var(--text-secondary);
}

.empty-content p {
  font-size: var(--font-size-md);
  color: var(--text-tertiary);
  margin: 0;
}

.loading, .empty {
  text-align: center;
  padding: var(--spacing-8);
  color: var(--text-tertiary);
}

.member-selector {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-2);
}

.member-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-in-out);
  margin-bottom: var(--spacing-1);
  gap: var(--spacing-2);
}

.member-item:hover {
  background-color: var(--bg-color);
}

.member-item.selected {
  background-color: var(--primary-50);
  border: 1px solid var(--primary-color);
}

.group-settings {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  background-color: var(--bg-color);
}

.setting-label {
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.setting-value {
  color: var(--text-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-sidebar {
    width: 250px;
  }
  
  .chat-messages {
    padding: var(--spacing-3);
  }
  
  .message-content {
    max-width: 80%;
  }
  
  .chat-input {
    padding: var(--spacing-3);
  }
  
  .chat-input .input {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-sm);
  }
  
  .btn {
    padding: var(--spacing-2) var(--spacing-4);
    font-size: var(--font-size-sm);
  }
}

@media (max-width: 480px) {
  .chat-sidebar {
    width: 200px;
  }
  
  .sidebar-header h2 {
    font-size: var(--font-size-md);
  }
  
  .chat-name {
    font-size: var(--font-size-sm);
  }
  
  .chat-last-message {
    font-size: var(--font-size-xs);
  }
  
  .message-content {
    max-width: 85%;
    padding: var(--spacing-2);
  }
  
  .message-text {
    font-size: var(--font-size-sm);
  }
}
/* --- UI统一修改结束 --- */
</style>
