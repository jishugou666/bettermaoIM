<template>
  <div class="chat-container">
    <div class="chat-card">
      <div class="chat-content">
        <!-- 左侧会话列表 -->
        <div class="sidebar-card">
          <div class="sidebar">
            <div class="sidebar-header">
              <button class="back-btn" @click="router.push('/')">←</button>
              <h3>{{ $t('chat.title') }}</h3>
              <button class="add-group-btn" @click="showCreateGroup = true" :title="$t('chat.create_group')">+</button>
            </div>
            <div class="conversation-list">
              <!-- Groups Section -->
              <div v-if="chatStore.groups.length > 0" class="section-label">{{ $t('chat.groups') }}</div>
              <div 
                v-for="group in chatStore.groups" 
                :key="'g'+group.id"
                class="conversation-item"
                :class="{ active: chatStore.activeConversationId === group.id && chatStore.activeConversationType === 'group' }"
                @click="chatStore.setActiveConversation(group.id, 'group')"
              >
                <div class="avatar-container">
                  <div class="avatar-wrapper">
                    <Avatar :username="group.name" :src="group.avatar" color="#dbeafe" text-color="#2563eb" />
                    <span v-if="chatStore.unreadCounts.group[group.id] > 0" class="unread-badge">{{ chatStore.unreadCounts.group[group.id] }}</span>
                  </div>
                </div>
                <div class="info">
                  <span class="username">{{ group.name }}</span>
                  <span class="last-msg">
                    <span v-if="group.lastMessage">
                      {{ group.lastMessage.type === 'text' ? group.lastMessage.content : `[${group.lastMessage.type}]` }}
                    </span>
                    <span v-else>{{ group.memberCount }} members</span>
                  </span>
                </div>
              </div>

              <!-- Direct Messages Section -->
              <div class="section-label">{{ $t('chat.friends') }}</div>
              <div 
                v-for="user in chatStore.conversations" 
                :key="'u'+user.id"
                class="conversation-item"
                :class="{ active: chatStore.activeConversationId === user.id && chatStore.activeConversationType === 'user' }"
                @click="chatStore.setActiveConversation(user.id, 'user')"
              >
                <div class="avatar-container">
                  <div class="avatar-wrapper">
                    <Avatar :username="user.username" :src="user.avatar" />
                    <span v-if="chatStore.unreadCounts.user[user.id] > 0" class="unread-badge">{{ chatStore.unreadCounts.user[user.id] }}</span>
                  </div>
                </div>
                <div class="info">
                  <div class="name-row">
                    <span class="username">
                      {{ user.username }}
                      <span v-if="authStore.user && user.id === authStore.user.id" class="self-tag">(本人)</span>
                    </span>
                    <span class="time-ago" v-if="user.lastMessage">{{ formatTimeAgo(user.lastMessage.createdAt) }}</span>
                  </div>
                  <div class="msg-row">
                    <span class="last-msg" v-if="user.lastMessage">
                      {{ user.lastMessage.isRecalled ? '🚫 ' + t('chat.recalled') : (user.lastMessage.type === 'text' ? user.lastMessage.content : `[${user.lastMessage.type}]`) }}
                    </span>
                    <span class="status-dot" :class="{ online: chatStore.onlineUsers.has(user.id) }"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间聊天区域 -->
        <div class="chat-area-card">
          <div class="chat-content-wrapper">
            <transition name="slide-fade">
              <div v-if="chatStore.activeConversationId" class="chat-container-inner">
                <div class="chat-header">
                  <Avatar 
                    :username="chatStore.activeTarget?.username || chatStore.activeTarget?.name" 
                    :src="chatStore.activeTarget?.avatar" 
                  />
                  <div class="header-info">
                    <span class="username">{{ chatStore.activeTarget?.username || chatStore.activeTarget?.name }}</span>
                    <span v-if="chatStore.activeConversationType === 'user' && chatStore.typingUsers.has(chatStore.activeConversationId)" class="typing-indicator">{{ $t('chat.typing') }}</span>
                    <span v-if="chatStore.activeConversationType === 'group'" class="group-info">{{ chatStore.activeTarget?.description || 'Group Chat' }}</span>
                  </div>
                </div>

                <div class="messages-list" ref="messagesList">
                  <div 
                    v-for="msg in chatStore.activeMessages" 
                    :key="msg.id" 
                    class="message-bubble"
                    :class="{ 'sent': authStore.user && msg.senderId === authStore.user.id, 'received': !authStore.user || msg.senderId !== authStore.user.id }"
                    @contextmenu.prevent="showContextMenu($event, msg)"
                  >
                    <div class="sender-name" v-if="chatStore.activeConversationType === 'group' && (!authStore.user || msg.senderId !== authStore.user.id)">
                      {{ msg.sender?.username }}
                    </div>
                    <div class="bubble-content" v-if="msg.isRecalled">
                      <span class="recalled-text">🚫 {{ t('chat.recalled') }}</span>
                    </div>
                    <div class="bubble-content" v-else-if="msg.type === 'text'">
                      {{ msg.content }}
                      <span v-if="msg.isEdited" class="edited-tag"> (edited)</span>
                    </div>
                    <div class="bubble-content image-content" v-else-if="msg.type === 'image'">
                      <img :src="getFullUrl(msg.content)" @click="window.open(getFullUrl(msg.content), '_blank')" />
                    </div>
                    <div class="bubble-content file-content" v-else-if="msg.type === 'code'">
                      <div class="file-icon">📄</div>
                      <div class="file-info">
                        <a :href="getFullUrl(parseCodeContent(msg.content).url)" target="_blank" class="file-name">
                          {{ parseCodeContent(msg.content).name }}
                        </a>
                        <span class="file-size">{{ formatSize(parseCodeContent(msg.content).size) }}</span>
                      </div>
                    </div>
                    <div class="bubble-content" v-else>
                      [Unsupported message type]
                    </div>
                    <span class="time">{{ formatTime(msg.createdAt) }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                <div class="icon">💬</div>
                <h3>{{ $t('chat.select_conversation') }}</h3>
                <p>{{ $t('chat.select_conversation_sub') }}</p>
              </div>
            </transition>
            
            <!-- 底部功能栏卡片 -->
            <transition name="slide-up">
              <div v-if="chatStore.activeConversationId" class="input-area-card">
                <div v-if="editingMessage" class="editing-indicator">
                  <span>{{ t('chat.editing') }}</span>
                  <button class="cancel-edit-btn" @click="cancelEdit">{{ t('chat.cancel_edit') }}</button>
                </div>
                
                <div class="input-content">
                  <!-- 多功能操作区 -->
                  <button class="attach-btn" @click="fileInput.click()" title="Upload Image">📷</button>
                  <button v-if="chatStore.activeConversationType === 'group'" class="attach-btn" @click="codeFileInput.click()" title="Upload Code File">📄</button>
                  <button class="attach-btn" @click="showTipModal = true" :title="$t('chat.send_tip')">💰</button>
                  <button class="attach-btn" @click="showEmojiPicker = !showEmojiPicker" title="Emoji">😊</button>
                  
                  <input 
                    type="file" 
                    ref="fileInput" 
                    class="hidden" 
                    accept="image/*" 
                    @change="handleFileUpload" 
                  />
                  <input 
                    type="file" 
                    ref="codeFileInput" 
                    class="hidden" 
                    @change="handleCodeUpload" 
                  />

                  <input 
                    v-model="newMessage" 
                    @keyup.enter="handleSendOrSave"
                    @input="handleTyping"
                    :placeholder="$t('chat.type_message')"
                    ref="messageInput"
                    class="input"
                  />
                  <button @click="handleSendOrSave" :disabled="!newMessage.trim()" class="btn btn-primary">{{ editingMessage ? $t('common.save') : $t('common.send') }}</button>
                </div>

                <!-- 表情包选择器 -->
                <div v-if="showEmojiPicker" class="emoji-picker">
                  <div class="emoji-header">
                    <h4>Emojis</h4>
                    <button class="close-btn" @click="showEmojiPicker = false">×</button>
                  </div>
                  <div class="emoji-grid">
                    <button 
                      v-for="emoji in emojis" 
                      :key="emoji"
                      class="emoji-btn"
                      @click="addEmoji(emoji)"
                    >
                      {{ emoji }}
                    </button>
                  </div>
                  <div class="emoji-footer">
                    <button class="custom-emoji-btn" @click="showCustomEmoji = true">Custom Emojis</button>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- 右侧详细信息 -->
        <transition name="slide-fade">
          <div v-if="chatStore.activeConversationId" class="details-sidebar">
            <div class="details-header">
              <h3>{{ chatStore.activeConversationType === 'group' ? $t('chat.group_settings') : '个人信息' }}</h3>
            </div>
            <div class="details-content">
              <!-- 个人信息展示 -->
              <div v-if="chatStore.activeConversationType === 'user'" class="user-details">
                <div class="user-avatar-section">
                  <div class="avatar-container" @click="showAvatarModal = true">
                    <Avatar :username="chatStore.activeTarget?.username" :src="chatStore.activeTarget?.avatar" :size="80" />
                    <span class="avatar-overlay">👁️</span>
                  </div>
                  <h4>{{ chatStore.activeTarget?.username }}</h4>
                  <span class="status-badge" :class="{ online: chatStore.onlineUsers.has(chatStore.activeConversationId) }">
                    {{ chatStore.onlineUsers.has(chatStore.activeConversationId) ? '在线' : '离线' }}
                  </span>
                </div>
                
                <div class="bio-section">
                  <h5>关于</h5>
                  <div class="bio-content" :class="{ expanded: expandedBio }">
                    {{ chatStore.activeTarget?.bio || '暂无个人简介' }}
                  </div>
                  <button v-if="(chatStore.activeTarget?.bio || '').length > 100" class="expand-btn" @click="expandedBio = !expandedBio">
                    {{ expandedBio ? '收起' : '展开' }}
                  </button>
                </div>
                
                <div class="recent-activity">
                  <h5>最近动态</h5>
                  <div class="activity-timeline">
                    <div v-for="(activity, index) in userActivities" :key="index" class="activity-item">
                      <div class="activity-dot"></div>
                      <div class="activity-content">
                        <div class="activity-text">{{ activity.text }}</div>
                        <div class="activity-time">{{ activity.time }}</div>
                      </div>
                    </div>
                    <div v-if="userActivities.length === 0" class="empty-activity">暂无最近动态</div>
                  </div>
                </div>
              </div>
              
              <!-- 群聊信息展示 -->
              <div v-else class="group-details">
                <div class="group-header">
                  <div class="avatar-container" @click="showAvatarModal = true">
                    <Avatar :username="chatStore.activeTarget?.name" :src="chatStore.activeTarget?.avatar" color="#dbeafe" text-color="#2563eb" :size="80" />
                    <span class="avatar-overlay">👁️</span>
                  </div>
                  <div class="group-info">
                    <h4 @click="showGroupNameEdit = true">{{ chatStore.activeTarget?.name }}</h4>
                    <p class="group-description">{{ chatStore.activeTarget?.description || '暂无描述' }}</p>
                  </div>
                </div>
                
                <div class="member-list-section">
                  <h5>成员 ({{ groupMembers.length || 0 }})</h5>
                  <div class="member-list">
                    <div 
                      v-for="member in groupMembers" 
                      :key="member.id" 
                      class="member-item"
                      @contextmenu.prevent="showMemberContextMenu($event, member)"
                    >
                      <Avatar :username="member.username" :src="member.avatar" :size="40" />
                      <div class="member-info">
                        <span class="member-name">{{ member.username }}</span>
                        <span v-if="member.id === chatStore.activeTarget?.creatorId" class="member-badge owner">群主</span>
                        <span v-else-if="member.role === 'ADMIN'" class="member-badge admin">管理员</span>
                      </div>
                    </div>
                    <div v-if="groupMembers.length === 0" class="empty-members">暂无成员</div>
                  </div>
                </div>
                
                <button class="action-btn" @click="showGroupSettingsModal = true">{{ $t('chat.group_settings') }}</button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Context Menu -->
    <div 
      v-if="contextMenu.show" 
      class="context-menu" 
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.self="closeContextMenu"
    >
      <div class="menu-item" @click="startEditMessage" v-if="canEdit(contextMenu.message)">
        ✏️ Edit
      </div>
      <div class="menu-item delete" @click="recallMessage" v-if="canRecall(contextMenu.message)">
        ↩️ Recall
      </div>
      <div class="menu-item" v-if="!canEdit(contextMenu.message) && !canRecall(contextMenu.message)">
        No actions available
      </div>
    </div>

    <!-- Overlay for context menu to close on click outside -->
    <div v-if="contextMenu.show" class="context-menu-overlay" @click="closeContextMenu"></div>

    <TipModal 
      :show="showTipModal" 
      :toUserId="chatStore.activeConversationType === 'user' ? chatStore.activeConversationId : null"
      @close="showTipModal = false"
      @success="handleTipSuccess"
    />

    <!-- Group Settings Modal -->
    <transition name="modal-fade">
      <div v-if="showGroupSettingsModal" class="modal-overlay" @click.self="showGroupSettingsModal = false">
        <div class="modal group-settings-modal">
          <div class="modal-header">
            <h3>{{ t('chat.group_settings') }}</h3>
            <button class="close-btn" @click="showGroupSettingsModal = false">×</button>
          </div>
          <div class="modal-body">
            <div class="group-info-section">
              <div class="info-item">
                <strong>{{ t('chat.name') }}:</strong>
                <span>{{ chatStore.activeTarget?.name }}</span>
              </div>
              <div class="info-item">
                <strong>{{ t('chat.description') }}:</strong>
                <span>{{ chatStore.activeTarget?.description || '暂无描述' }}</span>
              </div>
              <div class="info-item">
                <strong>{{ t('chat.creator_id') }}:</strong>
                <span>{{ chatStore.activeTarget?.creatorId }}</span>
              </div>
            </div>
            
            <div class="member-list-section">
              <h4>{{ t('chat.members') }} ({{ groupMembers.length }})</h4>
              <div class="member-list">
                 <div v-for="member in groupMembers" :key="member.id" class="member-item">
                   <Avatar :username="member.username" :src="member.avatar" :size="30" />
                   <span>{{ member.username }}</span>
                   <span v-if="member.id === chatStore.activeTarget?.creatorId" class="badge owner-badge">{{ t('chat.owner') }}</span>
                   <span v-else-if="member.role === 'ADMIN'" class="badge admin-badge">管理员</span>
                   
                   <div class="member-actions" v-if="isGroupAdmin">
                     <button 
                       v-if="member.id !== authStore.user.id" 
                       class="btn btn-danger" 
                       @click="kickMember(member.id)"
                     >{{ t('chat.kick') }}</button>
                     <button 
                       v-if="member.id !== authStore.user.id && isGroupOwner" 
                       class="btn btn-primary" 
                       @click="transferOwnership(member.id)"
                     >{{ t('chat.transfer_owner') }}</button>
                   </div>
                 </div>
                 <div v-if="groupMembers.length === 0" class="empty-members">暂无成员</div>
              </div>
            </div>
          </div>
          <div class="modal-actions">
             <button class="btn btn-primary" @click="showAddMember = true">{{ t('chat.add_member') }}</button>
             <button class="btn btn-secondary" @click="showGroupSettingsModal = false">{{ t('chat.close') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Add Member Modal (Nested or separate) -->
    <transition name="modal-fade">
      <div v-if="showAddMember" class="modal-overlay" @click.self="showAddMember = false">
         <div class="modal add-member-modal" style="z-index: 1001;">
           <div class="modal-header">
             <h3>{{ t('chat.add_member') }}</h3>
             <button class="close-btn" @click="showAddMember = false">×</button>
           </div>
           <div class="modal-body">
             <div class="member-list">
                <div 
                  v-for="user in availableUsersToAdd" 
                  :key="user.id"
                  class="member-item"
                  :class="{ selected: selectedMembersToAdd.includes(user.id) }"
                  @click="toggleMemberToAdd(user.id)"
                >
                  <Avatar :username="user.username" :src="user.avatar" :size="30" />
                  <span>{{ user.username }}</span>
                  <span class="check" v-if="selectedMembersToAdd.includes(user.id)">✓</span>
                </div>
                <div v-if="availableUsersToAdd.length === 0" class="empty-members">暂无用户可添加</div>
             </div>
           </div>
           <div class="modal-actions">
             <button class="cancel-btn" @click="showAddMember = false">{{ t('chat.cancel') }}</button>
             <button class="confirm-btn" @click="handleAddMembers">{{ t('chat.add') }}</button>
           </div>
         </div>
      </div>
    </transition>

    <!-- Create Group Modal -->
    <transition name="modal-fade">
      <div v-if="showCreateGroup" class="modal-overlay" @click.self="showCreateGroup = false">
        <div class="modal create-group-modal">
          <div class="modal-header">
            <h3>{{ $t('chat.create_group') }}</h3>
            <button class="close-btn" @click="showCreateGroup = false">×</button>
          </div>
          <div class="modal-body">
            <input v-model="newGroupName" :placeholder="$t('chat.group_name')" class="modal-input" />
            <textarea v-model="newGroupDesc" :placeholder="$t('chat.group_desc')" class="modal-input" rows="3"></textarea>
            
            <div class="member-select">
              <h4>{{ $t('chat.add_members') }}</h4>
              <div class="member-list">
                <div 
                  v-for="user in chatStore.conversations" 
                  :key="user.id"
                  class="member-item"
                  :class="{ selected: selectedMembers.includes(user.id) }"
                  @click="toggleMember(user.id)"
                >
                  <Avatar :username="user.username" :src="user.avatar" :size="30" />
                  <span>{{ user.username }}</span>
                  <span class="check" v-if="selectedMembers.includes(user.id)">✓</span>
                </div>
                <div v-if="chatStore.conversations.length === 0" class="empty-members">暂无好友可添加</div>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="cancel-btn" @click="showCreateGroup = false">{{ $t('common.cancel') }}</button>
            <button class="confirm-btn" @click="handleCreateGroup" :disabled="!newGroupName.trim()">{{ $t('common.confirm') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Avatar Modal -->
    <div v-if="showAvatarModal" class="modal-overlay" @click.self="showAvatarModal = false">
      <div class="modal avatar-modal">
        <div class="modal-header">
          <h3>{{ chatStore.activeTarget?.username || chatStore.activeTarget?.name }}</h3>
          <button class="close-btn" @click="showAvatarModal = false">×</button>
        </div>
        <div class="avatar-preview">
          <img 
            :src="getFullUrl(chatStore.activeTarget?.avatar) || `https://ui-avatars.com/api/?name=${chatStore.activeTarget?.username || chatStore.activeTarget?.name}&background=random&color=fff`" 
            :alt="chatStore.activeTarget?.username || chatStore.activeTarget?.name"
            class="avatar-image"
          />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showAvatarModal = false">{{ $t('common.close') }}</button>
        </div>
      </div>
    </div>

    <!-- Member Context Menu -->
    <div v-if="memberContextMenu.show" class="context-menu" :style="{ top: memberContextMenu.y + 'px', left: memberContextMenu.x + 'px' }">
      <div class="menu-item" @click="setAdmin(memberContextMenu.member.id)" v-if="isGroupOwner && memberContextMenu.member.role !== 'ADMIN'">
        👑 设置管理员
      </div>
      <div class="menu-item delete" @click="kickMember(memberContextMenu.member.id)" v-if="isGroupAdmin && memberContextMenu.member.id !== authStore.user?.id">
        🚫 移除成员
      </div>
    </div>

    <!-- Inbox Modal -->
    <div v-if="showInbox" class="modal-overlay" @click.self="showInbox = false">
      <div class="modal">
        <h3>{{ $t('chat.inbox') }}</h3>
        <div class="inbox-content">
          <div v-if="inboxMessages.length === 0" class="empty-inbox">
            No new messages
          </div>
          <div v-else class="message-list">
            <div 
              v-for="message in inboxMessages" 
              :key="message.id"
              class="inbox-message-item"
              @click="openConversation(message)"
            >
              <Avatar :username="message.sender.username" :src="message.sender.avatar" :size="40" />
              <div class="message-info">
                <div class="message-header">
                  <span class="message-sender">{{ message.sender.username }}</span>
                  <span class="message-time">{{ formatTime(message.createdAt) }}</span>
                </div>
                <div class="message-preview">{{ message.content }}</div>
              </div>
              <span v-if="!message.isRead" class="unread-dot"></span>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showInbox = false">{{ $t('common.close') }}</button>
          <button class="confirm-btn" @click="markAllAsRead">{{ $t('chat.mark_all_read') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onActivated, watch, nextTick, computed } from 'vue'
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Avatar from '../components/Avatar.vue'
import uploadApi from '../api/upload'
import TipModal from '../components/TipModal.vue'
import axios from 'axios'

const chatStore = useChatStore()
const authStore = useAuthStore()
const router = useRouter()
const { t } = useI18n()
const newMessage = ref('')
const messagesList = ref(null)
const messageInput = ref(null)
const fileInput = ref(null)
const codeFileInput = ref(null)
const showTipModal = ref(false)
const showCreateGroup = ref(false)
const showGroupSettingsModal = ref(false)
const showAddMember = ref(false)
const groupMembers = ref([])
const selectedMembersToAdd = ref([])
const availableUsersToAdd = ref([])
const showEmojiPicker = ref(false)
const showCustomEmoji = ref(false)
const emojis = ref(['😊', '😂', '😍', '🤔', '😢', '👍', '👎', '❤️', '🎉', '🔥', '🤣', '🙏', '🤩', '😎', '😡', '🤗', '🤫', '🤭', '🤔', '🤓', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥳', '🥺', '🤠', '🥰', '😘', '😋', '🤤', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😠', '😡', '🤬', '😈', '👿', '💀', '👻', '👽', '🤖', '💩', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'])
const showAvatarModal = ref(false)
const expandedBio = ref(false)
const userActivities = ref([])

// 获取用户动态
const fetchUserActivities = async (userId) => {
  try {
    console.log('Fetching user activities for user ID:', userId);
    const res = await axios.get(`/api/moment/feed`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    console.log('User activities received:', res.data);
    
    // 转换数据格式
    userActivities.value = res.data.map(moment => ({
      text: `发布了一条新动态：${moment.content}`,
      time: formatTimeAgo(moment.createdAt)
    }));
    console.log('Mapped user activities:', userActivities.value);
  } catch (error) {
    console.error('Failed to fetch user activities:', error);
    userActivities.value = [];
  }
}

// 格式化时间
const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return '刚刚';
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString();
  }
}
const memberContextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  member: null
})
const showGroupNameEdit = ref(false)
const showInbox = ref(false)
const inboxMessages = ref([
  {
    id: 1,
    sender: { username: '技术秒', avatar: '' },
    content: 'Hello, how are you?',
    createdAt: new Date().toISOString(),
    isRead: false,
    conversationId: 2,
    conversationType: 'user'
  },
  {
    id: 2,
    sender: { username: '测试群', avatar: '' },
    content: 'Welcome to the group!',
    createdAt: new Date().toISOString(),
    isRead: true,
    conversationId: 1,
    conversationType: 'group'
  }
])
const unreadMessageCount = ref(1)

const newGroupName = ref('')
const newGroupDesc = ref('')
const selectedMembers = ref([])
const editingMessage = ref(null)
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  message: null
})
let typingTimeout = null

const isGroupAdmin = computed(() => {
  return chatStore.activeTarget?.creatorId === authStore.user?.id || chatStore.activeTarget?.role === 'ADMIN';
})

const isGroupOwner = computed(() => {
  return chatStore.activeTarget?.creatorId === authStore.user?.id;
})

const showGroupSettings = async () => {
  if (chatStore.activeConversationType !== 'group') return;
  
  // Fetch group details including members
  try {
    const res = await axios.get(`/api/chat/groups/${chatStore.activeConversationId}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    const group = res.data;
    // Map members correctly
    groupMembers.value = group.members.map(m => ({
      ...m.user,
      role: m.role
    }));
    
    // Prepare add member list (friends not in group)
    const currentMemberIds = groupMembers.value.map(m => m.id);
    availableUsersToAdd.value = chatStore.conversations.filter(u => !currentMemberIds.includes(u.id));
    
    showGroupSettingsModal.value = true;
  } catch (err) {
    console.error('Failed to fetch group details', err);
  }
}

const toggleMemberToAdd = (userId) => {
  if (selectedMembersToAdd.value.includes(userId)) {
    selectedMembersToAdd.value = selectedMembersToAdd.value.filter(id => id !== userId)
  } else {
    selectedMembersToAdd.value.push(userId)
  }
}

const handleAddMembers = async () => {
  if (selectedMembersToAdd.value.length === 0) return;
  
  const success = await chatStore.addMembers(chatStore.activeConversationId, selectedMembersToAdd.value);
  if (success) {
    showAddMember.value = false;
    selectedMembersToAdd.value = [];
    showGroupSettings(); // Refresh
  }
}

const kickMember = async (userId) => {
  if (confirm(t('chat.confirm_kick'))) {
    const success = await chatStore.kickMember(chatStore.activeConversationId, userId);
    if (success) {
      showGroupSettings(); // Refresh
    }
  }
}

const transferOwnership = async (userId) => {
  if (confirm(t('chat.confirm_transfer'))) {
    const success = await chatStore.transferOwnership(chatStore.activeConversationId, userId);
    if (success) {
      showGroupSettingsModal.value = false; // Close modal as roles changed
      chatStore.fetchConversations(); // Refresh list
    }
  }
}

const toggleMember = (userId) => {
  if (selectedMembers.value.includes(userId)) {
    selectedMembers.value = selectedMembers.value.filter(id => id !== userId)
  } else {
    selectedMembers.value.push(userId)
  }
}

const handleCreateGroup = async () => {
  if (!newGroupName.value.trim()) return
  
  const group = await chatStore.createGroup(newGroupName.value, newGroupDesc.value, selectedMembers.value)
  if (group) {
    showCreateGroup.value = false
    newGroupName.value = ''
    newGroupDesc.value = ''
    selectedMembers.value = []
    chatStore.setActiveConversation(group.id, 'group')
  }
}

const getFullUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}${path}`
}

onMounted(async () => {
  chatStore.initializeSocket()
  await chatStore.fetchConversations()
})

onActivated(async () => {
  // 当组件被激活时，重新获取会话列表，确保数据是最新的
  if (!chatStore.socket || !chatStore.isConnected) {
    chatStore.initializeSocket()
  }
  await chatStore.fetchConversations()
})

onUnmounted(() => {
  chatStore.disconnectSocket()
})

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesList.value) {
      messagesList.value.scrollTop = messagesList.value.scrollHeight
    }
  })
}

watch(() => chatStore.activeMessages.length, scrollToBottom)
watch(() => chatStore.activeConversationId, scrollToBottom)

// Watch for active conversation changes to load messages and group members
watch(
  [() => chatStore.activeConversationId, () => chatStore.activeConversationType],
  async ([newId, newType]) => {
    console.log('Watch triggered:', { newId, newType });
    if (newId) {
      await chatStore.fetchHistory(newId, newType)
      // 如果是群聊，自动获取群成员信息
      if (newType === 'group') {
        try {
          console.log('Loading group members for group ID:', newId);
          console.log('Auth token exists:', !!authStore.token);
          const res = await axios.get(`/api/chat/groups/${newId}`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
          });
          console.log('Group data received:', res.data);
          console.log('Group members array:', res.data.members);
          console.log('Group members length:', res.data.members ? res.data.members.length : 'undefined');
          const group = res.data;
          // Map members correctly
          if (group && group.members) {
            console.log('Processing group members:', group.members);
            groupMembers.value = group.members.map(m => ({
              ...m.user,
              role: m.role
            }));
            console.log('Mapped group members:', groupMembers.value);
            console.log('Mapped group members length:', groupMembers.value.length);
          } else {
            console.error('Group data is invalid:', group);
            groupMembers.value = [];
          }
        } catch (error) {
          console.error('Failed to load group members:', error);
          if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
          } else if (error.request) {
            console.error('Request error:', error.request);
          } else {
            console.error('Error message:', error.message);
          }
        }
      } else {
        console.log('Not a group conversation, clearing group members');
        groupMembers.value = [];
        // 如果是用户会话，获取用户动态
        console.log('Loading user activities for user ID:', newId);
        await fetchUserActivities(newId);
      }
    } else {
      console.log('No active conversation, clearing group members');
      groupMembers.value = [];
      userActivities.value = [];
    }
  },
  { immediate: true }
)

