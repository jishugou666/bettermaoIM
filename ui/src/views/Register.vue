<template>
  <div class="auth-layout">
    <div class="auth-card">
      <div class="auth-header">
        <div class="logo">🚀</div>
        <h1>{{ $t('auth.register_title') }}</h1>
        <p>{{ $t('auth.register_subtitle') }}</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label>{{ $t('auth.username') }}</label>
          <input 
            v-model="username" 
            type="text" 
            :placeholder="$t('auth.username_placeholder')" 
            required 
            :class="{ 'error': errors.username }"
            @input="clearError('username')"
            @focus="clearError('username')"
          />
          <div v-if="errors.username" class="error-message">{{ errors.username }}</div>
        </div>

        <div class="form-group">
          <label>{{ $t('auth.email') }}</label>
          <input 
            v-model="email" 
            type="email" 
            :placeholder="$t('auth.email_placeholder')" 
            required 
            :class="{ 'error': errors.email }"
            @input="clearError('email')"
            @focus="clearError('email')"
          />
          <div v-if="errors.email" class="error-message">{{ errors.email }}</div>
        </div>

        <div class="form-group">
          <label>{{ $t('auth.password') }}</label>
          <input 
            v-model="password" 
            type="password" 
            :placeholder="$t('auth.password_placeholder')" 
            required 
            :class="{ 'error': errors.password }"
            @input="clearError('password')"
            @focus="clearError('password')"
          />
          <div v-if="errors.password" class="error-message">{{ errors.password }}</div>
        </div>

        <div class="form-group">
          <label>{{ $t('auth.nickname') }}</label>
          <input 
            v-model="nickname" 
            type="text" 
            placeholder="请输入昵称" 
            required 
            :class="{ 'error': errors.nickname }"
            @input="clearError('nickname')"
            @focus="clearError('nickname')"
          />
          <div v-if="errors.nickname" class="error-message">{{ errors.nickname }}</div>
        </div>

        <div v-if="authStore.error" class="error-alert">
          <span class="icon">⚠️</span>
          {{ authStore.error }}
        </div>

        <button type="submit" :disabled="authStore.loading" class="submit-btn">
          <span v-if="authStore.loading" class="loader"></span>
          <span v-else>{{ $t('auth.register_btn') }}</span>
        </button>
      </form>

      <div class="auth-footer">
        <p>{{ $t('auth.has_account') }} <router-link to="/login">{{ $t('auth.login') }}</router-link></p>
        <div class="lang-switch-wrapper">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'

const username = ref('')
const email = ref('')
const password = ref('')
const nickname = ref('')
const authStore = useAuthStore()
const router = useRouter()
const errors = reactive({
  username: '',
  email: '',
  password: '',
  nickname: ''
})

const clearError = (field) => {
  errors[field] = ''
}

const validateForm = () => {
  let isValid = true
  
  if (!username.value) {
    errors.username = '请输入用户名'
    isValid = false
  }
  
  if (!email.value) {
    errors.email = '请输入邮箱'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.email = '请输入有效的邮箱地址'
    isValid = false
  }
  
  if (!password.value) {
    errors.password = '请输入密码'
    isValid = false
  } else if (password.value.length < 6) {
    errors.password = '密码长度至少为6位'
    isValid = false
  }
  
  if (!nickname.value) {
    errors.nickname = '请输入昵称'
    isValid = false
  }
  
  return isValid
}

const handleRegister = async () => {
  if (!validateForm()) {
    // 添加抖动效果
    const errorInputs = document.querySelectorAll('.error')
    errorInputs.forEach(input => {
      input.classList.add('shake')
      setTimeout(() => {
        input.classList.remove('shake')
      }, 500)
    })
    return
  }
  
  const success = await authStore.register(username.value, email.value, password.value, nickname.value)
  if (success) {
    router.push('/')
  }
}
</script>

<style scoped>
/* Reusing styles from Login.vue for consistency */
/* In a real project, these should be shared components or mixins */
.lang-switch-wrapper {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%);
  padding: 1rem;
}

.auth-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  width: 100%;
  max-width: 420px;
  padding: 2.5rem;
  border-radius: 24px;
  box-shadow: var(--glass-shadow);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

p {
  color: #6b7280;
  font-size: 0.95rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  background-color: #f9fafb;
}

input:focus {
  border-color: var(--primary-color);
  background-color: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

input.error {
  border-color: var(--error);
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.error-message {
  color: var(--error);
  font-size: 0.75rem;
  margin-top: 0.25rem;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.error-alert {
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  color: var(--error);
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.submit-btn {
  background-color: var(--primary-color);
  color: white;
  padding: 0.875rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.submit-btn:hover:not(:disabled) {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: #6b7280;
}

.auth-footer a {
  font-weight: 600;
}

.loader {
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>