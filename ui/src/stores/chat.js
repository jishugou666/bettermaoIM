import { defineStore } from 'pinia'
import { createChat, getChats, getMessages, sendMessage } from '../api/chat'

export const useChatStore = defineStore('chat', {
  state: () => ({
    chats: [],
    currentChat: null,
    messages: [],
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
        this.messages = response.messages;
        return response.messages;
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
        // 添加到本地消息列表
        this.messages.push(response.message);
        return response.message;
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
      this.messages.push(message);
    },
    clearError() {
      this.error = null;
    }
  }
})