const sendMessage = () => {
  if (!newMessage.value.trim()) return
  chatStore.sendMessage(newMessage.value)
  newMessage.value = ''
  chatStore.sendStopTyping()
}

const handleSendOrSave = () => {
  if (editingMessage.value) {
    saveEdit()
  } else {
    sendMessage()
  }
}

const showContextMenu = (e, msg) => {
  if (msg.isRecalled) return;
  contextMenu.value = {
    show: true,
    x: e.clientX,
    y: e.clientY,
    message: msg
  }
}

const closeContextMenu = () => {
  contextMenu.value.show = false
}

const canEdit = (msg) => {
  if (!msg || msg.senderId !== authStore.user?.id || msg.type !== 'text') return false;
  // Check time limit (5 mins)
  const createdAt = new Date(msg.createdAt);
  const diff = (new Date() - createdAt) / 1000 / 60;
  return diff <= 5;
}

const canRecall = (msg) => {
  if (!msg || msg.senderId !== authStore.user?.id) return false;
  // Check time limit (10 mins)
  const createdAt = new Date(msg.createdAt);
  const diff = (new Date() - createdAt) / 1000 / 60;
  return diff <= 10;
}

const startEditMessage = () => {
  const msg = contextMenu.value.message;
  if (!msg) return;
  
  editingMessage.value = msg;
  newMessage.value = msg.content;
  closeContextMenu();
  
  nextTick(() => {
    messageInput.value?.focus();
  });
}

