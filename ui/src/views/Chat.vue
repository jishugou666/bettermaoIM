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
      <!-- 添加所有用户/群组Tab -->
      <div class="chat-tabs">
        <button 
          class="tab-button"
          :class="{ active: currentTab === 'users' }"
          @click="currentTab = 'users'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/>
            <path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
          所有用户
        </button>
        <button 
          class="tab-button"
          :class="{ active: currentTab === 'groups' }"
          @click="currentTab = 'groups'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/>
            <path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
          群聊
        </button>
      </div>
      
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          :placeholder="currentTab === 'users' ? '搜索用户...' : '搜索群聊...'" 
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
        <template v-else>
          <!-- 所有用户 Tab 内容 -->
          <div v-if="currentTab === 'users'">
            <div v-if="filteredUsers.length === 0" class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 21v-2a4 4 0 00-3-3.87M4 21v-2a4 4 0 013-3.87"/>
                <circle cx="8" cy="7" r="4"/>
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
          </div>
          
          <!-- 群聊 Tab 内容 -->
          <div v-else-if="currentTab === 'groups'">
            <div v-if="filteredGroups.length === 0" class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
              <span>暂无群聊</span>
            </div>
            <div 
              v-for="group in filteredGroups" 
              :key="group.id || group._id" 
              class="chat-card card-transition"
              :class="{ active: chatStore.currentChat?.id === group.id || chatStore.currentChat?._id === group._id }"
              @click="selectChat(group)"
            >
              <div class="chat-card-avatar">
                <Avatar :username="group.name" :src="group.avatar" :size="48" />
                <span v-if="getUnreadCount(group) > 0" class="unread-badge">{{ getUnreadCount(group) }}</span>
              </div>
              <div class="chat-card-content">
                <div class="chat-card-header">
                  <span class="chat-card-name">{{ group.name }}</span>
                </div>
                <div class="chat-card-preview">{{ getChatLatestMessage(group) }}</div>
              </div>
            </div>
          </div>
        </template>
        <!-- --- 修改结束 --- -->
      </div>
    </div>
    
    <div class="chat-main-wrapper">
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
              <Avatar :username="message.sender?.nickname || message.sender?.username || 'User'" :src="message.sender?.avatar" :size="40" />
            </div>
            <div class="message-body">
              <div class="message-meta">
                <span class="message-sender">{{ message.sender?.nickname || message.sender?.username || 'User' }}</span>
                <span class="message-time">{{ formatTime(message) }}</span>
                <span style="font-size: 10px; color: #999; margin-left: 8px;">
                  [ID: {{ message.userId || message.sender?.id }}]
                </span>
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
    </div>
    
    <!-- --- 右侧信息面板 --- -->
    <div class="chat-info-panel glass-card" v-if="chatStore.currentChat">
      <!-- 私聊信息 -->
      <div v-if="chatStore.currentChat.type === 'private'" class="private-info">
        <div class="info-header">
          <Avatar :username="chatStore.currentChat.name" :src="chatStore.currentChat.avatar" :size="80" />
          <h3 class="info-name">{{ chatStore.currentChat.name }}</h3>
          <p class="info-signature">{{ chatStore.currentChat.otherUser?.signature || '这个人很懒，什么都没写' }}</p>
        </div>
        
        <div class="info-section">
          <div class="info-item">
            <span class="info-label">用户名</span>
            <span class="info-value">{{ chatStore.currentChat.otherUser?.username || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">邮箱</span>
            <span class="info-value">{{ chatStore.currentChat.otherUser?.email || '-' }}</span>
          </div>
        </div>
        
        <!-- 用户动态列表 -->
        <div class="info-section">
          <h4 class="section-title">用户动态</h4>
          <div v-if="getCurrentUserMoments.length > 0" class="user-moments">
            <div 
              v-for="moment in getCurrentUserMoments.slice(0, 5)" 
              :key="moment.id"
              class="moment-item"
            >
              <p class="moment-content">{{ moment.content }}</p>
              <span class="moment-time">{{ formatMomentTime(moment.createdAt) }}</span>
            </div>
          </div>
          <div v-else class="empty-moments">
            <span>暂无公开动态</span>
          </div>
        </div>
      </div>
      
      <!-- 群聊信息 -->
      <div v-else class="group-info">
        <div class="info-header">
          <Avatar :username="currentGroup?.name || chatStore.currentChat.name" :src="currentGroup?.avatar || chatStore.currentChat.avatar" :size="80" />
          <h3 class="info-name">{{ currentGroup?.name || chatStore.currentChat.name }}</h3>
          <p class="info-signature">{{ currentGroup?.description || chatStore.currentChat.description || '暂无描述' }}</p>
        </div>
        
        <div class="info-section">
          <div class="info-item">
            <span class="info-label">创建时间</span>
            <span class="info-value">{{ formatDate(currentGroup?.createTime || chatStore.currentChat.createTime) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">成员数量</span>
            <span class="info-value">{{ currentGroup?.members?.length || chatStore.currentChat.memberCount || 0 }} 人</span>
          </div>
        </div>
        
        <div class="info-section">
          <h4 class="section-title">群成员</h4>
          <div class="member-list">
            <div 
              v-for="member in sortedMembers" 
              :key="member.id"
              class="member-item"
            >
              <div class="member-avatar-wrapper" @click="isCurrentUserAdminOrOwner && toggleMemberActions(member.id)">
                <Avatar :username="member.nickname || member.username" :src="member.avatar" :size="40" />
                <!-- 功能按钮下拉菜单 -->
                <transition name="fade">
                  <div v-if="isCurrentUserAdminOrOwner && expandedMemberId === member.id" class="member-actions-dropdown">
                    <!-- 群主可以设置管理员和删除 -->
                    <button v-if="isCurrentUserOwner && member.id !== currentGroup?.creatorId" class="action-btn" @click.stop="setAsAdmin(member)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                        <path d="M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                      设置管理员
                    </button>
                    <!-- 群主和管理员都可以删除 -->
                    <button v-if="member.id !== currentGroup?.creatorId" class="action-btn danger" @click.stop="removeGroupMember(member)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                      移除成员
                    </button>
                  </div>
                </transition>
              </div>
              <div class="member-info">
                <span class="member-name">{{ member.nickname || member.username }}</span>
                <div class="member-tags">
                  <span v-if="member.id === currentGroup?.creatorId" class="tag tag-owner">群主</span>
                  <span v-else-if="member.role === 'ADMIN'" class="tag tag-admin">管理员</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useChatStore } from '../stores/chat'
import { useFriendStore } from '../stores/friend'
import { useAuthStore } from '../stores/auth'
import { useSocketStore } from '../stores/socket'
import { useMomentStore } from '../stores/moment'
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
const momentStore = useMomentStore()

// 当前查看用户的动态
const userMoments = ref([])

// 筛选当前聊天用户的动态（不含私密内容）
const getCurrentUserMoments = computed(() => {
  if (!chatStore.currentChat || chatStore.currentChat.type !== 'private') {
    return []
  }
  
  const otherUserId = chatStore.currentChat.otherUser?.id
  if (!otherUserId) return []
  
  // 从 momentStore 中筛选该用户的非私密动态
  return momentStore.feed.filter(moment => {
    const momentUserId = String(moment.user?.id || moment.user?._id)
    return momentUserId === String(otherUserId) && !moment.isPrivate
  })
})

// --- 修改开始 ---
const searchQuery = ref('')
const currentChatUserId = ref(null)
const currentTab = ref('users') // 当前选中的 Tab: 'users' 或 'groups'
// --- 修改结束 ---
const messageInput = ref('')
const showCreateGroupModal = ref(false)
const showGroupSettingsModal = ref(false)
const groupName = ref('')
const groupDescription = ref('')
const selectedMembers = ref([])
const currentGroup = ref(null)

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

// 筛选群聊列表
const filteredGroups = computed(() => {
  const groups = chatStore.groupChats || []
  if (!searchQuery.value.trim()) {
    return groups
  }
  const query = searchQuery.value.toLowerCase()
  return groups.filter(group => 
    (group.name || '').toLowerCase().includes(query) ||
    (group.description || '').toLowerCase().includes(query)
  )
})
// --- 修改结束 ---

const selectChat = async (chat) => {
  console.log('[Chat] 选择聊天:', chat.id || chat._id);
  chatStore.setCurrentChat(chat)
  await chatStore.fetchMessages(chat.id || chat._id)
  socketStore.joinChat(chat.id || chat._id)
  
  // 如果是群聊，获取群详情
  if (chat.type === 'group') {
    await loadGroupDetails(chat.id || chat._id)
  } else {
    currentGroup.value = null
  }
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
  
  // 只发送到后端API，后端会负责通过Socket推送给所有成员
  await chatStore.sendMessage(chatStore.currentChat.id, content)
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
    const chatId = await chatStore.createChat('group', groupName.value, '', selectedMembers.value, groupDescription.value)
    if (chatId) {
      await chatStore.fetchChats() // 刷新聊天列表
      currentTab.value = 'groups' // 自动切换到群聊 Tab
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
  // 兼容不同的时间字段名
  const timeStr = dateStr.created_at || dateStr.createdAt || dateStr.createTime || dateStr
  const date = new Date(timeStr)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatMomentTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const isOwnMessage = (message) => {
  if (!message || !authStore.user) return false
  
  // 支持多种可能的字段名，确保兼容性
  const messageUserId = 
    message.userId || 
    message.sender_id || 
    message.senderId ||
    message.sender?.id || 
    message.sender?._id
  
  const currentUserId = 
    authStore.user._id || 
    authStore.user.id
  
  console.log('[Chat] isOwnMessage 判断:', { messageUserId, currentUserId, message, authUser: authStore.user })
  return String(messageUserId) === String(currentUserId)
}

// 排序后的群成员列表
const sortedMembers = computed(() => {
  if (!currentGroup.value?.members) return [];
  
  return [...currentGroup.value.members].sort((a, b) => {
    // 群主优先级最高
    if (a.id === currentGroup.value.creatorId) return -1;
    if (b.id === currentGroup.value.creatorId) return 1;
    
    // 管理员次之
    if (a.role === 'ADMIN') return -1;
    if (b.role === 'ADMIN') return 1;
    
    // 普通成员
    return 0;
  });
});

// 判断当前用户是否是群主
const isCurrentUserOwner = computed(() => {
  return authStore.user && (
    String(authStore.user._id || authStore.user.id) === 
    String(currentGroup.value?.creatorId)
  );
});

// 判断当前用户是否是管理员或群主
const isCurrentUserAdminOrOwner = computed(() => {
  if (!authStore.user || !currentGroup.value) return false;
  
  const currentUserId = String(authStore.user._id || authStore.user.id);
  
  // 群主
  if (currentUserId === String(currentGroup.value.creatorId)) return true;
  
  // 管理员
  const currentMember = currentGroup.value.members?.find(m => 
    String(m.id || m._id) === currentUserId
  );
  return currentMember?.role === 'ADMIN';
});

// 当前展开的功能按钮的成员ID
const expandedMemberId = ref(null);

// 切换成员功能按钮展开
const toggleMemberActions = (memberId) => {
  if (expandedMemberId.value === memberId) {
    expandedMemberId.value = null;
  } else {
    expandedMemberId.value = memberId;
  }
};

// 设置成员为管理员
const setAsAdmin = async (member) => {
  if (!currentGroup.value || !chatStore.currentChat) return;
  
  const chatId = chatStore.currentChat._id || chatStore.currentChat.id;
  const success = await chatStore.setMemberRoleAction(chatId, member.id, 'ADMIN');
  if (success) {
    alert('已设置为管理员');
    await loadGroupDetails(chatId);
    expandedMemberId.value = null;
  }
};

// 移除成员
const removeGroupMember = async (member) => {
  if (!currentGroup.value || !chatStore.currentChat) return;
  
  if (!confirm(`确定要移除成员 ${member.nickname || member.username} 吗？`)) {
    return;
  }
  
  const chatId = chatStore.currentChat._id || chatStore.currentChat.id;
  const success = await chatStore.removeMemberAction(chatId, member.id);
  if (success) {
    alert('成员已移除');
    await loadGroupDetails(chatId);
    expandedMemberId.value = null;
  }
};

// 获取聊天最新消息
const getChatLatestMessage = (chat) => {
  const chatId = chat._id || chat.id;
  const latestMessage = chatStore.getLatestMessage(chatId);
  if (latestMessage) {
    return latestMessage.content || '暂无消息';
  }
  // 如果没有最新消息，返回个性签名作为占位符
  return chat.otherUser?.signature || chat.description || '暂无消息';
};

// 获取未读消息数
const getUnreadCount = (chat) => {
  const chatId = chat._id || chat.id;
  return chatStore.getUnreadCount(chatId);
};

// 加载群详情
const loadGroupDetails = async (chatId) => {
  try {
    const actualChatId = chatStore.currentChat?._id || chatStore.currentChat?.id || chatId;
    console.log('[Chat] 加载群详情, originalChatId:', chatId, 'actualChatId:', actualChatId);
    const group = await chatStore.fetchGroupDetails(actualChatId)
    console.log('[Chat] 群详情加载成功:', group);
    currentGroup.value = group
  } catch (error) {
    console.error('[Chat] 加载群详情失败:', error)
  }
}

onMounted(async () => {
  if (authStore.token) {
    // --- 修改开始 ---
    await chatStore.fetchAllUsers() // 获取所有用户
    await momentStore.fetchFeed() // 获取动态列表
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

// 监听当前聊天变化，重新加载群详情
watch(() => chatStore.currentChat, async (newChat) => {
  if (newChat?.type === 'group') {
    await loadGroupDetails(newChat.id || newChat._id)
  } else {
    currentGroup.value = null
  }
})
</script>

<style scoped>
.chat-layout {
  height: 100vh;
  background: var(--bg-gradient);
  display: flex;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  box-sizing: border-box;
  overflow: hidden;
}

.chat-sidebar {
  width: 340px;
  border-radius: var(--radius-3xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
  height: 100%;
  min-height: 0;
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
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}
/* --- 修改结束 --- */

.chat-tabs {
  display: flex;
  padding: var(--spacing-3);
  gap: var(--spacing-2);
  position: relative;
}

.chat-tabs .tab-button {
  flex: 1;
  padding: var(--spacing-3);
  border: none;
  background: transparent;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  position: relative;
  z-index: 1;
}

.chat-tabs .tab-button:hover {
  transform: scale(1.02);
  background: rgba(79, 70, 229, 0.08);
}

.chat-tabs .tab-button:active {
  transform: scale(0.98);
}

.chat-tabs .tab-button.active {
  background: linear-gradient(135deg, var(--primary-color), #7C3AED);
  color: white;
  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
}

/* 点选特效 - 波纹 */
.tab-button::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
}

.tab-button:active::after {
  width: 120%;
  height: 120%;
  opacity: 0;
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Tab 内容过渡动画 */
.chat-list > div {
  animation: fadeInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  mask-image: linear-gradient(to bottom, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%);
  padding-top: 24px;
  padding-bottom: 24px;
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

.chat-main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
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
  background: white;
  border-radius: var(--radius-3xl);
  mask-image: linear-gradient(to bottom, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%);
  padding-top: 24px;
  padding-bottom: 24px;
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
  min-width: 0;
  align-items: flex-start;
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
  display: inline-block;
  max-width: 100%;
  word-wrap: break-word;
  word-break: break-word;
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
}

.message-input:focus {
  outline: none;
  border-color: var(--primary-color);
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

/* --- 右侧信息面板样式 --- */
.chat-info-panel {
  width: 320px;
  border-radius: var(--radius-3xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}

.info-header {
  padding: var(--spacing-6);
  text-align: center;
  border-bottom: 1px solid var(--border-light);
}

.info-header .info-name {
  margin: var(--spacing-3) 0 var(--spacing-2) 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.info-header .info-signature {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.info-section {
  padding: var(--spacing-5);
  border-bottom: 1px solid var(--border-light);
}

.info-section:last-child {
  border-bottom: none;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) 0;
}

.info-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.info-value {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.section-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-3) 0;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.member-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-in-out);
}

.member-item:hover {
  background: var(--bg-hover);
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.member-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.member-tags {
  display: flex;
  gap: var(--spacing-2);
}

.tag {
  font-size: var(--font-size-xs);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-medium);
}

.tag-owner {
  background: linear-gradient(135deg, #F59E0B, #D97706);
  color: white;
}

.tag-admin {
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: white;
}

.member-avatar-wrapper {
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}

.member-avatar-wrapper:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

.member-actions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-2);
  z-index: 100;
  min-width: 140px;
  border: 1px solid var(--border-light);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: transparent;
  border: none;
  transition: all var(--duration-fast) var(--ease-in-out);
}

.action-btn:hover {
  background: var(--bg-hover);
}

.action-btn.danger {
  color: #EF4444;
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.user-moments {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  max-height: 250px;
  overflow-y: auto;
  mask-image: linear-gradient(to bottom, transparent 0%, black 16px, black calc(100% - 16px), transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 16px, black calc(100% - 16px), transparent 100%);
  padding-top: 16px;
  padding-bottom: 16px;
}

.moment-item {
  padding: var(--spacing-3);
  background: rgba(79, 70, 229, 0.05);
  border-radius: var(--radius-xl);
  border-left: 3px solid var(--primary-color);
}

.moment-content {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.moment-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-top: var(--spacing-1);
  display: block;
}

.empty-moments {
  text-align: center;
  padding: var(--spacing-6) var(--spacing-3);
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
}

.user-moments::-webkit-scrollbar {
  width: 4px;
}

.user-moments::-webkit-scrollbar-track {
  background: transparent;
}

.user-moments::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-2);
  z-index: 1000;
  min-width: 160px;
  border: 1px solid var(--border-light);
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  transition: all var(--duration-fast) var(--ease-in-out);
}

.context-menu-item:hover {
  background: var(--bg-hover);
}

.context-menu-item.danger {
  color: #EF4444;
}

.context-menu-item.danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

@media (max-width: 1200px) {
  .chat-info-panel {
    width: 280px;
  }
}

@media (max-width: 1024px) {
  .chat-info-panel {
    display: none;
  }
  
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