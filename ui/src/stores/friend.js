import { defineStore } from 'pinia'
// --- 修改开始 ---
// 开放性IM改造：简化好友Store，主要用于黑名单管理
import { getFriends, searchUsers as searchUsersApi } from '../api/friend'
// --- 修改结束 ---

export const useFriendStore = defineStore('friend', {
  state: () => ({
    // --- 修改开始 ---
    friends: [], // 现主要用于黑名单
    blockedUsers: [], // 黑名单列表
    searchResults: [],
    // 移除：friendRequests, requests（好友请求功能已移除）
    // --- 修改结束 ---
    loading: false,
    error: null
  }),
  actions: {
    // --- 修改开始 ---
    // 移除好友请求相关方法：sendRequest, handleRequest, fetchFriendRequests, removeFriend
    // --- 修改结束 ---
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
    // --- 修改开始 ---
    // 移除 fetchFriendRequests 和 removeFriend 方法
    // --- 修改结束 ---
    async searchUsers(keyword) {
      this.loading = true;
      this.error = null;
      try {
        const response = await searchUsersApi(keyword);
        this.searchResults = response.users || [];
        return this.searchResults;
      } catch (err) {
        this.error = err.message || 'Failed to search users';
        this.searchResults = [];
        return [];
      } finally {
        this.loading = false;
      }
    },
    async blockUser(userId) {
      this.loading = true;
      this.error = null;
      try {
        // 这里应该调用API来屏蔽用户
        // 暂时只在本地更新
        this.blockedUsers.push({ id: userId, username: 'User' });
        return true;
      } catch (err) {
        this.error = err.message || 'Failed to block user';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async unblockUser(userId) {
      this.loading = true;
      this.error = null;
      try {
        // 这里应该调用API来取消屏蔽用户
        // 暂时只在本地更新
        this.blockedUsers = this.blockedUsers.filter(user => user.id !== userId);
        return true;
      } catch (err) {
        this.error = err.message || 'Failed to unblock user';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async fetchBlockedUsers() {
      this.loading = true;
      this.error = null;
      try {
        // 这里应该调用API来获取屏蔽用户列表
        // 暂时返回空数组
        this.blockedUsers = [];
        return this.blockedUsers;
      } catch (err) {
        this.error = err.message || 'Failed to fetch blocked users';
        return [];
      } finally {
        this.loading = false;
      }
    },
    clearError() {
      this.error = null;
    }
  }
})