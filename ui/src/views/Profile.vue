<template>
  <div class="profile-layout">
    <div class="profile-content">
      <div class="header-section card">
        <button class="back-btn" @click="router.push('/')">← {{ $t('common.back') }}</button>
        <div class="avatar-wrapper">
          <div class="avatar-large" :style="avatarUrl ? { backgroundImage: `url(${avatarUrl})`, backgroundSize: 'cover', color: 'transparent' } : {}">
            {{ profile?.username?.charAt(0).toUpperCase() }}
          </div>
          <button class="edit-avatar-btn" @click="triggerFileInput" :title="$t('profile.change_avatar')">📷</button>
          <input type="file" ref="fileInput" class="hidden" @change="handleFileChange" accept="image/*" />
        </div>
        <h2>{{ profile?.username }}</h2>
        <p class="role-badge">{{ profile?.role }}</p>
      </div>

      <div class="form-section card">
        <h3>{{ $t('profile.edit_title') }}</h3>
        <form @submit.prevent="saveProfile">
          <div class="form-group">
            <label>{{ $t('profile.nickname') }}</label>
            <input v-model="form.nickname" :placeholder="$t('profile.nickname')" />
          </div>

          <div class="form-group">
            <label>{{ $t('profile.bio') }}</label>
            <textarea v-model="form.bio" :placeholder="$t('profile.bio')" rows="3"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>{{ $t('profile.gender') }}</label>
              <select v-model="form.gender">
                <option value="">{{ $t('profile.select') }}</option>
                <option value="MALE">{{ $t('profile.gender_male') }}</option>
                <option value="FEMALE">{{ $t('profile.gender_female') }}</option>
                <option value="OTHER">{{ $t('profile.gender_other') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ $t('profile.location') }}</label>
              <input v-model="form.location" :placeholder="$t('profile.location')" />
            </div>
          </div>

          <div class="form-group">
            <label>{{ $t('profile.tags') }}</label>
            <div class="tags-input-container">
              <div class="tags-list">
                <span 
                  v-for="(tag, index) in tagsList" 
                  :key="index"
                  class="tag"
                  :style="{ backgroundColor: getTagColor(tag) }"
                >
                  {{ tag }}
                  <button type="button" class="tag-remove" @click="removeTag(index)">×</button>
                </span>
              </div>
              <div class="tag-input-wrapper">
                <input 
                  v-model="newTag"
                  :placeholder="$t('profile.add_tag')"
                  @keyup.enter="addTag"
                  @blur="addTag"
                />
                <button type="button" class="add-tag-btn" @click="addTag">+</button>
              </div>
            </div>
          </div>

          <button type="submit" class="save-btn" :disabled="userStore.loading">
            {{ userStore.loading ? $t('profile.saving') : $t('profile.save_changes') }}
          </button>
        </form>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="fade">
      <div v-if="toastMsg" class="toast">
        {{ toastMsg }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const userStore = useUserStore()
const router = useRouter()
// ...
const fileInput = ref(null)
const profile = ref(null)
const toastMsg = ref('')

const avatarUrl = computed(() => {
  if (!profile.value?.avatar) return null
  if (profile.value.avatar.startsWith('http')) return profile.value.avatar
  return `${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}${profile.value.avatar}`
})

const form = reactive({
  nickname: '',
  bio: '',
  gender: '',
  location: '',
  tags: '',
  avatar: ''
})

const tagsList = ref([])
const newTag = ref('')

onMounted(async () => {
  await userStore.fetchProfile()
  profile.value = userStore.profile
  
  // Fill form
  if (profile.value) {
    form.nickname = profile.value.nickname || ''
    form.bio = profile.value.bio || ''
    form.gender = profile.value.gender || ''
    form.location = profile.value.location || ''
    form.tags = profile.value.tags || ''
    form.avatar = profile.value.avatar || ''
    
    // Parse tags into array
    if (profile.value.tags) {
      tagsList.value = profile.value.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    }
  }
})

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileChange = async (e) => {
  const file = e.target.files[0]
  if (file) {
    const success = await userStore.uploadAvatar(file)
    if (success) {
      showToast('Avatar updated successfully!')
      // Refresh local profile ref
      profile.value = userStore.profile
    } else {
      showToast('Failed to upload avatar')
    }
  }
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !tagsList.value.includes(tag)) {
    tagsList.value.push(tag)
    newTag.value = ''
  }
}

const removeTag = (index) => {
  tagsList.value.splice(index, 1)
}

