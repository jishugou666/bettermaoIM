<template>
  <div class="auth-layout">
    <div class="auth-card">
      <div class="auth-header">
        <div class="logo">🐱</div>
        <h1>{{ $t('auth.login_title') }}</h1>
        <p>{{ $t('auth.login_subtitle') }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label>用户名或电子邮件</label>
          <div class="input-wrapper">
            <input 
              v-model="identifier" 
              type="text" 
              placeholder="请输入用户名或电子邮件" 
              required 
              :class="{ 'error': errors.identifier }"
              @input="clearError('identifier')"
              @focus="clearError('identifier')"
            />
          </div>
          <div v-if="errors.identifier" class="error-message">{{ errors.identifier }}</div>
        </div>

        <div class="form-group">
          <label>{{ $t('auth.password') }}</label>
          <div class="input-wrapper">
            <input 
              v-model="password" 
              type="password" 
              :placeholder="$t('auth.password_placeholder')" 
              required 
              :class="{ 'error': errors.password }"
              @input="clearError('password')"
              @focus="clearError('password')"
            />
          </div>
          <div v-if="errors.password" class="error-message">{{ errors.password }}</div>
        </div>

        <div v-if="authStore.error" class="error-alert">
          <span class="icon">⚠️</span>
          {{ authStore.error }}
        </div>

        <button type="submit" :disabled="authStore.loading" class="submit-btn">
          <span v-if="authStore.loading" class="loader"></span>
          <span v-else>{{ $t('auth.login_btn') }}</span>
        </button>
      </form>

      <div class="auth-footer">
        <p>{{ $t('auth.no_account') }} <router-link to="/register">{{ $t('auth.register') }}</router-link></p>
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

const identifier = ref('')
const password = ref('')
const authStore = useAuthStore()
const router = useRouter()
const errors = reactive({
  identifier: '',
  password: ''
})

const clearError = (field) => {
  errors[field] = ''
}

const validateForm = () => {
  let isValid = true
  
  if (!identifier.value) {
    errors.identifier = '请输入用户名或电子邮件'
    isValid = false
  }
  
  if (!password.value) {
    errors.password = '请输入密码'
    isValid = false
  }
  
  return isValid
}

const handleLogin = async () => {
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
  
  const success = await authStore.login(identifier.value, password.value)
  if (success) {
    router.push('/')
  }
}
</script>

<style scoped>
/* ... existing styles ... */
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
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
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