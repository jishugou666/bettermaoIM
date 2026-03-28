import { defineStore } from 'pinia'
import { getCurrentUser, updateUser, searchUsers, getPointsRank } from '../api/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null,
    points: 0,
    pointsRank: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchCurrentUser() {
      this.loading = true;
      this.error = null;
      try {
        const response = await getCurrentUser();
        this.currentUser = response.user;
        this.points = response.user.points || 0;
        return response.user;
      } catch (err) {
        this.error = err.message || 'Failed to fetch user info';
        return null;
      } finally {
        this.loading = false;
      }
    },
    async updateUserInfo(userData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await updateUser(userData);
        this.currentUser = response.user;
        return response.user;
      } catch (err) {
        this.error = err.message || 'Failed to update user info';
        return null;
      } finally {
        this.loading = false;
      }
    },
    async searchUsersByKeyword(keyword) {
      this.loading = true;
      this.error = null;
      try {
        const response = await searchUsers(keyword);
        return response.users;
      } catch (err) {
        this.error = err.message || 'Failed to search users';
        return [];
      } finally {
        this.loading = false;
      }
    },
    async fetchPointsRank() {
      this.loading = true;
      this.error = null;
      try {
        const response = await getPointsRank();
        this.pointsRank = response.users;
        return response.users;
      } catch (err) {
        this.error = err.message || 'Failed to fetch points rank';
        return [];
      } finally {
        this.loading = false;
      }
    },
    async fetchProfile() {
      // 调用 fetchCurrentUser 方法获取用户信息
      return await this.fetchCurrentUser();
    },
    clearError() {
      this.error = null;
    }
  }
})