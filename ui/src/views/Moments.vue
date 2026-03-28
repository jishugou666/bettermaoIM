<template>
  <div class="moments-layout">
    <div class="moments-content">
      <div class="header-section card">
        <button class="back-btn" @click="router.push('/')">← {{ $t('common.back') }}</button>
        <h2>{{ $t('moments.title') }}</h2>
        <div class="search-bar">
          <input 
            v-model="searchQuery" 
            @input="handleSearch"
            :placeholder="$t('common.search')" 
          />
          <span v-if="isSearching" class="search-loader">...</span>
        </div>
        <button class="new-post-btn" @click="showPostModal = true" title="发布动态">✍️</button>
      </div>

      <div class="feed-container">
        <div v-if="momentStore.loading && momentStore.feed.length === 0" class="loader-wrapper">
          <div class="loader"></div>
        </div>
        
        <div v-else-if="momentStore.feed.length === 0" class="empty-state">
          {{ $t('moments.no_moments') }}
        </div>

        <div v-for="moment in filteredFeed" :key="moment.id" class="moment-card card" @click="navigateToMoment(moment.id)" style="cursor: pointer; position: relative; z-index: 1;">
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
                @click.stop="window.open(getFullUrl(img), '_blank')"
              />
            </div>
          </div>

          <div class="moment-actions">
            <button 
              class="action-btn" 
              :class="{ active: moment.isLiked }"
              @click.stop="momentStore.toggleLike(moment.id)"
            >
              <span class="icon">❤️</span>
              <span class="count">{{ moment._count.likes }}</span>
            </button>
            <button 
              class="action-btn" 
              @click.stop="navigateToMoment(moment.id)"
            >
              <span class="icon">💬</span>
              <span class="count">{{ moment._count.comments }}</span>
            </button>
            <button 
              class="action-btn" 
              @click.stop="openTipModal(moment.user.id)"
            >
              <span class="icon">💰</span>
              <span class="label">{{ $t('moments.tip') }}</span>
            </button>
          </div>


        </div>
      </div>
    </div>

    <!-- New Post Modal -->
    <div v-if="showPostModal" class="modal-overlay" @click.self="showPostModal = false">
      <div class="modal">
        <h3>{{ $t('moments.new_post') }}</h3>
        <textarea 
          v-model="newContent" 
          :placeholder="$t('moments.post_placeholder')" 
          rows="4"
        ></textarea>
        
        <div class="upload-area">
          <div v-if="previewUrl" class="image-preview">
            <img :src="previewUrl" />
            <button class="remove-btn" @click="removeFile">×</button>
          </div>
          <button v-else class="upload-btn" @click="triggerFileInput">
            📷 {{ $t('moments.add_photo') }}
          </button>
          <input 
            type="file" 
            ref="fileInput" 
            class="hidden" 
            accept="image/*" 
            @change="handleFileSelect" 
          />
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="showPostModal = false">{{ $t('common.cancel') }}</button>
          <button class="post-btn" @click="handlePost" :disabled="!newContent.trim()">{{ $t('moments.post') }}</button>
        </div>
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
import { ref, onMounted, computed } from 'vue'
import { useMomentStore } from '../stores/moment'
import { useRouter } from 'vue-router'
import uploadApi from '../api/upload'
import Avatar from '../components/Avatar.vue'
import TipModal from '../components/TipModal.vue'

const momentStore = useMomentStore()
const router = useRouter()
const showPostModal = ref(false)
const showTipModal = ref(false)
const tipTargetUserId = ref(null)

const newContent = ref('')

const searchQuery = ref('')
const isSearching = ref(false)
let searchTimeout = null

// File Upload
const fileInput = ref(null)
const selectedFile = ref(null)
const previewUrl = ref(null)

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) {
    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  }
}

const removeFile = () => {
  selectedFile.value = null
  previewUrl.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const getFullUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}${path}`
}

onMounted(() => {
  momentStore.fetchFeed()
})

const filteredFeed = computed(() => {
  if (!searchQuery.value.trim()) return momentStore.feed
  const query = searchQuery.value.toLowerCase()
  return momentStore.feed.filter(m => 
    m.content.toLowerCase().includes(query) || 
    m.user.username.toLowerCase().includes(query)
  )
})

const handleSearch = () => {
  isSearching.value = true
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    isSearching.value = false
    // Real backend search could go here, for now client-side filtering
  }, 300)
}

const handlePost = async () => {
  if (!newContent.value.trim() && !selectedFile.value) return
  
  let images = []
  if (selectedFile.value) {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    try {
      const res = await uploadApi.uploadMomentImage(formData)
      images.push(res.data.url)
    } catch (e) {
      console.error('Upload failed', e)
      alert('Image upload failed, please try again.')
      return
    }
  }

  const success = await momentStore.createMoment(newContent.value, images)
  if (success) {
    showPostModal.value = false
    newContent.value = ''
    removeFile()
    // 重新获取动态列表，确保新发布的动态显示出来
    await momentStore.fetchFeed()
  }
}

const openTipModal = (userId) => {
  tipTargetUserId.value = userId
  showTipModal.value = true
}

const handleTipSuccess = (amount) => {
  alert(`Successfully sent ${amount} credits!`)
}

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleString()
}

// 跳转到动态详细页
const navigateToMoment = (momentId) => {
  console.log('Navigating to moment:', momentId);
  router.push(`/moment/${momentId}`);
}
</script>

<style scoped>
.moments-layout {
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

.moments-content {
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
  gap: 1rem;
}

.back-btn {
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  font-weight: 500;
  flex-shrink: 0;
}

.search-bar {
  flex: 1;
  position: relative;
}

.search-bar input {
  width: 100%;
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 0.9rem;
  background-color: #f9fafb;
}

.search-loader {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-light);
  font-size: 0.8rem;
}

.new-post-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feed-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.moment-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.avatar {
  width: 40px;
  height: 40px;
  background-color: #e0e7ff;
  color: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
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
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
  background-color: #f9fafb;
  margin-left: -1.5rem;
  margin-right: -1.5rem;
  margin-bottom: -1.5rem;
  padding: 1rem 1.5rem;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.comment-item {
  font-size: 0.9rem;
}

.comment-user {
  font-weight: 600;
  margin-right: 0.5rem;
}

.comment-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.comment-input-wrapper input {
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 0.9rem;
}

.comment-input-wrapper button {
  background: none;
  border: none;
  color: var(--primary-color);
  font-weight: 600;
  cursor: pointer;
}

.comment-input-wrapper button:disabled {
  opacity: 0.5;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
}

textarea {
  width: 100%;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin: 1.5rem 0;
  font-family: inherit;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-light);
}

.post-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.post-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loader-wrapper, .empty-state {
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

.upload-area {
  margin-bottom: 1rem;
}

.upload-btn {
  background: #f3f4f6;
  border: 1px dashed #d1d5db;
  color: #6b7280;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  width: 100%;
  transition: all 0.2s;
}

.upload-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.image-preview {
  position: relative;
  display: inline-block;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  line-height: 1;
}

.hidden {
  display: none;
}
</style>
