// --- 修改开始 ---
import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import { useChatStore } from './chat'
import { useFriendStore } from './friend'
import { useMomentStore } from './moment'
import { useAuthStore } from './auth'

export const useSocketStore = defineStore('socket', {
  state: () => ({
    socket: null,
    connected: false
  }),
  actions: {
    initSocket(token) {
      if (this.socket) {
        this.socket.disconnect();
      }

      // 使用认证信息连接Socket.IO
      this.socket = io('http://localhost:3000', {
        transports: ['websocket'],
        auth: {
          token: token
        }
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.connected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
        this.connected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // 新消息
      this.socket.on('newMessage', (message) => {
        const chatStore = useChatStore();
        const authStore = useAuthStore();
        
        console.log('Received new message:', message);
        
        // 避免重复添加自己发送的消息
        const messageSenderId = message.sender_id || message.sender?.id || message.userId;
        const currentUserId = authStore.user?._id || authStore.user?.id;
        
        if (authStore.user && String(messageSenderId) !== String(currentUserId)) {
          chatStore.addMessage(message);
        }
      });

      // 好友请求
      this.socket.on('friendRequest', (data) => {
        const friendStore = useFriendStore();
        friendStore.fetchFriendRequests();
      });

      // 好友请求处理结果
      this.socket.on('friendRequestHandled', (data) => {
        const friendStore = useFriendStore();
        friendStore.fetchFriends();
      });

      // 朋友圈点赞
      this.socket.on('momentLiked', (data) => {
        const momentStore = useMomentStore();
        momentStore.fetchMoments();
      });

      // 朋友圈评论
      this.socket.on('momentCommented', (data) => {
        const momentStore = useMomentStore();
        momentStore.fetchMoments();
      });

      // 用户在线状态
      this.socket.on('user:online', (data) => {
        console.log('User online:', data.userId);
      });

      // 用户离线状态
      this.socket.on('user:offline', (data) => {
        console.log('User offline:', data.userId);
      });
    },

    disconnectSocket() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
        this.connected = false;
      }
    },

    joinChat(chatId) {
      if (this.socket) {
        this.socket.emit('joinChat', chatId);
      }
    },

    sendMessage(chatId, message) {
      if (this.socket) {
        this.socket.emit('sendMessage', { chatId, message });
      }
    },

    sendFriendRequest(data) {
      if (this.socket) {
        this.socket.emit('sendFriendRequest', data);
      }
    },

    handleFriendRequest(data) {
      if (this.socket) {
        this.socket.emit('handleFriendRequest', data);
      }
    },

    likeMoment(data) {
      if (this.socket) {
        this.socket.emit('likeMoment', data);
      }
    },

    commentMoment(data) {
      if (this.socket) {
        this.socket.emit('commentMoment', data);
      }
    }
  }
})
// --- 修改结束 ---