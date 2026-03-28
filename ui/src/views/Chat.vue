<template>
  <div class="chat-layout">
    <div class="chat-sidebar glass-card">
      <div class="sidebar-header">
        <button class="btn btn-text back-btn" @click="router.push('/')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>返回</span>
        </button>
        <h2>{{ $t('chat.title') }}</h2>
        <button class="btn btn-primary create-group-btn" @click="showCreateGroupModal = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/>
            <path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
          <span>创建群聊</span>
        </button>
      </div>
      
      <!-- --- 修改开始 --- -->
      <!-- 移除好友/群组Tab，改为搜索框 -->
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索用户..." 
          class="search-input"
        />
      </div>
      <!-- --- 修改结束 --- -->
      
      <div class="chat-list">
        <div v-if="chatStore.loading" class="loading-state">
          <div class="loading-spinner"></div>
          <span>{{ $t('common.loading') }}</span>
        </div>
        <!-- --- 修改开始 --- -->
        <div v-else-if="filteredUsers.length === 0" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <span>暂无用户</span>
        </div>
        <div 
          v-for="user in filteredUsers" 
          :key="user.id" 
          class="chat-card card-transition"
          :class="{ active: currentChatUserId === user.id }"
          @click="startPrivateChat(user)"
        >
          <div class="chat-card-avatar">
            <Avatar :username="user.nickname || user.username" :src="user.avatar" :size="48" />
          </div>
          <div class="chat-card-content">
            <div class="chat-card-header">
              <span class="chat-card-name">{{ user.nickname || user.username }}</span>
            </div>
            <div class="chat-card-preview">{{ user.signature || '这个人很懒，什么都没写' }}</div>
          </div>
        </div>
        <!-- --- 修改结束 --- -->
      </div>
    </div>
    
    <div class="chat-main" v-if="chatStore.currentChat">
      <div class="chat-header glass-card">
        <div class="chat-header-info">
          <div class="header-avatar">
            <Avatar :username="chatStore.currentChat.name" :src="chatStore.currentChat.avatar" :size="48" />
          </div>
          <div class="header-details">
            <h3>{{ chatStore.currentChat.name }}</h3>
            <span class="header-status" v-if="chatStore.currentChat.type === 'private'">
              <span class="status-dot online"></span>
              {{ getFriendStatus(chatStore.currentChat.id) }}
            </span>
            <span class="header-status" v-else>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              {{ chatStore.currentChat.memberCount || 0 }} 成员
            </span>
          </div>
        </div>
        <div class="chat-header-actions">
          <button class="btn btn-icon" @click="showGroupSettingsModal = true" v-if="chatStore.currentChat.type === 'group'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="chat-messages">
        <div v-if="chatStore.loading" class="loading-state">
          <div class="loading-spinner"></div>
          <span>{{ $t('common.loading') }}</span>
        </div>
        <div v-else-if="chatStore.messages.length === 0" class="empty-messages">
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <h4>{{ $t('chat.select_conversation') }}</h4>
          <p>{{ $t('chat.select_conversation_sub') }}</p>
        </div>
        <div 
          v-for="message in chatStore.messages" 
          :key="message.id" 
          class="message-card"
          :class="{ 'own-message': isOwnMessage(message) }"
        >
          <div class="message-avatar">
            <Avatar :username="message.sender?.nickname || message.sender?.username || 'User'" :src="message.sender?.avatar" size="40" />
          </div>
          <div class="message-body">
            <div class="message-meta">
              <span class="message-sender">{{ message.sender?.nickname || message.sender?.username || 'User' }}</span>
              <span class="message-time">{{ formatTime(message.createTime) }}</span>
            </div>
            <div class="message-bubble glass-card">
              {{ message.content }}
            </div>
          </div>
        </div>
      </div>
      
      <div class="chat-input-area glass-card">
        <div class="input-wrapper">
          <input 
            type="text" 
            v-model="messageInput" 
            :placeholder="$t('chat.type_message')" 
            class="message-input"
            @keyup.enter="sendMessage"
          />
          <button class="btn btn-primary send-btn" @click="sendMessage" :disabled="!messageInput.trim()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22,2 15,22 11,13 2,9"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <div class="chat-empty" v-else>
      <div class="empty-content glass-card">
        <div class="empty-icon-large">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        </div>
        <h3>{{ $t('chat.select_conversation') }}</h3>
        <p>{{ $t('chat.select_conversation_sub') }}</p>
      </div>
    </div>
    
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
          <!-- --- 修改开始 --- -->
          <div 
            v-for="user in chatStore.allUsers" 
            :key="user.id"
            class="member-card card-transition"
            :class="{ selected: selectedMembers.includes(user.id) }"
            @click="toggleMember(user.id)"
          >
            <Avatar :username="user.nickname || user.username" :src="user.avatar" size="36" />
            <span class="member-name">{{ user.nickname || user.username }}</span>
            <div class="member-check" v-if="selectedMembers.includes(user.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </div>
          </div>
          <!-- --- 修改结束 --- -->
        </div>
      </div>
    </Modal>
    
    <Modal
      :visible="showGroupSettingsModal"
      :title="$t('chat.group_settings')"
      @close="showGroupSettingsModal = false"
    >
      <div v-if="chatStore.currentChat" class="group-settings">
        <div class="setting-card glass-card">
          <div class="setting-icon" style="background: linear-gradient(135deg, #4F46E5, #7C3AED);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div class="setting-info">
            <span class="setting-label">{{ $t('chat.name') }}</span>
            <span class="setting-value">{{ chatStore.currentChat.name }}</span>
          </div>
        </div>
        <div class="setting-card glass-card">
          <div class="setting-icon" style="background: linear-gradient(135deg, #10B981, #059669);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div class="setting-info">
            <span class="setting-label">{{ $t('chat.description') }}</span>
            <span class="setting-value">{{ chatStore.currentChat.description || 'N/A' }}</span>
          </div>
        </div>
        <div class="setting-card glass-card">
          <div class="setting-icon" style="background: linear-gradient(135deg, #F59E0B, #D97706);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/>
              <path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <div class="setting-info">
            <span class="setting-label">{{ $t('chat.members') }}</span>
            <span class="setting-value">{{ chatStore.currentChat.memberCount || 0 }} 人</span>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useChatStore } from '../stores/chat'
