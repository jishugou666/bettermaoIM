import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from './auth'

export const useCreditStore = defineStore('credit', {
  state: () => ({
    balance: 0,
    totalEarned: 0,
    transactions: [],
    tasks: [],
    loading: false
  }),

  actions: {
    async fetchBalance() {
      try {
        const response = await axios.get('/credit/balance', {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        this.balance = response.data.balance;
        this.totalEarned = response.data.totalEarned;
      } catch (err) {
        console.error('Failed to fetch balance', err);
      }
    },

    async fetchTransactions() {
      try {
        const response = await axios.get('/credit/transactions', {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        this.transactions = response.data;
      } catch (err) {
        console.error('Failed to fetch transactions', err);
      }
    },

    async fetchTasks() {
      try {
        const response = await axios.get('/credit/tasks', {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        this.tasks = response.data;
      } catch (err) {
        console.error('Failed to fetch tasks', err);
      }
    },

    async reportTask(taskKey) {
      try {
        const response = await axios.post('/credit/report', { taskKey }, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        if (response.data.success) {
          await this.fetchBalance();
          await this.fetchTasks();
          return response.data;
        }
        return null;
      } catch (err) {
        console.error('Failed to report task', err);
        return null;
      }
    },

    async tipUser(toUserId, amount, type = 'tip') {
      try {
        const response = await axios.post('/credit/tip', { toUserId, amount, type }, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        if (response.data.success) {
          await this.fetchBalance();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to tip user', err);
        return false;
      }
    },

    async purchaseVip() {
      try {
        const response = await axios.post('/credit/vip', {}, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        if (response.data.success) {
          await this.fetchBalance();
          return response.data;
        }
        return null;
      } catch (err) {
        console.error('Failed to purchase VIP', err);
        throw err.response?.data?.message || 'Purchase failed';
      }
    }
  }
})
