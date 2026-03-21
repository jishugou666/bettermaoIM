import { defineStore } from 'pinia'
import { login, register as registerApi, getMe } from '../api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null,
    loading: false,
    error: null
  }),
  actions: {
    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const response = await login({ email, password });
        this.token = response.token;
        this.user = response.user;
        localStorage.setItem('token', this.token);
        return true;
      } catch (err) {
        this.error = err.message || 'Login failed';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async register(username, email, password) {
      this.loading = true;
      this.error = null;
      try {
        const response = await registerApi({ username, email, password });
        this.token = response.token;
        this.user = response.user;
        localStorage.setItem('token', this.token);
        return true;
      } catch (err) {
        this.error = err.message || 'Registration failed';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async fetchUser() {
      if (!this.token) return;
      try {
        const response = await getMe();
        this.user = response;
      } catch (err) {
        this.logout();
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
    }
  }
})