import { useFriendStore } from '../stores/friend'
import { useAuthStore } from '../stores/auth'
import { useSocketStore } from '../stores/socket'
import { useRouter } from 'vue-router'
import Avatar from '../components/Avatar.vue'
import Modal from '../components/Modal.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const chatStore = useChatStore()
const friendStore = useFriendStore()
const authStore = useAuthStore()
const socketStore = useSocketStore()

// --- 修改开始 ---
const searchQuery = ref('')
const currentChatUserId = ref(null)
// --- 修改结束 ---
const messageInput = ref('')
const showCreateGroupModal = ref(false)
const showGroupSettingsModal = ref(false)
const groupName = ref('')
const groupDescription = ref('')
const selectedMembers = ref([])

// --- 修改开始 ---
const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) {
    return chatStore.allUsers || []
  }
  const query = searchQuery.value.toLowerCase()
  return (chatStore.allUsers || []).filter(user => 
    (user.nickname || user.username || '').toLowerCase().includes(query) ||
    (user.email || '').toLowerCase().includes(query)
  )
})
// --- 修改结束 ---

const selectChat = async (chat) => {
  chatStore.setCurrentChat(chat)
  await chatStore.fetchMessages(chat.id)
  socketStore.joinChat(chat.id)
}

// --- 修改开始 ---
// 发起私聊
const startPrivateChat = async (user) => {
  try {
    currentChatUserId.value = user.id
    
    // 检查是否已存在与该用户的私聊
    const existingChat = chatStore.chats.find(chat => 
      chat.type === 'private' && chat.otherUser?.id === user.id
    )
    
    if (existingChat) {
      // 如果已存在，直接打开
      await selectChat(existingChat)
    } else {
      // 如果不存在，创建新的私聊
      const chatId = await chatStore.createChat('private', '', '', [user.id])
      if (chatId) {
        // 重新获取聊天列表
        await chatStore.fetchChats()
        // 找到刚创建的聊天并打开
        const newChat = chatStore.chats.find(chat => chat._id === chatId || chat.id === chatId)
        if (newChat) {
          await selectChat(newChat)
        }
      }
    }
  } catch (error) {
    console.error('Failed to start private chat:', error)
    alert('发起聊天失败：' + (error.message || '未知错误'))
  }
}
// --- 修改结束 ---

const sendMessage = async () => {
  if (!messageInput.value.trim() || !chatStore.currentChat) return
  
  const content = messageInput.value
  messageInput.value = ''
  
  // 1. 先发送到后端API，获取完整的消息数据
  const newMessage = await chatStore.sendMessage(chatStore.currentChat.id, content)
  
  // 2. 如果API返回成功，再通过socket发送通知（可选）
  if (newMessage) {
    socketStore.sendMessage(chatStore.currentChat.id, content)
  }
}