const cancelEdit = () => {
  editingMessage.value = null;
  newMessage.value = '';
}

const saveEdit = () => {
  if (!editingMessage.value || !newMessage.value.trim()) return;
  
  chatStore.editMessage(editingMessage.value.id, newMessage.value);
  
  editingMessage.value = null;
  newMessage.value = '';
}

const recallMessage = () => {
  const msg = contextMenu.value.message;
  if (!msg) return;
  
  if (confirm(t('chat.confirm_recall'))) {
    chatStore.recallMessage(msg.id);
  }
  closeContextMenu();
}

const handleFileUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const res = await uploadApi.uploadChatImage(formData)
    chatStore.sendMessage(res.data.url, 'image')
  } catch (err) {
    console.error('Upload failed', err)
    alert('Failed to send image')
  }
  
  // Reset input
  if (fileInput.value) fileInput.value.value = ''
}

const handleCodeUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const res = await uploadApi.uploadGroupFile(formData)
    // Store metadata as JSON
    const content = JSON.stringify({
      url: res.data.url,
      name: res.data.originalName,
      size: res.data.size
    })
    chatStore.sendMessage(content, 'code')
  } catch (err) {
    console.error('Upload failed', err)
    alert('Failed to send file. Only code/text files < 1MB allowed.')
  }
  
  // Reset input
  if (codeFileInput.value) codeFileInput.value.value = ''
}

