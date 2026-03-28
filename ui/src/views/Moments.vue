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
  background: var(--bg-gradient);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-8) var(--spacing-6);
  box-sizing: border-box;
}

.moments-content {
  max-width: 800px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.card {
  background: var(--card-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-4xl);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-md);
  transition: all 0.4s var(--ease-bounce);
}

.card:hover {
  box-shadow: var(--shadow-hover);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-4);
}

.back-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  flex-shrink: 0;
  transition: color var(--duration-fast) var(--ease-in-out);
}

.back-btn:hover {
  color: var(--primary-color);
}

.search-bar {
  flex: 1;
  position: relative;
}

.search-bar input {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-sm);
  background-color: rgba(255, 255, 255, 0.8);
  color: var(--text-primary);
  transition: all var(--duration-normal) var(--ease-in-out);
}

.search-bar input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  background-color: white;
}

.search-loader {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
}

.new-post-btn {
  background: linear-gradient(135deg, var(--primary-color), #7C3AED);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--duration-normal) var(--ease-in-out);
}

.new-post-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.feed-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.moment-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-4);
}

.avatar {
  width: 40px;
  height: 40px;
  background-color: rgba(79, 70, 229, 0.1);
  color: var(--primary-color);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.moment-content {
  font-size: var(--font-size-md);
  line-height: var(--line-height-normal);
  margin-bottom: var(--spacing-4);
  white-space: pre-wrap;
  color: var(--text-primary);
}

.moment-actions {
  display: flex;
  gap: var(--spacing-6);
  border-top: 1px solid var(--border-light);
  padding-top: var(--spacing-4);
}

.action-btn {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  color: var(--text-tertiary);
  transition: all var(--duration-normal) var(--ease-in-out);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-md);
}

.action-btn:hover {
  color: var(--text-primary);
  background-color: rgba(255, 255, 255, 0.5);
}

.action-btn.active {
  color: #ef4444;
}

/* Comments */
.comments-section {
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--border-light);
  background-color: rgba(255, 255, 255, 0.3);
  margin-left: calc(var(--spacing-6) * -1);
  margin-right: calc(var(--spacing-6) * -1);
  margin-bottom: calc(var(--spacing-6) * -1);
  padding: var(--spacing-4) var(--spacing-6);
  border-bottom-left-radius: var(--radius-4xl);
  border-bottom-right-radius: var(--radius-4xl);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
}

.comment-item {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.comment-user {
  font-weight: var(--font-weight-semibold);
  margin-right: var(--spacing-2);
}

.comment-input-wrapper {
  display: flex;
  gap: var(--spacing-2);
}

.comment-input-wrapper input {
  flex: 1;
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-sm);
  background-color: rgba(255, 255, 255, 0.8);
  color: var(--text-primary);
}

.comment-input-wrapper button {
  background: none;
  border: none;
  color: var(--primary-color);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-in-out);
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
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: var(--card-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-light);
  padding: var(--spacing-8);
  border-radius: var(--radius-4xl);
  width: 90%;
  max-width: 500px;
  box-shadow: var(--shadow-2xl);
}

textarea {
  width: 100%;
  padding: var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  margin: var(--spacing-6) 0;
  font-family: inherit;
  resize: vertical;
  background-color: rgba(255, 255, 255, 0.8);
  color: var(--text-primary);
  font-size: var(--font-size-md);
}

textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  background-color: white;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-4);
}

.cancel-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-xl);
  transition: all var(--duration-fast) var(--ease-in-out);
}

.cancel-btn:hover {
  color: var(--text-primary);
  background-color: rgba(255, 255, 255, 0.5);
}

.post-btn {
  background: linear-gradient(135deg, var(--primary-color), #7C3AED);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--radius-xl);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-in-out);
}

.post-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.post-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loader-wrapper, .empty-state {
  text-align: center;
  padding: var(--spacing-8);
  color: var(--text-tertiary);
}

.loader {
  border: 3px solid rgba(79, 70, 229, 0.2);
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
  gap: var(--spacing-2);
  margin-top: var(--spacing-2);
}

.moment-img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: transform var(--duration-normal) var(--ease-in-out);
}

.moment-img:hover {
  transform: scale(1.02);
}

.upload-area {
  margin-bottom: var(--spacing-4);
}

.upload-btn {
  background: rgba(255, 255, 255, 0.5);
  border: 1px dashed var(--border-color);
  color: var(--text-secondary);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-xl);
  cursor: pointer;
  font-size: var(--font-size-sm);
  width: 100%;
  transition: all var(--duration-normal) var(--ease-in-out);
}

.upload-btn:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.image-preview {
  position: relative;
  display: inline-block;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: var(--radius-xl);
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--error-color);
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
  line-height: 1;
}

.hidden {
  display: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .moments-layout {
    padding: var(--spacing-6) var(--spacing-4);
  }
  
  .card {
    padding: var(--spacing-5);
    border-radius: var(--radius-3xl);
  }
  
  .header-section {
    flex-wrap: wrap;
  }
  
  .search-bar {
    order: 3;
    width: 100%;
  }
  
  .modal {
    padding: var(--spacing-6);
    border-radius: var(--radius-3xl);
  }
}

@media (max-width: 480px) {
  .moments-layout {
    padding: var(--spacing-4) var(--spacing-3);
  }
  
  .card {
    padding: var(--spacing-4);
    border-radius: var(--radius-2xl);
  }
  
  .moment-actions {
    gap: var(--spacing-3);
  }
  
  .action-btn {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-sm);
  }
}
</style>
