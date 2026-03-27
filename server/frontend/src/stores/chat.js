import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'
import axios from 'axios'

export const useChatStore = defineStore('chat', {
  state: () => ({
    socket: null,
    conversations: [], // List of users (potential friends)
    activeConversationId: null, // userId for P2P, groupId for Group
    activeConversationType: 'user', // 'user' or 'group'
    messages: {}, // Map: targetId -> Array<Message> (targetId can be userId or groupId)
    isConnected: false,
    typingUsers: new Set(),
    onlineUsers: new Set(),
    groups: [], // Store groups
    unreadCounts: { // Map: targetId (or groupId) -> count
      user: {}, 
      group: {}
    }
  }),
  
  actions: {
    initializeSocket() {
      if (this.socket) return; // Prevent multiple connections

      const authStore = useAuthStore();
      if (!authStore.token) return;

      this.fetchUnreadCounts(); // Fetch initial counts

      this.socket = io('/', {
        auth: {
          token: authStore.token
        },
        path: '/socket.io',
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        // Re-join groups if needed?
        // Actually, backend might not persist socket rooms on reconnect unless we tell it.
        // We should iterate groups and join them.
        this.groups.forEach(g => {
          this.socket.emit('join_group', g.id);
        });
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        this.onlineUsers.clear();
      });

      this.socket.on('online_users', (userIds) => {
        this.onlineUsers = new Set(userIds);
      });

      this.socket.on('user_status', ({ userId, status }) => {
        if (status === 'online') {
          this.onlineUsers.add(userId);
        } else {
          this.onlineUsers.delete(userId);
        }
      });

      this.socket.on('new_message', (message) => {
        this.addMessage(message);
      });

      this.socket.on('message_sent', (message) => {
        this.addMessage(message);
      });

      this.socket.on('batch_messages', (messages) => {
        if (Array.isArray(messages)) {
          messages.forEach(msg => this.addMessage(msg));
        }
      });

      this.socket.on('user_typing', ({ userId }) => {
        this.typingUsers.add(userId);
      });

      this.socket.on('user_stop_typing', ({ userId }) => {
        this.typingUsers.delete(userId);
      });

      this.socket.on('message_recalled', (payload) => {
        this.handleMessageRecall(payload);
      });

      this.socket.on('message_edited', (payload) => {
        this.handleMessageEdit(payload);
      });
    },

    // ... disconnectSocket ...

    async fetchUnreadCounts() {
      try {
        const response = await axios.get('/api/chat/unread', {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        this.unreadCounts = response.data;
      } catch (err) {
        console.error('Failed to fetch unread counts', err);
      }
    },

    async markAsRead(targetId, type) {
      if (!this.unreadCounts[type]) this.unreadCounts[type] = {};
      
      // Optimistic update
      this.unreadCounts[type][targetId] = 0;

      try {
        await axios.post('/api/chat/read', { targetId, type }, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
      } catch (err) {
        console.error('Failed to mark read', err);
      }
    },

    async fetchConversations() {
      try {
        // Fetch P2P conversations (users)
        const usersRes = await axios.get('/api/chat/conversations', {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        this.conversations = usersRes.data;

        // Fetch Groups
        const groupsRes = await axios.get('/api/chat/groups', {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        this.groups = groupsRes.data;
        
        // Join group rooms
        if (this.socket && this.isConnected) {
          this.groups.forEach(g => {
            this.socket.emit('join_group', g.id);
          });
        }
      } catch (err) {
        console.error('Failed to fetch conversations', err);
      }
    },

    async fetchHistory(targetId, type = 'user') {
      if (this.messages[targetId]) return; 

      try {
        let url = `/api/chat/history/${targetId}`;
        if (type === 'group') {
          url = `/api/chat/group-history/${targetId}`;
        }

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        this.messages[targetId] = response.data;
      } catch (err) {
        console.error('Failed to fetch history', err);
      }
    },

    setActiveConversation(id, type = 'user') {
      this.activeConversationId = id;
      this.activeConversationType = type;
      this.fetchHistory(id, type);
      this.markAsRead(id, type);
    },

    sendMessage(content, type = 'text') {
      if (!this.socket || !this.activeConversationId) return;

      const messageId = Date.now(); // 生成唯一的消息ID

      const payload = {
        content,
        type,
        messageId // 携带消息ID
      };

      if (this.activeConversationType === 'group') {
        payload.groupId = this.activeConversationId;
      } else {
        payload.receiverId = this.activeConversationId;
      }

      // 立即创建一个临时消息，显示在界面上
      const tempMessage = {
        id: messageId, // 临时ID
        content,
        type,
        senderId: useAuthStore().user?.id,
        receiverId: this.activeConversationType === 'user' ? this.activeConversationId : null,
        groupId: this.activeConversationType === 'group' ? this.activeConversationId : null,
        createdAt: new Date().toISOString(),
        isRead: false,
        isRecalled: false,
        isEdited: false,
        sender: useAuthStore().user
      };

      // 添加临时消息到本地消息列表
      this.addMessage(tempMessage);

      // 发送消息到服务器
      this.socket.emit('send_message', payload);
    },

    addMessage(message) {
      const authStore = useAuthStore();
      
      let targetId;
      let type = 'user';
      if (message.groupId) {
        targetId = message.groupId; // Group message
        type = 'group';
      } else {
        // Private message
        if (!authStore.user) return; // Should not happen if auth middleware works
        targetId = message.senderId === authStore.user.id ? message.receiverId : message.senderId;
      }
      
      if (!this.messages[targetId]) {
        this.messages[targetId] = [];
      }
      
      // 检查是否是服务器返回的消息，用于替换临时消息
      if (message.id && typeof message.id === 'number') {
        // 查找是否有临时消息需要替换
        const tempMessageIndex = this.messages[targetId].findIndex(m => 
          typeof m.id === 'number' && m.id.toString().length === 13 && // 临时消息的ID是时间戳
          m.senderId === authStore.user?.id &&
          m.content === message.content &&
          m.type === message.type
        );
        
        if (tempMessageIndex > -1) {
          // 替换临时消息
          this.messages[targetId][tempMessageIndex] = message;
        } else {
          // 检查消息是否已经存在，避免重复添加
          const messageExists = this.messages[targetId].some(m => m.id === message.id);
          if (!messageExists) {
            this.messages[targetId].push(message);
          }
        }
      } else {
        // 临时消息，直接添加
        this.messages[targetId].push(message);
      }

      // Handle unread counts
      // If we are NOT in this conversation, increment unread
      const isCurrent = this.activeConversationId === targetId && this.activeConversationType === type;
      if (!isCurrent && message.senderId !== authStore.user.id) {
        if (!this.unreadCounts[type]) this.unreadCounts[type] = {};
        if (!this.unreadCounts[type][targetId]) this.unreadCounts[type][targetId] = 0;
        this.unreadCounts[type][targetId]++;
      } else if (isCurrent && message.senderId !== authStore.user.id) {
         // If we are in current conversation, we should mark as read immediately?
         // Or just let the user read it. Usually we mark read when user interacts or message comes in active window.
         this.markAsRead(targetId, type);
      }
      
      // Update last message in conversation list
      if (type === 'group') {
        let group = this.groups.find(g => g.id === targetId);
        if (group) {
          group.lastMessage = message;
          this.groups = this.groups.filter(g => g.id !== targetId);
          this.groups.unshift(group);
        }
      } else {
        let user = this.conversations.find(u => u.id === targetId);
        if (user) {
          user.lastMessage = message;
          this.conversations = this.conversations.filter(u => u.id !== targetId);
          this.conversations.unshift(user);
        }
      }
    },

    sendTyping() {
      if (this.socket && this.activeConversationId && this.activeConversationType === 'user') {
        this.socket.emit('typing', { receiverId: this.activeConversationId });
      }
    },

    sendStopTyping() {
      if (this.socket && this.activeConversationId && this.activeConversationType === 'user') {
        this.socket.emit('stop_typing', { receiverId: this.activeConversationId });
      }
    },

    async createGroup(name, description, memberIds) {
      try {
        const response = await axios.post('/api/chat/groups', {
          name,
          description,
          memberIds
        }, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        
        const newGroup = response.data;
        this.groups.push(newGroup);
        if (this.socket) {
          this.socket.emit('join_group', newGroup.id);
        }
        return newGroup;
      } catch (err) {
        console.error('Failed to create group', err);
        return null;
      }
    },

    async kickMember(groupId, userId) {
      try {
        await axios.delete(`/api/chat/groups/${groupId}/members/${userId}`, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        // Optimistically update or fetch?
        // Let's assume we are in the group view, we might need to refresh details
        // Or handle a "member_kicked" socket event. 
        // For M5, just basic API call is enough.
        return true;
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to kick member');
        return false;
      }
    },

    async transferOwnership(groupId, newOwnerId) {
      try {
        await axios.post(`/api/chat/groups/${groupId}/transfer`, { newOwnerId }, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        return true;
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to transfer ownership');
        return false;
      }
    },

    async addMembers(groupId, userIds) {
      try {
        await axios.post(`/api/chat/groups/${groupId}/members`, { userIds }, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        return true;
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to add members');
        return false;
      }
    },

    recallMessage(messageId) {
      if (!this.socket) return;
      this.socket.emit('recall_message', { messageId });
    },

    editMessage(messageId, newContent) {
      if (!this.socket) return;
      this.socket.emit('edit_message', { messageId, newContent });
    },

    handleMessageRecall(payload) {
      const authStore = useAuthStore();
      const { messageId, groupId, senderId, receiverId } = payload;
      
      let targetId;
      if (groupId) {
        targetId = groupId;
      } else {
        targetId = senderId === authStore.user.id ? receiverId : senderId;
      }

      const msgs = this.messages[targetId];
      if (msgs) {
        const msg = msgs.find(m => m.id === messageId);
        if (msg) {
          msg.isRecalled = true;
          msg.content = 'This message has been recalled';
        }
      }
    },

    handleMessageEdit(payload) {
      const authStore = useAuthStore();
      const { messageId, newContent, groupId, senderId, receiverId } = payload;
      
      let targetId;
      if (groupId) {
        targetId = groupId;
      } else {
        targetId = senderId === authStore.user.id ? receiverId : senderId;
      }

      const msgs = this.messages[targetId];
      if (msgs) {
        const msg = msgs.find(m => m.id === messageId);
        if (msg) {
          msg.content = newContent;
          msg.isEdited = true;
        }
      }
    }
  },

  getters: {
    activeMessages: (state) => {
      if (!state.activeConversationId) return [];
      return state.messages[state.activeConversationId] || [];
    },
    activeTarget: (state) => {
      if (state.activeConversationType === 'group') {
        return state.groups.find(g => g.id === state.activeConversationId);
      }
      return state.conversations.find(u => u.id === state.activeConversationId);
    }
  }
})
