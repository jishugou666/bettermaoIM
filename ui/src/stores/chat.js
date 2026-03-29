import { defineStore } from 'pinia'
import { createChat, getChats, getMessages, sendMessage, getAllUsers, getGroupDetails, setMemberRole, removeMember } from '../api/chat'

export const useChatStore = defineStore('chat', {
  state: () => ({
    chats: [],
    currentChat: null,
    messages: [],
    // --- 修改开始 ---
    allUsers: [], // 所有已注册用户
    chatLatestMessages: {}, // 保存每个聊天的最新消息
    unreadCounts: {}, // 保存每个聊天的未读消息数
    // --- 修改结束 ---
    loading: false,
    error: null
  }),
  getters: {
    // 筛选私聊列表
    privateChats: (state) => {
      return state.chats.filter(chat => chat.type === 'private')
    },
    // 筛选群聊列表
    groupChats: (state) => {
      return state.chats.filter(chat => chat.type === 'group')
    }
  },
  actions: {
    // 按时间排序消息（从旧到新）
    sortMessages(messages) {
      return [...messages].sort((a, b) => {
        const timeA = new Date(a.createTime || a.createdAt || a.created_at).getTime();
        const timeB = new Date(b.createTime || b.createdAt || b.created_at).getTime();
        return timeA - timeB;
      });
    },

    async createChat(type, name, avatar, memberIds, description = '') {
      this.loading = true;
      this.error = null;
      try {
        const response = await createChat(type, name, avatar, memberIds, description);
        return response.chatId;
      } catch (err) {
        this.error = err.message || 'Failed to create chat';
        return null;
      } finally {
        this.loading = false;
      }
    },
    async fetchChats() {
      this.loading = true;
      this.error = null;
      try {
        const response = await getChats();
        this.chats = response.chats;
        return response.chats;
      } catch (err) {
        this.error = err.message || 'Failed to fetch chats';
        return [];
      } finally {
        this.loading = false;
      }
    },
    async fetchMessages(chatId) {
      this.loading = true;
      this.error = null;
      try {
        console.log('[chatStore] 获取消息, chatId:', chatId);
        const response = await getMessages(chatId);
        console.log('[chatStore] 接收到的原始响应:', JSON.stringify(response, null, 2));
        // 确保每条消息都有id字段，并处理兼容性字段
        const messages = response.messages.map(msg => {
          console.log('[chatStore] 处理单条消息:', JSON.stringify(msg, null, 2));
          const processedMsg = { ...msg };
          if (!processedMsg.id && processedMsg._id) {
            processedMsg.id = processedMsg._id;
          }
          // 确保有 userId 字段以便兼容性
          if (!processedMsg.userId) {
            processedMsg.userId = processedMsg.sender_id || processedMsg.senderId || processedMsg.sender?.id || processedMsg.sender?._id;
          }
          return processedMsg;
        });
        // 确保消息按时间排序
        this.messages = this.sortMessages(messages);
        console.log('[chatStore] 消息获取成功, 数量:', this.messages.length, '完整消息列表:', JSON.stringify(this.messages, null, 2));
        
        // 更新该聊天的最新消息
        if (this.messages.length > 0) {
          const latestMsg = this.messages[this.messages.length - 1];
          this.chatLatestMessages[chatId] = latestMsg;
        }
        
        // 标记该聊天为已读
        this.unreadCounts[chatId] = 0;
        
        return this.messages;
      } catch (err) {
        this.error = err.message || 'Failed to fetch messages';
        console.error('[chatStore] 获取消息失败:', err);
        return [];
      } finally {
        this.loading = false;
      }
    },
    async sendMessage(chatId, content, type = 'text') {
      this.loading = true;
      this.error = null;
      try {
        const response = await sendMessage(chatId, content, type);
        let message = response.message;
        // 确保消息有id字段
        if (message && !message.id && message._id) {
          message = { ...message, id: message._id };
        }
        // 确保有 userId 字段以便兼容性
        if (message && !message.userId) {
          message = { 
            ...message, 
            userId: message.sender_id || message.senderId || message.sender?.id || message.sender?._id 
          };
        }
        // 添加到本地消息列表并排序
        this.messages.push(message);
        this.messages = this.sortMessages(this.messages);
        // 更新最新消息
        this.chatLatestMessages[chatId] = message;
        return message;
      } catch (err) {
        this.error = err.message || 'Failed to send message';
        return null;
      } finally {
        this.loading = false;
      }
    },
    setCurrentChat(chat) {
      this.currentChat = chat;
    },
    addMessage(message) {
      // 确保消息有id字段
      let processedMessage = message;
      if (processedMessage && !processedMessage.id && processedMessage._id) {
        processedMessage = { ...processedMessage, id: processedMessage._id };
      }
      // 确保有 userId 字段以便兼容性
      if (processedMessage && !processedMessage.userId) {
        processedMessage = { 
          ...processedMessage, 
          userId: processedMessage.sender_id || processedMessage.senderId || processedMessage.sender?.id || processedMessage.sender?._id 
        };
      }
      
      // 提取 chatId
      const chatId = message.chatId || message.chat_id || this.currentChat?.id || this.currentChat?._id;
      
      // 更新最新消息
      if (chatId) {
        this.chatLatestMessages[chatId] = processedMessage;
        
        // 如果不是当前聊天，增加未读计数
        if (this.currentChat?.id !== chatId && this.currentChat?._id !== chatId) {
          this.unreadCounts[chatId] = (this.unreadCounts[chatId] || 0) + 1;
        }
      }
      
      // 如果是当前聊天，添加到消息列表
      if (this.currentChat && (this.currentChat.id === chatId || this.currentChat._id === chatId)) {
        // 检查是否已存在该消息（避免重复）
        const exists = this.messages.some(m => m.id === processedMessage.id);
        if (!exists) {
          this.messages.push(processedMessage);
          this.messages = this.sortMessages(this.messages);
        }
      }
    },
    
    // 获取聊天的最新消息
    getLatestMessage(chatId) {
      return this.chatLatestMessages[chatId] || null;
    },
    
    // 获取聊天的未读消息数
    getUnreadCount(chatId) {
      return this.unreadCounts[chatId] || 0;
    },
    clearError() {
      this.error = null;
    },
    // --- 修改开始 ---
    // 获取所有已注册用户（开放性IM功能）
    async fetchAllUsers() {
      this.loading = true;
      this.error = null;
      try {
        const response = await getAllUsers();
        this.allUsers = response.users || [];
        return this.allUsers;
      } catch (err) {
        this.error = err.message || 'Failed to fetch all users';
        return [];
      } finally {
        this.loading = false;
      }
    },

    // 获取群聊详情
    async fetchGroupDetails(chatId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await getGroupDetails(chatId);
        return response.group;
      } catch (err) {
        this.error = err.message || 'Failed to fetch group details';
        return null;
      } finally {
        this.loading = false;
      }
    },

    // 设置成员角色
    async setMemberRoleAction(chatId, targetUserId, role) {
      this.loading = true;
      this.error = null;
      try {
        const response = await setMemberRole(chatId, targetUserId, role);
        return response.success;
      } catch (err) {
        this.error = err.message || 'Failed to set member role';
        return false;
      } finally {
        this.loading = false;
      }
    },

    // 删除成员
    async removeMemberAction(chatId, targetUserId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await removeMember(chatId, targetUserId);
        return response.success;
      } catch (err) {
        this.error = err.message || 'Failed to remove member';
        return false;
      } finally {
        this.loading = false;
      }
    }
    // --- 修改结束 ---
  }
})