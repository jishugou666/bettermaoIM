import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from './auth'

export const useMomentStore = defineStore('moment', {
  state: () => ({
    feed: [],
    comments: {}, // Map momentId -> Array<Comment>
    loading: false
  }),

  actions: {
    async fetchFeed() {
      this.loading = true;
      try {
        const response = await axios.get('/api/moment/feed', {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        this.feed = response.data;
      } catch (err) {
        console.error('Failed to fetch feed', err);
      } finally {
        this.loading = false;
      }
    },

    async createMoment(content, images = []) {
      try {
        const response = await axios.post('/api/moment', { content, images }, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        // Prepend to feed
        this.feed.unshift({
          ...response.data,
          images: response.data.images ? JSON.parse(response.data.images) : [], // Ensure parsed for frontend
          user: useAuthStore().user,
          _count: { likes: 0, comments: 0 },
          likes: [],
          isLiked: false
        });
        return true;
      } catch (err) {
        console.error('Failed to create moment', err);
        return false;
      }
    },

    async toggleLike(momentId) {
      try {
        const response = await axios.post(`/api/moment/${momentId}/like`, {}, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        
        const moment = this.feed.find(m => m.id === momentId);
        if (moment) {
          moment.isLiked = response.data.isLiked;
          if (moment.isLiked) {
            moment._count.likes++;
          } else {
            // 确保点赞数不会小于0
            if (moment._count.likes > 0) {
              moment._count.likes--;
            }
          }
        }
      } catch (err) {
        console.error('Like failed', err);
      }
    },

    async fetchComments(momentId) {
      try {
        const response = await axios.get(`/api/moment/${momentId}/comments`, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        this.comments[momentId] = response.data;
      } catch (err) {
        console.error('Failed to fetch comments', err);
      }
    },

    async createComment(momentId, content) {
      try {
        const response = await axios.post(`/api/moment/${momentId}/comments`, { content }, {
          headers: { Authorization: `Bearer ${useAuthStore().token}` }
        });
        
        if (!this.comments[momentId]) {
          this.comments[momentId] = [];
        }
        this.comments[momentId].push(response.data);
        
        // Update count in feed
        const moment = this.feed.find(m => m.id === momentId);
        if (moment) {
          moment._count.comments++;
        }
        return true;
      } catch (err) {
        console.error('Failed to comment', err);
        return false;
      }
    }
  }
})
