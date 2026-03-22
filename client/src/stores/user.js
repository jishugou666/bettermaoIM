import { defineStore } from 'pinia'
import axios from 'axios'
import uploadApi from '../api/upload'
import { useAuthStore } from './auth'
import { useCreditStore } from './credit'

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null,
    loading: false
  }),

  actions: {
    async fetchProfile() {
      this.loading = true;
      try {
        const response = await axios.get('/user/profile', {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        this.profile = response.data;
        
        // Also update auth user to keep in sync
        const authStore = useAuthStore();
        authStore.user = { ...authStore.user, ...response.data };
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        this.loading = false;
      }
    },

    async updateProfile(data) {
      this.loading = true;
      try {
        const response = await axios.put('/user/profile', data, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        this.profile = response.data;
        
        // Update auth user
        const authStore = useAuthStore();
        authStore.user = { ...authStore.user, ...response.data };

        // Check tasks
        await useCreditStore().fetchTasks();
        await useCreditStore().fetchBalance();

        return true;
      } catch (err) {
        console.error('Failed to update profile', err);
        return false;
      } finally {
        this.loading = false;
      }
    },

    async uploadAvatar(file) {
      this.loading = true;
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await uploadApi.uploadAvatar(formData);
        const avatarUrl = response.data.url;
        
        // After upload, update profile
        return await this.updateProfile({ avatar: avatarUrl });
      } catch (err) {
        console.error('Failed to upload avatar', err);
        return false;
      } finally {
        this.loading = false;
      }
    }
  }
})