const createGroup = async () => {
  if (!groupName.value.trim()) {
    alert(t('chat.group_name_required') || '请输入群聊名称')
    return
  }
  if (selectedMembers.value.length === 0) {
    alert(t('chat.members_required') || '请选择至少一个成员')
    return
  }
  
  try {
    const chatId = await chatStore.createChat('group', groupName.value, '', selectedMembers.value)
    if (chatId) {
      await chatStore.fetchChats()
      showCreateGroupModal.value = false
      groupName.value = ''
      groupDescription.value = ''
      selectedMembers.value = []
      alert(t('chat.group_created') || '群聊创建成功')
    } else {
      alert(t('chat.group_create_failed') || '群聊创建失败')
    }
  } catch (error) {
    console.error('Failed to create group:', error)
    alert(error.message || t('chat.group_create_failed') || '群聊创建失败')
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
  return t('common.online')
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const isOwnMessage = (message) => {
  if (!message || !authStore.user) return false
  
  const messageUserId = message.userId || message.sender?.id
  const currentUserId = authStore.user._id || authStore.user.id
  
  return String(messageUserId) === String(currentUserId)
}

onMounted(async () => {
  if (authStore.token) {
    // --- 修改开始 ---
    await chatStore.fetchAllUsers() // 获取所有用户
    // --- 修改结束 ---
    await chatStore.fetchChats()
    await friendStore.fetchFriends()
  }
})

watch(() => authStore.token, async (newToken) => {
  if (newToken) {
    // --- 修改开始 ---
    await chatStore.fetchAllUsers() // 获取所有用户
    // --- 修改结束 ---
    await chatStore.fetchChats()
    await friendStore.fetchFriends()
  }
})
</script>

<style scoped>
.chat-layout {
  min-height: 100vh;
  background: var(--bg-gradient);
  display: flex;
  gap: var(--spacing-6);
  padding: var(--spacing-6);
}

.chat-sidebar {
  width: 340px;
  border-radius: var(--radius-3xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-md);
}

.sidebar-header {
  padding: var(--spacing-5);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-3);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  transition: all var(--duration-fast) var(--ease-in-out);
}

.back-btn:hover {
  background: rgba(79, 70, 229, 0.1);
  color: var(--primary-color);
}

.sidebar-header h2 {
  flex: 1;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  text-align: center;
}

.create-group-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

/* --- 修改开始 --- */
.search-box {
  padding: var(--spacing-3);
  border-bottom: 1px solid var(--border-light);
}

.search-input {
  width: 100%;
  padding: var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-sm);
  background-color: white;
  color: var(--text-primary);
  transition: all var(--duration-fast) var(--ease-in-out);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
}
/* --- 修改结束 --- */

.chat-tabs {
  display: flex;
  padding: var(--spacing-3);
  gap: var(--spacing-2);
}

.chat-tabs button {
  flex: 1;
  padding: var(--spacing-3);
  border: none;
  background: transparent;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-in-out);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
}

.chat-tabs button:hover {
  background: rgba(79, 70, 229, 0.1);
}

.chat-tabs button.active {
  background: linear-gradient(135deg, var(--primary-color), #7C3AED);
  color: white;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.chat-card {
  display: flex;
  align-items: center;
  padding: var(--spacing-4);
  border-radius: var(--radius-2xl);
  cursor: pointer;
  background: white;
  border: 1px solid var(--border-light);
  gap: var(--spacing-3);
}

.chat-card:hover {
  background: white;
  transform: translateX(4px);
  box-shadow: var(--shadow-md);
}

.chat-card.active {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(124, 58, 237, 0.08));
  border-color: var(--primary-color);
}

.chat-card-avatar {
  position: relative;
  flex-shrink: 0;
}

.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: linear-gradient(135deg, #EC4899, #DB2777);
  color: white;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  padding: 2px 6px;
  border-radius: var(--radius-full);
  min-width: 20px;
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.chat-card-content {
  flex: 1;
  min-width: 0;
}

.chat-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-1);
}

.chat-card-name {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-card-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  flex-shrink: 0;
  margin-left: var(--spacing-2);
}

.chat-card-preview {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  min-width: 0;
}

.chat-header {
  padding: var(--spacing-5);
  border-radius: var(--radius-3xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-md);
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.header-avatar {
  flex-shrink: 0;
}

.header-details h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-1) 0;
}

