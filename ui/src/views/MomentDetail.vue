<template>
  <div class="moment-detail-layout">
    <div class="moment-detail-content">
      <div class="header-section card">
        <button class="back-btn" @click="router.push('/moments')">← {{ $t('common.back') }}</button>
        <h2>动态详情</h2>
      </div>

      <div class="moment-card card" v-if="moment">
        <div class="moment-header">
          <Avatar :username="moment.user.username" :src="moment.user.avatar" />
          <div class="user-info">
            <span class="username">{{ moment.user.username }}</span>
            <span class="time">{{ formatTime(moment.createdAt) }}</span>
          </div>
        </div>
        
        <div class="moment-content">
          {{ moment.content }}
          <div v-if="moment.images && moment.images.length" class="moment-images">
            <img 
              v-for="(img, idx) in moment.images" 
              :key="idx" 
              :src="getFullUrl(img)" 
              class="moment-img" 
              @click="window.open(getFullUrl(img), '_blank')"
            />
          </div>
        </div>

        <div class="moment-actions">
          <button 
            class="action-btn" 
            :class="{ active: moment.isLiked }"
            @click="momentStore.toggleLike(moment.id)"
          >
            <span class="icon">❤️</span>
            <span class="count">{{ moment._count.likes }}</span>
          </button>
          <button 
            class="action-btn" 
            @click="scrollToComments"
          >
            <span class="icon">💬</span>
            <span class="count">{{ moment._count.comments }}</span>
          </button>
          <button 
            class="action-btn" 
            @click="openTipModal(moment.user.id)"
          >
            <span class="icon">💰</span>
            <span class="label">{{ $t('moments.tip') }}</span>
          </button>
        </div>

        <!-- Comments Section -->
        <div class="comments-section">
          <h3>评论</h3>
          <div class="comments-list" ref="commentsList">
            <div v-if="momentStore.loading" class="loading-comments">{{ $t('common.loading') }}</div>
            <div v-else-if="!momentStore.comments[moment.id] || momentStore.comments[moment.id].length === 0" class="no-comments">
              {{ $t('moments.no_comments') }}
            </div>
            <div v-else v-for="comment in momentStore.comments[moment.id]" :key="comment.id" class="comment-item">
              <Avatar :username="comment.user.username" :src="comment.user.avatar" :size="32" />
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-user">{{ comment.user.username }}</span>
                  <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                </div>
                <span class="comment-text">{{ comment.content }}</span>
              </div>
            </div>
          </div>
          <div class="comment-input-wrapper">
            <Avatar :username="authStore.user.username" :src="authStore.user.avatar" :size="32" />
            <div class="input-container">
              <input 
                v-model="newComment" 
                :placeholder="$t('moments.write_comment')" 
                @keyup.enter="handleComment"
              />
              <button @click="handleComment" :disabled="!newComment.trim()">{{ $t('common.send') }}</button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="loading-state">
        <div class="loader"></div>
      </div>
    </div>

    <TipModal 
      :show="showTipModal" 
      :toUserId="tipTargetUserId"
      @close="showTipModal = false"
      @success="handleTipSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useMomentStore } from '../stores/moment'
import { useAuthStore } from '../stores/auth'
import { useRouter, useRoute } from 'vue-router'
import Avatar from '../components/Avatar.vue'
import TipModal from '../components/TipModal.vue'

const momentStore = useMomentStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const showTipModal = ref(false)
const tipTargetUserId = ref(null)
const newComment = ref('')
const moment = ref(null)
const commentsList = ref(null)

const momentId = computed(() => route.params.id)

const getFullUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}${path}`
}

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleString()
}

const fetchMomentDetail = async () => {
  try {
    const result = await momentStore.fetchMomentDetail(momentId.value)
    if (result) {
      moment.value = result
      await momentStore.fetchComments(momentId.value)
    }
  } catch (error) {
    console.error('Failed to fetch moment detail:', error)
  }
}

const handleComment = async () => {
  if (!newComment.value.trim()) return
  const success = await momentStore.createComment(momentId.value, newComment.value)
  if (success) {
    newComment.value = ''
    // 滚动到最新评论
    setTimeout(() => {
      if (commentsList.value) {
        commentsList.value.scrollTop = commentsList.value.scrollHeight
      }
    }, 100)
  }
}

const openTipModal = (userId) => {
  tipTargetUserId.value = userId
  showTipModal.value = true
}

const handleTipSuccess = (amount) => {
  alert(`Successfully sent ${amount} credits!`)
}

const scrollToComments = () => {
  if (commentsList.value) {
    commentsList.value.scrollIntoView({ behavior: 'smooth' })
  }
}

onMounted(async () => {
  await fetchMomentDetail()
})

watch(() => route.params.id, async () => {
  await fetchMomentDetail()
})
</script>

<style scoped>
.moment-detail-layout {
  min-height: 100vh;
  width: 100vw;
  overflow-x: hidden;
  background: linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  box-sizing: border-box;
}

.moment-detail-content {
  max-width: 800px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-btn {
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  font-weight: 500;
}

.moment-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 600;
}

.time {
  font-size: 0.75rem;
  color: var(--text-light);
}

.moment-content {
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  white-space: pre-wrap;
}

.moment-actions {
  display: flex;
  gap: 1.5rem;
  border-top: 1px solid #f3f4f6;
  padding-top: 1rem;
}

.action-btn {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--text-light);
  transition: all 0.2s;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
}

.action-btn:hover {
  color: var(--text-color);
}

.action-btn.active {
  color: #ef4444;
}

/* Comments */
.comments-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #f3f4f6;
}

.comments-section h3 {
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.comment-item {
  display: flex;
  gap: 0.75rem;
}

.comment-content {
  flex: 1;
  background-color: #f9fafb;
  padding: 1rem;
  border-radius: 12px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.comment-user {
  font-weight: 600;
  font-size: 0.9rem;
}

.comment-time {
  font-size: 0.75rem;
  color: var(--text-light);
}

.comment-text {
  font-size: 0.95rem;
  line-height: 1.4;
}

.comment-input-wrapper {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.input-container {
  flex: 1;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  background-color: #f9fafb;
  padding: 0.5rem 1rem;
  border-radius: 20px;
}

.input-container input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 0.9rem;
}

.input-container button {
  background: none;
  border: none;
  color: var(--primary-color);
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
}

.input-container button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.moment-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.moment-img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.moment-img:hover {
  transform: scale(1.02);
}

.loading-state, .no-comments {
  text-align: center;
  padding: 2rem;
  color: var(--text-light);
}

.loader {
  border: 3px solid #f3f3f3;
  border-radius: 50%;
  border-top: 3px solid var(--primary-color);
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