const getTagColor = (tag) => {
  // Generate consistent color based on tag content
  const colors = [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
  ]
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

const saveProfile = async () => {
  // Update form.tags with the current tagsList
  form.tags = tagsList.value.join(',')
  
  const success = await userStore.updateProfile(form)
  if (success) {
    showToast('资料更新成功！')
    // 刷新本地profile数据，确保UI显示最新状态
    profile.value = userStore.profile
  } else {
    showToast('资料更新失败，请稍后重试')
  }
}

const showToast = (msg) => {
  toastMsg.value = msg
  setTimeout(() => {
    toastMsg.value = ''
  }, 3000)
}
</script>

<style scoped>
.profile-layout {
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

.profile-content {
  max-width: 600px;
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
  padding: var(--spacing-8);
  box-shadow: var(--shadow-md);
  transition: all 0.4s var(--ease-bounce);
}

.card:hover {
  box-shadow: var(--shadow-hover);
}

.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding-top: var(--spacing-8);
}

/* --- 修改开始 --- */
.back-btn {
  position: absolute;
  left: var(--spacing-6);
  top: var(--spacing-6);
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-xl);
  transition: all var(--duration-fast) var(--ease-in-out);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.back-btn:hover {
  color: var(--primary-color);
  background: white;
  box-shadow: var(--shadow-sm);
}
/* --- 修改结束 --- */

.avatar-wrapper {
  position: relative;
  margin-bottom: var(--spacing-4);
}

.avatar-large {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, var(--primary-color), #7C3AED);
  color: white;
  /* --- 修改开始 --- */
  border-radius: 50%;
  /* --- 修改结束 --- */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-semibold);
  /* --- 修改开始 --- */
  overflow: hidden;
  background-position: center;
  background-repeat: no-repeat;
  /* --- 修改结束 --- */
}

.edit-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-normal) var(--ease-in-out);
}

.edit-avatar-btn:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

.role-badge {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(124, 58, 237, 0.1));
  color: var(--primary-color);
  padding: var(--spacing-1) var(--spacing-4);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  margin-top: var(--spacing-2);
}

.form-section h3 {
  margin-bottom: var(--spacing-6);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.form-group {
  margin-bottom: var(--spacing-5);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

input, textarea, select {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  font-family: inherit;
  transition: all var(--duration-normal) var(--ease-in-out);
  background-color: rgba(255, 255, 255, 0.8);
  color: var(--text-primary);
  font-size: var(--font-size-md);
}

input:focus, textarea:focus, select:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  background-color: white;
}

.save-btn {
  width: 100%;
  background: linear-gradient(135deg, var(--primary-color), #7C3AED);
  color: white;
  border: none;
  padding: var(--spacing-4);
  border-radius: var(--radius-xl);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);
  cursor: pointer;
  margin-top: var(--spacing-4);
  transition: all var(--duration-normal) var(--ease-in-out);
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.hidden {
  display: none;
}

.tags-input-container {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-3);
  min-height: 60px;
  background-color: rgba(255, 255, 255, 0.8);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--radius-xl);
  color: white;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  font-size: var(--font-size-md);
  cursor: pointer;
  line-height: 1;
  padding: 0;
  margin-left: var(--spacing-1);
}

.tag-input-wrapper {
  display: flex;
  gap: var(--spacing-2);
}

.tag-input-wrapper input {
  flex: 1;
  border: none;
  padding: 0;
  outline: none;
  background-color: transparent;
}

.add-tag-btn {
  background: linear-gradient(135deg, var(--primary-color), #7C3AED);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  transition: all var(--duration-normal) var(--ease-in-out);
}

.add-tag-btn:hover {
  transform: scale(1.1);
}

.toast {
  position: fixed;
  bottom: var(--spacing-8);
  left: 50%;
  transform: translateX(-50%);
  background-color: #111827;
  color: white;
  padding: var(--spacing-4) var(--spacing-8);
  border-radius: var(--radius-4xl);
  box-shadow: var(--shadow-2xl);
  z-index: 1000;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity var(--duration-normal) var(--ease-in-out);
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-layout {
    padding: var(--spacing-6) var(--spacing-4);
  }
  
  .card {
    padding: var(--spacing-6);
    border-radius: var(--radius-3xl);
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .profile-layout {
    padding: var(--spacing-4) var(--spacing-3);
  }
  
  .card {
    padding: var(--spacing-5);
    border-radius: var(--radius-2xl);
  }
  
  .avatar-large {
    width: 80px;
    height: 80px;
    font-size: var(--font-size-3xl);
  }
}
</style>