const parseCodeContent = (content) => {
  try {
    const data = JSON.parse(content)
    return {
      url: data.url || content,
      name: data.name || 'File',
      size: data.size || 0
    }
  } catch (e) {
    // Fallback for non-JSON content
    return { url: content, name: 'File', size: 0 }
  }
}

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const handleTyping = () => {
  chatStore.sendTyping()
  clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => {
    chatStore.sendStopTyping()
  }, 2000)
}

const handleTipSuccess = (amount) => {
  // We can also insert a local message to show tip sent?
  // For now just alert or toast
  alert(t('credit.tip_sent', { amount }))
}

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatTimeAgo = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return diffDay + 'd';
  if (diffHour > 0) return diffHour + 'h';
  if (diffMin > 0) return diffMin + 'm';
  return 'now';
}

const addEmoji = (emoji) => {
  newMessage.value += emoji;
  showEmojiPicker.value = false;
  nextTick(() => {
    messageInput.value?.focus();
  });
}

const showMemberContextMenu = (e, member) => {
  memberContextMenu.value = {
    show: true,
    x: e.clientX,
    y: e.clientY,
    member: member
  }
}

const setAdmin = async (memberId) => {
  try {
    const res = await axios.post(`/api/chat/groups/${chatStore.activeConversationId}/members/${memberId}/admin`, {}, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    console.log('Set admin response:', res.data);
    memberContextMenu.value.show = false;
    // 刷新成员列表
    await showGroupSettings();
  } catch (error) {
    console.error('Failed to set admin:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

const openConversation = (message) => {
  chatStore.setActiveConversation(message.conversationId, message.conversationType);
  showInbox.value = false;
  // 标记为已读
  message.isRead = true;
  unreadMessageCount.value = inboxMessages.value.filter(msg => !msg.isRead).length;
}

const markAllAsRead = () => {
  inboxMessages.value.forEach(msg => {
    msg.isRead = true;
  });
  unreadMessageCount.value = 0;
}
</script>

<style scoped>
.chat-container {
  height: 100vh;
  margin: 0;
  padding: 2rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.chat-card {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  box-sizing: border-box;
}

.chat-content {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: space-between;
  align-items: stretch;
  gap: 2rem;
}

/* 大卡片底板 */
.sidebar-card,
.chat-area-card,
.details-sidebar {
  flex-shrink: 0;
  border-radius: 12px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 600px;
  max-height: 600px;
}

.sidebar-card {
  width: 300px;
}

.chat-area-card {
  flex: 1;
  min-width: 400px;
}

.details-sidebar {
  width: 320px;
  border-left: none;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .chat-card {
    padding: 1.5rem;
  }
  
  .chat-content {
    gap: 1.5rem;
  }
  
  .sidebar-card {
    width: 280px;
  }
  
  .details-sidebar {
    width: 300px;
  }
  
  .chat-area-card {
    min-width: 350px;
  }
}

@media (max-width: 992px) {
  .chat-card {
    padding: 1rem;
  }
  
  .chat-content {
    gap: 1rem;
  }
  
  .sidebar-card {
    width: 250px;
  }
  
  .details-sidebar {
    width: 280px;
  }
  
  .chat-area-card {
    min-width: 300px;
  }
}

@media (max-width: 768px) {
  .chat-card {
    padding: 0.75rem;
  }
  
  .chat-content {
    gap: 0.75rem;
  }
  
  .sidebar-card {
    width: 220px;
  }
  
  .details-sidebar {
    width: 250px;
  }
  
  .chat-area-card {
    min-width: 280px;
  }
}

/* 过渡动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(30px) scaleY(0.95);
  opacity: 0;
  max-height: 0;
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  max-height: 400px;
}

/* 底部功能栏弹入动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(50px);
  opacity: 0;
}

/* 模态框动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal,
.modal-fade-leave-to .modal {
  transform: scale(0.95) translateY(-20px);
}

.modal-fade-enter-to .modal,
.modal-fade-leave-from .modal {
  transform: scale(1) translateY(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 头像点击弹出层样式 */
.avatar-modal {
  width: 400px;
  max-width: 90vw;
  border-radius: 16px;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.avatar-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--glass-border);
}

.avatar-modal .modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.avatar-modal .close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-light);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.avatar-modal .close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-color);
}

.avatar-preview {
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.5);
}

