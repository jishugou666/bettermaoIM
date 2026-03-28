import { defineStore } from 'pinia'
import { createMoment, getMoments, likeMoment, unlikeMoment, commentMoment, deleteComment } from '../api/moments'

export const useMomentStore = defineStore('moment', {
  state: () => ({
    moments: [],
    feed: [],
    loading: false,
    error: null
  }),
  actions: {
    async createMoment(content, images) {
      this.loading = true;
      this.error = null;
      try {
        const response = await createMoment(content, images);
        // 添加到本地动态列表
        this.moments.unshift(response.moment);
        return response.moment;
      } catch (err) {
        this.error = err.message || 'Failed to create moment';
        return null;
      } finally {
        this.loading = false;
      }
    },
    async fetchMoments() {
      this.loading = true;
      this.error = null;
      try {
        const response = await getMoments();
        this.moments = response.moments;
        return response.moments;
      } catch (err) {
        this.error = err.message || 'Failed to fetch moments';
        return [];
      } finally {
        this.loading = false;
      }
    },
    async likeMoment(momentId) {
      this.loading = true;
      this.error = null;
      try {
        await likeMoment(momentId);
        // 更新本地动态的点赞状态
        const moment = this.moments.find(m => m._id === momentId);
        if (moment) {
          moment.likes += 1;
          moment.liked = true;
        }
        return true;
      } catch (err) {
        this.error = err.message || 'Failed to like moment';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async unlikeMoment(momentId) {
      this.loading = true;
      this.error = null;
      try {
        await unlikeMoment(momentId);
        // 更新本地动态的点赞状态
        const moment = this.moments.find(m => m._id === momentId);
        if (moment) {
          moment.likes -= 1;
          moment.liked = false;
        }
        return true;
      } catch (err) {
        this.error = err.message || 'Failed to unlike moment';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async commentMoment(momentId, content) {
      this.loading = true;
      this.error = null;
      try {
        const response = await commentMoment(momentId, content);
        // 更新本地动态的评论数
        const moment = this.moments.find(m => m._id === momentId);
        if (moment) {
          moment.comments += 1;
        }
        return response.comment;
      } catch (err) {
        this.error = err.message || 'Failed to comment moment';
        return null;
      } finally {
        this.loading = false;
      }
    },
    async deleteComment(momentId, commentId) {
      this.loading = true;
      this.error = null;
      try {
        await deleteComment(momentId, commentId);
        // 更新本地动态的评论数
        const moment = this.moments.find(m => m._id === momentId);
        if (moment) {
          moment.comments -= 1;
        }
        return true;
      } catch (err) {
        this.error = err.message || 'Failed to delete comment';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async fetchFeed() {
      this.loading = true;
      this.error = null;
      try {
        const response = await getMoments();
        this.feed = response.moments;
        return response.moments;
      } catch (err) {
        this.error = err.message || 'Failed to fetch moments';
        return [];
      } finally {
        this.loading = false;
      }
    },
    toggleLike(momentId) {
      const moment = this.feed.find(m => m.id === momentId);
      if (moment) {
        if (moment.isLiked) {
          return this.unlikeMoment(momentId);
        } else {
          return this.likeMoment(momentId);
        }
      }
      return false;
    },
    clearError() {
      this.error = null;
    }
  }
})