import { defineStore } from 'pinia'
import { createChat, getChats, getMessages, sendMessage, getAllUsers } from '../api/chat'

export const useChatStore = defineStore('chat', {
  state: () => ({
    chats: [],
    currentChat: null,
    messages: [],
    // --- 修改开始 ---
    allUsers: [], // 所有已注册用户
    // --- 修改结束 ---
    loading: false,
    error: null
  }),
  actions: {
    async createChat(type, name, avatar, memberIds) {
      this.loading = true;
      this.error = null;
      try {
        const response = await createChat(type, name, avatar, memberIds);
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
        const response = await getMessages(chatId);
        // 确保每条消息都有id字段
        const messages = response.messages.map(msg => {
          if (!msg.id && msg._id) {
            return { ...msg, id: msg._id };
          }
          return msg;
        });
        this.messages = messages;
        return messages;
      } catch (err) {
        this.error = err.message || 'Failed to fetch messages';
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
        const message = response.message;
        // 确保消息有id字段
        if (message && !message.id && message._id) {
          message.id = message._id;
        }
        // 添加到本地消息列表
        this.messages.push(message);
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
      if (message && !message.id && message._id) {
        message.id = message._id;
      }
      this.messages.push(message);
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
    }
    // --- 修改结束 ---
  }
})