.avatar-image {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 群聊设置界面样式 */
.group-settings-modal {
  width: 500px;
  max-width: 90vw;
  border-radius: 16px;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.group-settings-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--glass-border);
  flex-shrink: 0;
}

.group-settings-modal .modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.group-settings-modal .close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-light);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.group-settings-modal .close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-color);
}

.group-info-section {
  padding: 1.5rem;
  border-bottom: 1px solid var(--glass-border);
  flex-shrink: 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item strong {
  color: var(--text-light);
  font-weight: 500;
}

.info-item span {
  color: var(--text-color);
  font-weight: 500;
}

.group-settings-modal .member-list-section {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.group-settings-modal .member-list-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.group-settings-modal .member-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.group-settings-modal .member-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.owner-badge {
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: auto;
}

.admin-badge {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: auto;
}

.member-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.modal-actions {
  padding: 1.5rem;
  border-top: 1px solid var(--glass-border);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  flex-shrink: 0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: var(--text-color);
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

/* 滚动条样式 */
.activity-timeline::-webkit-scrollbar,
.member-list::-webkit-scrollbar {
  width: 6px;
}

.activity-timeline::-webkit-scrollbar-track,
.member-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.activity-timeline::-webkit-scrollbar-thumb,
.member-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.activity-timeline::-webkit-scrollbar-thumb:hover,
.member-list::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

.details-header {
  padding: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  background: white;
}

.details-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
}

.details-content {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex-shrink: 0;
}

.group-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex-shrink: 0;
}

.member-list-section {
  flex-shrink: 1;
  min-height: 0;
}

.member-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-right: 0.5rem;
}

