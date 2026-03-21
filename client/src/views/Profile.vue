<template>
  <div class="profile-layout">
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
  max-width: 600px;
  margin: 2rem auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: var(--shadow);
}

.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.back-btn {
  position: absolute;
  left: 2rem;
  top: 2rem;
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  font-weight: 500;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

.avatar-large {
  width: 100px;
  height: 100px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 600;
}

.edit-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.role-badge {
  background-color: #e0e7ff;
  color: var(--primary-color);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.form-section h3 {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.9rem;
  color: #374151;
}

input, textarea, select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-family: inherit;
  transition: border-color 0.2s;
}

input:focus, textarea:focus, select:focus {
  border-color: var(--primary-color);
  outline: none;
}

.save-btn {
  width: 100%;
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.875rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.hidden {
  display: none;
}

.tags-input-container {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.75rem;
  min-height: 60px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  color: white;
  font-size: 0.8rem;
  font-weight: 500;
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  margin-left: 0.25rem;
}

.tag-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.tag-input-wrapper input {
  flex: 1;
  border: none;
  padding: 0;
  outline: none;
}

.add-tag-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: bold;
}

.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: #111827;
  color: white;
  padding: 1rem 2rem;
  border-radius: 50px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
