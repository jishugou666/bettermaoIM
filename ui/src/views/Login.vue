<template>
  <div class="login-layout">
    <div class="login-container glass-card card-transition">
      <!-- Logo区域 -->
      <div class="login-logo">
        <div class="logo-icon">
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#gradient)"/>
            <path d="M16 8L22 12V20L16 24L10 20V12L16 8Z" fill="white"/>
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
                <stop stop-color="#4F46E5"/>
                <stop offset="1" stop-color="#7C3AED"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1>BetterMao IM</h1>
      </div>

      <div class="login-header">
        <h2>{{ $t('auth.login_title') }}</h2>
        <p>{{ $t('auth.login_subtitle') }}</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label" for="identifier">{{ $t('auth.email') }}</label>
          <input 
            type="text" 
            id="identifier" 
            v-model="form.identifier" 
            :placeholder="$t('auth.email_placeholder')" 
            class="input"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="form-label" for="password">{{ $t('auth.password') }}</label>
          <input 
            type="password" 
            id="password" 
            v-model="form.password" 
            :placeholder="$t('auth.password_placeholder')" 
            class="input"
            required
          />
        </div>
        
        <button type="submit" class="btn btn-primary w-full" :disabled="loading">
          <span v-if="loading" class="loader"></span>
          <span v-else>{{ $t('auth.login_btn') }}</span>
        </button>
        
        <div class="login-footer">
          <p>{{ $t('auth.no_account') }} <router-link to="/register">{{ $t('auth.register') }}</router-link></p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>/* --- UI统一修改开始 --- */
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()

const form = ref({
  identifier: '',
  password: ''
})

const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  try {
    const success = await authStore.login(form.value.identifier, form.value.password)
    if (success) {
      router.push('/')
    }
  } catch (error) {
    console.error('Login failed:', error)
  } finally {
    loading.value = false
  }
}
/* --- UI统一修改结束 --- */
</script>

<style scoped>
.login-layout {
  min-height: 100vh;
  background: var(--bg-gradient);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-6);
  margin: 0;
}

.login-container {
  width: 100%;
  max-width: 420px;
  padding: var(--spacing-10);
  border-radius: var(--radius-4xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.login-container:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-hover);
}

/* Logo区域 */
.login-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-2);
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.login-logo h1 {
  font-family: 'Outfit', sans-serif;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  background: linear-gradient(135deg, var(--primary-color), #7C3AED);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-2);
}

.login-header h2 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.login-header p {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.input {
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-md);
  transition: all var(--duration-normal) var(--ease-in-out);
  background-color: rgba(255, 255, 255, 0.8);
  color: var(--text-primary);
}

.input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  background-color: white;
}

.btn {
  padding: var(--spacing-3) var(--spacing-6);
  border: none;
  border-radius: var(--radius-xl);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-in-out);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), #7C3AED);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.w-full {
  width: 100%;
}

.login-footer {
  text-align: center;
  margin-top: var(--spacing-4);
}

.login-footer p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

.login-footer a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
  transition: color var(--duration-fast) var(--ease-in-out);
}

.login-footer a:hover {
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
  .login-layout {
    padding: var(--spacing-4);
  }
  
  .login-container {
    padding: var(--spacing-8);
    border-radius: var(--radius-3xl);
  }
  
  .login-logo h1 {
    font-size: var(--font-size-xl);
  }
  
  .login-header h2 {
    font-size: var(--font-size-lg);
  }
  
  .input {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-sm);
  }
  
  .btn {
    padding: var(--spacing-2) var(--spacing-4);
    font-size: var(--font-size-sm);
  }
}
</style>