/* 个人信息样式 */
.user-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 1rem;
}

.avatar-container {
  position: relative;
  cursor: pointer;
  margin-bottom: 0.75rem;
}

.avatar-overlay {
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.user-avatar-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  background: #f3f4f6;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.status-badge.online {
  background: #d1fae5;
  color: #065f46;
}

.bio-section {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.bio-section h5 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}

.bio-content {
  font-size: 0.85rem;
  line-height: 1.4;
  color: #4b5563;
  max-height: 3.6rem; /* 3 lines */
  overflow: hidden;
  position: relative;
}

.bio-content.expanded {
  max-height: none;
  overflow: visible;
}

.expand-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-top: 0.5rem;
  width: auto;
}

.recent-activity {
  background: white;
  padding: 0.75rem;
  border-radius: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.recent-activity h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-color);
}

.activity-timeline {
  position: relative;
  padding-left: 0.75rem;
  flex: 1;
  overflow-y: auto;
  padding-right: 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
}

.activity-timeline::before {
  content: '';
  position: absolute;
  left: 0.25rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
}

.activity-item {
  position: relative;
  margin-bottom: 0.75rem;
}

.activity-dot {
  position: absolute;
  left: -0.75rem;
  top: 0.25rem;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary-color);
  border: 1px solid white;
  box-shadow: 0 0 0 1px var(--primary-color);
}

