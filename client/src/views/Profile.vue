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
          <input v-model="form.tags" :placeholder="$t('profile.tags')" />
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

const saveProfile = async () => {
  const success = await userStore.updateProfile(form)
  if (success) {
    showToast('Profile updated successfully!')
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
