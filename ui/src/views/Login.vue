<template>
  <div class="login-layout">
    <div class="login-container card">
      <div class="login-header">
        <h1>{{ $t('auth.login_title') }}</h1>
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
          {{ loading ? $t('common.loading') : $t('auth.login_btn') }}
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

<style scoped>/* --- UI统一修改开始 --- */
.login-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--bg-color) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-6);
  margin: 0;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: var(--spacing-8);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-4);
}

.login-header h1 {
  font-size: var(--font-size-2xl);
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
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  transition: all var(--duration-normal) var(--ease-in-out);
  background-color: var(--card-color);
  color: var(--text-primary);
}

.input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.btn {
  padding: var(--spacing-3) var(--spacing-6);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-in-out);
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
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
  font-weight: var(--font-weight-medium);
  transition: color var(--duration-fast) var(--ease-in-out);
}

.login-footer a:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .login-layout {
    padding: var(--spacing-4);
  }
  
  .login-container {
    padding: var(--spacing-6);
  }
  
  .login-header h1 {
    font-size: var(--font-size-xl);
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
/* --- UI统一修改结束 --- */
</style>
