import { defineStore } from 'pinia'
import { createMoment, getMoments, likeMoment, unlikeMoment, commentMoment, deleteComment, getMomentById, getComments } from '../api/moments'

export const useMomentStore = defineStore('moment', {
  state: () => ({
    moments: [],
    feed: [],
    comments: {},
    currentMoment: null,
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
    async fetchMomentDetail(momentId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await getMomentById(momentId);
        const moment = {
          ...response.moment,
          id: response.moment._id || response.moment.id,
          isLiked: response.moment.liked || response.moment.isLiked || false,
          _count: {
            likes: response.moment.likes || response.moment._count?.likes || 0,
            comments: response.moment.comments || response.moment._count?.comments || 0
          },
          createdAt: response.moment.createTime || response.moment.createdAt,
          user: {
            ...response.moment.user,
            id: response.moment.user?.id || response.moment.user?._id,
            username: response.moment.user?.username || response.moment.user?.nickname || 'Unknown'
          }
        };
        this.currentMoment = moment;
        return moment;
      } catch (err) {
        this.error = err.message || 'Failed to fetch moment detail';
        return null;
      } finally {
        this.loading = false;
      }
    },
    async fetchComments(momentId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await getComments(momentId);
        this.comments[momentId] = response.comments.map(comment => ({
          ...comment,
          id: comment._id || comment.id,
          createdAt: comment.createTime || comment.createdAt,
          user: {
            ...comment.user,
            id: comment.user?.id || comment.user?._id,
            username: comment.user?.username || comment.user?.nickname || 'Unknown'
          }
        }));
        return this.comments[momentId];
      } catch (err) {
        this.error = err.message || 'Failed to fetch comments';
        return [];
      } finally {
        this.loading = false;
      }
    },
    async createComment(momentId, content) {
      this.loading = true;
      this.error = null;
      try {
        const response = await commentMoment(momentId, content);
        const comment = {
          ...response.comment,
          id: response.comment._id || response.comment.id,
          createdAt: response.comment.createTime || response.comment.createdAt,
          user: {
            ...response.comment.user,
            id: response.comment.user?.id || response.comment.user?._id,
            username: response.comment.user?.username || response.comment.user?.nickname || 'Unknown'
          }
        };
        if (!this.comments[momentId]) {
          this.comments[momentId] = [];
        }
        this.comments[momentId].push(comment);
        // 更新评论数
        const moment = this.feed.find(m => m.id === momentId || m._id === momentId);
        if (moment) {
          moment._count.comments += 1;
        }
        if (this.currentMoment && (this.currentMoment.id === momentId || this.currentMoment._id === momentId)) {
          this.currentMoment._count.comments += 1;
        }
        return comment;
      } catch (err) {
        this.error = err.message || 'Failed to create comment';
        return null;
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
        const moment = this.moments.find(m => m._id === momentId || m.id === momentId);
        if (moment) {
          moment.likes = (moment.likes || 0) + 1;
          moment.liked = true;
          moment.isLiked = true;
        }
        // 更新feed中的点赞状态
        const feedMoment = this.feed.find(m => m._id === momentId || m.id === momentId);
        if (feedMoment) {
          feedMoment.isLiked = true;
          feedMoment._count.likes += 1;
        }
        // 更新当前动态的点赞状态
        if (this.currentMoment && (this.currentMoment._id === momentId || this.currentMoment.id === momentId)) {
          this.currentMoment.isLiked = true;
          this.currentMoment._count.likes += 1;
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
        const moment = this.moments.find(m => m._id === momentId || m.id === momentId);
        if (moment) {
          moment.likes = Math.max(0, (moment.likes || 0) - 1);
          moment.liked = false;
          moment.isLiked = false;
        }
        // 更新feed中的点赞状态
        const feedMoment = this.feed.find(m => m._id === momentId || m.id === momentId);
        if (feedMoment) {
          feedMoment.isLiked = false;
          feedMoment._count.likes = Math.max(0, feedMoment._count.likes - 1);
        }
        // 更新当前动态的点赞状态
        if (this.currentMoment && (this.currentMoment._id === momentId || this.currentMoment.id === momentId)) {
          this.currentMoment.isLiked = false;
          this.currentMoment._count.likes = Math.max(0, this.currentMoment._count.likes - 1);
        }
        return true;
      } catch (err) {
        this.error = err.message || 'Failed to unlike moment';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async deleteComment(momentId, commentId) {
      this.loading = true;
      this.error = null;
      try {
        await deleteComment(momentId, commentId);
        // 从本地评论列表中删除
        if (this.comments[momentId]) {
          this.comments[momentId] = this.comments[momentId].filter(c => c.id !== commentId && c._id !== commentId);
        }
        // 更新评论数
        const moment = this.feed.find(m => m.id === momentId || m._id === momentId);
        if (moment) {
          moment._count.comments = Math.max(0, moment._count.comments - 1);
        }
        if (this.currentMoment && (this.currentMoment.id === momentId || this.currentMoment._id === momentId)) {
          this.currentMoment._count.comments = Math.max(0, this.currentMoment._count.comments - 1);
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
        // 标准化数据格式，确保字段名称一致
        this.feed = response.moments.map(moment => ({
          ...moment,
          id: moment._id || moment.id,
          isLiked: moment.liked || moment.isLiked || false,
          _count: {
            likes: moment.likes || moment._count?.likes || 0,
            comments: moment.comments || moment._count?.comments || 0
          },
          createdAt: moment.createTime || moment.createdAt,
          user: {
            ...moment.user,
            id: moment.user?.id || moment.user?._id,
            username: moment.user?.username || moment.user?.nickname || 'Unknown'
          }
        }));
        return this.feed;
      } catch (err) {
        this.error = err.message || 'Failed to fetch moments';
        return [];
      } finally {
        this.loading = false;
      }
    },
    toggleLike(momentId) {
      const moment = this.feed.find(m => m.id === momentId || m._id === momentId);
      if (moment) {
        if (moment.isLiked) {
          return this.unlikeMoment(moment.id || moment._id);
        } else {
          return this.likeMoment(moment.id || moment._id);
        }
      }
      return false;
    },
    clearError() {
      this.error = null;
    }
  }
})