.activity-content {
  background: #f9fafb;
  padding: 0.5rem;
  font-size: 0.8rem;
  border-radius: 8px;
}

.activity-text {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.empty-activity {
  font-size: 0.85rem;
  color: #6b7280;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  text-align: center;
}

/* 群聊信息样式 */
.group-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
}

.group-info {
  flex: 1;
}

.group-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  cursor: pointer;
  transition: color 0.2s;
}

.group-info h4:hover {
  color: var(--primary-color);
}

.group-description {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: #6b7280;
}

.member-list-section {
  background: white;
  padding: 1rem;
  border-radius: 12px;
}

.member-list-section h5 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}

.member-list {
  max-height: 250px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-right: 0.5rem;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  transition: background 0.2s;
  cursor: pointer;
}

.member-item:hover {
  background: #f9fafb;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.member-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
}

.member-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 8px;
  width: fit-content;
}

.member-badge.owner {
  background: #fee2e2;
  color: #b91c1c;
}

.member-badge.admin {
  background: #dbeafe;
  color: #1d4ed8;
}

.empty-members {
  font-size: 0.85rem;
  color: #6b7280;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  text-align: center;
}

.action-btn {
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.action-btn:hover {
  background: var(--primary-hover);
}

/* Avatar Modal */
.avatar-preview {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
}

.avatar-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 50%;
  object-fit: cover;
}

/* Inbox Modal */
.inbox-content {
  max-height: 400px;
  overflow-y: auto;
  margin: 1rem 0;
}

.empty-inbox {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 8px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.inbox-message-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: #f9fafb;
  cursor: pointer;
  transition: background 0.2s;
}

.inbox-message-item:hover {
  background: #f3f4f6;
}

.message-info {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.message-sender {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.9rem;
}

.message-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.message-preview {
  font-size: 0.85rem;
  color: #4b5563;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--error);
  flex-shrink: 0;
}

.sidebar {
  width: 300px;
  border-radius: 12px;
  border: none;
  display: flex;
  flex-direction: column;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: none;
  overflow: hidden;
  flex: 1;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  gap: 1rem;
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
}

.back-btn:hover {
  color: var(--primary-color);
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  max-height: calc(100% - 80px);
}

.conversation-item {
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: background 0.2s;
  height: 72px; /* Fixed height for consistency */
}

.conversation-item .info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0; /* Enable truncation */
  gap: 0.25rem;
}

