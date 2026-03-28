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
const authStore = useAuthStore()
const router = useRouter()
const errors = reactive({
  username: '',
  email: '',
  password: ''
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
  
  const success = await authStore.register(username.value, email.value, password.value)
  if (success) {
    router.push('/')
  }
}
</script>

<style scoped>/* --- UI统一修改开始 --- */
.lang-switch-wrapper {
  margin-top: var(--spacing-4);
  display: flex;
  justify-content: center;
}

.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--bg-color) 100%);
  padding: var(--spacing-6);
  margin: 0;
}

.auth-card {
  background-color: var(--card-color);
  width: 100%;
  max-width: 420px;
  padding: var(--spacing-8);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  transition: all var(--duration-normal) var(--ease-in-out);
}

.auth-card:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-2px);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--spacing-6);
}

.logo {
  font-size: 3rem;
  margin-bottom: var(--spacing-4);
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

h1 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

p {
  color: var(--text-secondary);
  font-size: var(--font-size-md);
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

input {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  transition: all var(--duration-normal) var(--ease-in-out);
  background-color: var(--card-color);
  color: var(--text-primary);
}

input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

input.error {
  border-color: var(--error-color);
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.error-message {
  color: var(--error-color);
  font-size: var(--font-size-xs);
  margin-top: var(--spacing-1);
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.error-alert {
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  color: var(--error-color);
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.submit-btn {
  background-color: var(--primary-color);
  color: white;
  padding: var(--spacing-3) var(--spacing-6);
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-in-out);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-2);
}

.submit-btn:hover:not(:disabled) {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.auth-footer {
  margin-top: var(--spacing-6);
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.auth-footer a {
  font-weight: var(--font-weight-semibold);
  color: var(--primary-color);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-in-out);
}

.auth-footer a:hover {
  color: var(--primary-hover);
  text-decoration: underline;
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

/* 响应式设计 */
@media (max-width: 640px) {
  .auth-layout {
    padding: var(--spacing-4);
  }
  
  .auth-card {
    padding: var(--spacing-6);
  }
  
  .auth-header h1 {
    font-size: var(--font-size-xl);
  }
  
  input {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-sm);
  }
  
  .submit-btn {
    padding: var(--spacing-2) var(--spacing-4);
    font-size: var(--font-size-sm);
  }
}
/* --- UI统一修改结束 --- */
</style>