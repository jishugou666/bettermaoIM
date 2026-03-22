import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from './auth'

export const useFriendStore = defineStore('friend', {
  state: () => ({
    friends: [],
    requests: [],
    searchResults: [],
    blockedUsers: [],
    loading: false
  }),

  actions: {
    async fetchFriends() {
      try {
        const authStore = useAuthStore();
        if (!authStore.token) {
          console.error('No auth token');
          return;
        }
        const response = await axios.get('/friend', {
          headers: { Authorization: `Bearer ${authStore.token}` }
        });
        console.log('Fetched friends:', response.data);
        this.friends = response.data;
      } catch (err) {
        console.error('Failed to fetch friends', err);
        if (err.response) {
          console.error('Response data:', err.response.data);
          console.error('Response status:', err.response.status);
        }
      }
    },

    async fetchRequests() {
      try {
        const response = await axios.get('/friend/requests', {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        this.requests = response.data;
      } catch (err) {
        console.error('Failed to fetch requests', err);
      }
    },

    async searchUsers(query) {
      if (!query.trim()) {
        this.searchResults = [];
        return;
      }
      this.loading = true;
      try {
        const response = await axios.get(`/friend/search?q=${query}`, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        this.searchResults = response.data;
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        this.loading = false;
      }
    },

    async sendRequest(friendId) {
      try {
        await axios.post('/friend/request', { friendId }, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        // Optimistically update or re-fetch? Let's just return true for UI feedback
        return true;
      } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to send request');
      }
    },

    async acceptRequest(requestId) {
      try {
        await axios.post(`/friend/request/${requestId}/accept`, {}, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        await this.fetchRequests();
        await this.fetchFriends();
      } catch (err) {
        console.error('Failed to accept', err);
      }
    },

    async fetchBlockedUsers() {
      try {
        const response = await axios.get('/friend/blocked', {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        this.blockedUsers = response.data;
      } catch (err) {
        console.error('Failed to fetch blocked users', err);
      }
    },

    async blockUser(userId) {
      try {
        await axios.post(`/friend/${userId}/block`, {}, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        await this.fetchFriends();
        await this.fetchBlockedUsers();
        return true;
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to block user');
        return false;
      }
    },

    async unblockUser(userId) {
      try {
        await axios.post(`/friend/${userId}/unblock`, {}, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        await this.fetchBlockedUsers();
      } catch (err) {
        console.error('Failed to unblock user', err);
      }
    },

    async rejectRequest(requestId) {
      try {
        await axios.post(`/friend/request/${requestId}/reject`, {}, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        await this.fetchRequests();
      } catch (err) {
        console.error('Failed to reject', err);
      }
    }
  }
})