.name-row, .msg-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conversation-item:hover {
  background-color: #f9fafb;
}

.conversation-item.active {
  background-color: #eff6ff;
  border-right: 3px solid var(--primary-color);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #d1d5db; /* Gray */
  flex-shrink: 0;
}

.status-dot.online {
  background-color: #10b981; /* Green */
  box-shadow: 0 0 0 2px white;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: none;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: none;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.chat-area-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 600px;
  flex-shrink: 0;
}

.chat-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.chat-container-inner {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.messages-list {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ... existing styles ... */

.last-msg {
  font-size: 0.8rem;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.time-ago {
  font-size: 0.7rem;
}

.self-tag {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: normal;
  margin-left: 6px;
  background-color: var(--background);
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid var(--border);
  color: var(--text-light);
  opacity: 0.8;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
}

.header-action-btn {
  margin-left: auto;
  background: #f3f4f6;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background 0.2s;
}

.header-action-btn:hover {
  background: #e5e7eb;
}

.messages-list {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
  max-height: calc(100vh - 300px);
}

.message-bubble {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.message-bubble.sent {
  align-self: flex-end;
  align-items: flex-end;
}

.message-bubble.received {
  align-self: flex-start;
}

.bubble-content {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.95rem;
  line-height: 1.4;
}

.sent .bubble-content {
  background-color: var(--primary-color);
  color: white;
  border-bottom-right-radius: 2px;
}

.received .bubble-content {
  background-color: #f3f4f6;
  color: var(--text-color);
  border-bottom-left-radius: 2px;
}

.time {
  font-size: 0.75rem;
  color: var(--text-light);
  opacity: 0.8;
}

.hidden {
  display: none;
}

.attach-btn {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.75rem 1rem;
  font-size: 1.2rem;
}

.attach-btn:hover {
  background: #e5e7eb;
}

.image-content {
  padding: 0.25rem !important;
  background: transparent !important;
  border: none !important;
}

.image-content img {
  max-width: 250px;
  max-height: 250px;
  border-radius: 12px;
  cursor: pointer;
  display: block;
}

.file-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.75rem !important;
  min-width: 200px;
}

.file-icon {
  font-size: 1.5rem;
}

.file-info {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 600;
  text-decoration: none;
  color: var(--text-color);
  font-size: 0.9rem;
}

.file-name:hover {
  text-decoration: underline;
  color: var(--primary-color);
}

.file-size {
  font-size: 0.75rem;
  color: var(--text-light);
}

.input-area-card {
  width: 100%;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: auto;
  border-top: 1px solid var(--glass-border);
  border-radius: 0 0 12px 12px;
  width: 100%;
  position: relative;
  z-index: 10;
}

.input-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.input-area-card input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.95rem;
}

.input-area-card button {
  background-color: var(--primary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.input-area-card button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.attach-btn {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.75rem;
  font-size: 1.2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.attach-btn:hover {
  background: #e5e7eb;
}

/* 表情包选择器样式 */
.emoji-picker {
  border-top: 1px solid #f3f4f6;
  background: white;
  max-height: 300px;
  overflow-y: auto;
  padding: 1rem;
}

.emoji-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.emoji-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.emoji-header .close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #9ca3af;
  padding: 0;
  line-height: 1;
  width: auto;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.emoji-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s;
  width: auto;
  height: auto;
  color: inherit;
}

.emoji-btn:hover {
  background: #f3f4f6;
}

.emoji-footer {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.custom-emoji-btn {
  background: #f3f4f6;
  color: var(--text-color);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  width: auto;
}

.custom-emoji-btn:hover {
  background: #e5e7eb;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
  min-height: 600px;
  flex-shrink: 0;
}

.empty-state .icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
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

.typing-indicator {
  font-size: 0.8rem;
  color: var(--text-light);
  font-style: italic;
}

.sender-name {
  font-size: 0.75rem;
  color: var(--text-light);
  margin-left: 0.5rem;
  margin-bottom: 0.1rem;
}

.add-group-btn {
  background: var(--primary-color);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  border: none;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  margin-left: auto;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.unread-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: var(--error);
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  border: 2px solid white;
  min-width: 18px;
  text-align: center;
}

.section-label {
  padding: 0.5rem 1.5rem;
  font-size: 0.8rem;
  color: var(--text-light);
  font-weight: 600;
  text-transform: uppercase;
  margin-top: 0.5rem;
}

.last-msg {
  font-size: 0.8rem;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-info {
  font-size: 0.8rem;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 999;
}

.context-menu {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  min-width: 150px;
  overflow: hidden;
}

.menu-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item.delete {
  color: var(--error);
}

.recalled-text {
  font-style: italic;
  color: #9ca3af;
  font-size: 0.9rem;
}

.edited-tag {
  font-size: 0.7rem;
  color: #9ca3af;
  margin-left: 0.25rem;
}

.editing-indicator {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: #f3f4f6;
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--primary-color);
  border-top: 1px solid #e5e7eb;
}

.cancel-edit-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1.2rem;
  padding: 0;
  width: auto;
  cursor: pointer;
}

.modal {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 90vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.modal-header .close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-light);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.modal-header .close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-color);
}

.modal-body {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-actions {
  padding: 1.5rem;
  border-top: 1px solid var(--glass-border);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
}

.modal-input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
}

.modal-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.create-group-modal,
.add-member-modal {
  max-width: 500px;
}

.group-settings-modal {
  max-width: 600px;
}

.member-select {
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
}

.member-select h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.member-list {
  max-height: 200px;
  overflow-y: auto;
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.member-item:hover {
  background: #f3f4f6;
}

.member-item.selected {
  background: #eff6ff;
  color: var(--primary-color);
}

.check {
  margin-left: auto;
  color: var(--primary-color);
  font-weight: bold;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.cancel-btn {
  background: #f3f4f6;
  color: var(--text-color);
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.confirm-btn {
  background: var(--primary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.confirm-btn:hover {
  background: var(--primary-hover, #2563eb);
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