.header-status {
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
  box-shadow: 0 0 8px var(--success-color);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.message-card {
  display: flex;
  gap: var(--spacing-3);
  align-items: flex-start;
  max-width: 85%;
}

.message-card.own-message {
  flex-direction: row-reverse;
  margin-left: auto;
}

.message-avatar {
  flex-shrink: 0;
}

.message-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  flex: 1;
}

.message-card.own-message .message-body {
  align-items: flex-end;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: 0 var(--spacing-2);
}

.message-sender {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
}

.message-card.own-message .message-sender {
  color: var(--primary-color);
}

.message-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.message-bubble {
  padding: var(--spacing-4) var(--spacing-5);
  border-radius: var(--radius-2xl);
  border-top-left-radius: var(--radius-sm);
  font-size: var(--font-size-md);
  line-height: var(--line-height-normal);
  color: var(--text-primary);
  background: white;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.message-card.own-message .message-bubble {
  background: linear-gradient(135deg, var(--primary-color), #7C3AED);
  color: white;
  box-shadow: 0 8px 30px rgba(79, 70, 229, 0.3);
  border-radius: var(--radius-2xl);
  border-top-right-radius: var(--radius-sm);
}

.chat-input-area {
  padding: var(--spacing-4);
  border-radius: var(--radius-3xl);
  background: white;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-md);
}

.input-wrapper {
  display: flex;
  gap: var(--spacing-3);
  align-items: center;
}

.message-input {
  flex: 1;
  padding: var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-2xl);
  font-size: var(--font-size-md);
  background-color: white;
  color: var(--text-primary);
  transition: all var(--duration-fast) var(--ease-in-out);
}

.message-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-xl);
  padding: 0;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content {
  padding: var(--spacing-12);
  border-radius: var(--radius-3xl);
  text-align: center;
  background: white;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-md);
}

.empty-icon-large {
  margin-bottom: var(--spacing-6);
  color: var(--text-tertiary);
}

.empty-content h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-2);
  color: var(--text-primary);
}

.empty-content p {
  font-size: var(--font-size-md);
  color: var(--text-tertiary);
  margin: 0;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-8);
  color: var(--text-tertiary);
  gap: var(--spacing-3);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  color: var(--text-tertiary);
}

.empty-icon {
  margin-bottom: var(--spacing-4);
  opacity: 0.5;
}

.empty-messages h4 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-2);
}

.empty-messages p {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
}

.member-selector {
  max-height: 240px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
}

.member-card {
  display: flex;
  align-items: center;
  padding: var(--spacing-3);
  border-radius: var(--radius-xl);
  cursor: pointer;
  background: white;
  border: 1px solid var(--border-light);
  gap: var(--spacing-3);
}

.member-card:hover {
  background: white;
  box-shadow: var(--shadow-sm);
}

.member-card.selected {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(124, 58, 237, 0.08));
  border-color: var(--primary-color);
}

.member-name {
  flex: 1;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.member-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, var(--primary-color), #7C3AED);
  border-radius: 50%;
  color: white;
}

.group-settings {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.setting-card {
  display: flex;
  align-items: center;
  padding: var(--spacing-4);
  border-radius: var(--radius-2xl);
  gap: var(--spacing-4);
  background: white;
  border: 1px solid var(--border-light);
}

.setting-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.setting-label {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
}

.setting-value {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

@media (max-width: 1024px) {
  .chat-layout {
    padding: var(--spacing-4);
    gap: var(--spacing-4);
  }
  
  .chat-sidebar {
    width: 300px;
  }
  
  .message-card {
    max-width: 80%;
  }
}

@media (max-width: 768px) {
  .chat-layout {
    padding: var(--spacing-2);
    gap: var(--spacing-2);
  }
  
  .chat-sidebar {
    width: 260px;
    border-radius: var(--radius-2xl);
  }
  
  .chat-header,
  .chat-input-area {
    border-radius: var(--radius-2xl);
    padding: var(--spacing-3);
  }
  
  .message-card {
    max-width: 85%;
  }
  
  .chat-card {
    padding: var(--spacing-3);
  }
}

@media (max-width: 480px) {
  .chat-sidebar {
    width: 220px;
  }
  
  .sidebar-header h2 {
    font-size: var(--font-size-md);
  }
  
  .chat-tabs button {
    padding: var(--spacing-2);
    font-size: var(--font-size-xs);
  }
  
  .chat-card-name {
    font-size: var(--font-size-sm);
  }
  
  .chat-card-preview {
    font-size: var(--font-size-xs);
  }
  
  .message-bubble {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-sm);
  }
}
</style>
