import { defineStore } from 'pinia'
import { sendFriendRequest, handleFriendRequest, getFriends, getFriendRequests, deleteFriend } from '../api/friend'

export const useFriendStore = defineStore('friend', {
  state: () => ({
    friends: [],
    friendRequests: [],
    requests: [],
    blockedUsers: [],
    searchResults: [],
    loading: false,
    error: null
  }),
  actions: {
    async sendRequest(toUserId) {
      this.loading = true;
      this.error = null;
      try {
        await sendFriendRequest(toUserId);
        return true;
      } catch (err) {
        this.error = err.message || 'Failed to send friend request';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async handleRequest(requestId, status) {
      this.loading = true;
      this.error = null;
      try {
        await handleFriendRequest(requestId, status);
        // 从列表中移除该请求
        this.friendRequests = this.friendRequests.filter(req => req._id !== requestId);
        return true;
      } catch (err) {
        this.error = err.message || 'Failed to handle friend request';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async fetchFriends() {
      this.loading = true;
      this.error = null;
      try {
        const response = await getFriends();
        this.friends = response.friends;
        return response.friends;
      } catch (err) {
        this.error = err.message || 'Failed to fetch friends';
        return [];
      } finally {
        this.loading = false;
      }
    },
    async fetchFriendRequests() {
      this.loading = true;
      this.error = null;
      try {
        const response = await getFriendRequests();
        this.friendRequests = response.requests;
        return response.requests;
      } catch (err) {
        this.error = err.message || 'Failed to fetch friend requests';
        return [];
      } finally {
        this.loading = false;
      }
    },
    async removeFriend(friendId) {
      this.loading = true;
      this.error = null;
      try {
        await deleteFriend(friendId);
        // 从列表中移除该好友
        this.friends = this.friends.filter(friend => friend.friendId !== friendId);
        return true;
      } catch (err) {
        this.error = err.message || 'Failed to delete friend';
        return false;
      } finally {
        this.loading = false;
      }
    },
    clearError() {
      this.error = null;
    }
  }
})