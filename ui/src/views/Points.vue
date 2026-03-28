<template>
  <div class="points-layout">
    <div class="points-container">
      <div class="points-header">
        <button class="back-btn" @click="router.push('/')">←</button>
        <h2>{{ $t('nav.credits') }}</h2>
      </div>
      
      <div class="points-balance card">
        <h3>{{ $t('credit.balance') }}</h3>
        <div class="balance-amount">{{ userStore.points || 0 }} 💰</div>
        <div class="balance-sub">{{ $t('credit.total_earned') }}: {{ totalEarned }} 💰</div>
      </div>
      
      <div class="points-actions card">
        <h3>{{ $t('credit.daily_tasks') }}</h3>
        <div class="task-item" @click="handleCheckIn">
          <div class="task-info">
            <span class="task-icon">📅</span>
            <span class="task-name">{{ $t('credit.task_daily_login') }}</span>
          </div>
          <button 
            class="task-btn" 
            :disabled="checkedIn"
          >
            {{ checkedIn ? $t('credit.done') : $t('credit.action_check_in') }}
          </button>
        </div>
      </div>
      
      <div class="points-rank card">
        <h3>{{ $t('common.rank') }}</h3>
        <div class="rank-list">
          <div v-if="userStore.loading" class="loading">{{ $t('common.loading') }}</div>
          <div v-else-if="userStore.pointsRank.length === 0" class="empty">暂无排行数据</div>
          <div 
            v-for="(user, index) in userStore.pointsRank" 
            :key="user.id" 
            class="rank-item"
            :class="{ 'current-user': user.id === currentUserId }"
          >
            <div class="rank-number">{{ index + 1 }}</div>
            <div class="rank-user">
              <Avatar :username="user.nickname || user.username" :src="user.avatar" />
              <span class="rank-username">{{ user.nickname || user.username }}</span>
            </div>
            <div class="rank-points">{{ user.points }} 💰</div>
          </div>
        </div>
      </div>
      
      <div class="points-history card">
        <h3>{{ $t('credit.history') }}</h3>
        <div class="history-list">
          <div v-if="pointsHistory.length === 0" class="empty">{{ $t('credit.no_history') }}</div>
          <div 
            v-for="(item, index) in pointsHistory" 
            :key="index" 
            class="history-item"
          >
            <div class="history-info">
              <span class="history-type">{{ item.description }}</span>
              <span class="history-time">{{ formatTime(item.createTime) }}</span>
            </div>
            <div class="history-amount" :class="{ 'positive': item.amount > 0 }">
              {{ item.amount > 0 ? '+' : '' }}{{ item.amount }} 💰
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../stores/user'
import { useCreditStore } from '../stores/credit'
import { useRouter } from 'vue-router'
import Avatar from '../components/Avatar.vue'
import { useI18n } from 'vue-i18n'
import { signIn } from '../api/points'

const { t } = useI18n()
const userStore = useUserStore()
const creditStore = useCreditStore()
const router = useRouter()

const checkedIn = ref(false)
const totalEarned = ref(0)
const pointsHistory = ref([])
const currentUserId = ref(null)

const handleCheckIn = async () => {
  try {
    const response = await signIn()
    if (response.success) {
      alert(`签到成功！获得 ${response.points} 积分`)
      checkedIn.value = true
      await userStore.fetchCurrentUser()
      await fetchPointsHistory()
    }
  } catch (error) {
    alert(error.message || '签到失败')
  }
}

const fetchPointsHistory = async () => {
  try {
    // 这里应该调用 API 获取积分历史
    // 暂时使用模拟数据
    pointsHistory.value = [
      { description: '每日签到', amount: 10, createTime: new Date().toISOString() },
      { description: '发布动态', amount: 5, createTime: new Date(Date.now() - 86400000).toISOString() },
      { description: '点赞动态', amount: 1, createTime: new Date(Date.now() - 172800000).toISOString() }
    ]
    totalEarned.value = pointsHistory.value.reduce((sum, item) => sum + item.amount, 0)
  } catch (error) {
    console.error('Failed to fetch points history:', error)
    pointsHistory.value = []
  }
}

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleString()
}

onMounted(async () => {
  try {
    await userStore.fetchCurrentUser()
    await userStore.fetchPointsRank()
    await fetchPointsHistory()
    currentUserId.value = userStore.currentUser?.id
    // 暂时假设已经签到
    checkedIn.value = false
  } catch (error) {
    console.error('Failed to initialize points page:', error)
  }
})
</script>

<style scoped>
.points-layout {
  min-height: 100vh;
  background: var(--bg-gradient);
  display: flex;
  justify-content: center;
  padding-top: var(--spacing-8);
  margin: 0;
}

.points-container {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
  padding: 0 var(--spacing-6);
}

.points-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.back-btn {
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  display: flex;
  align-items: center;
  margin-right: var(--spacing-4);
  transition: color var(--duration-fast) var(--ease-in-out);
}

.back-btn:hover {
  color: var(--primary-color);
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
  transform: translateY(-4px);
}

.points-balance h3, .points-actions h3, .points-rank h3, .points-history h3 {
  margin-top: 0;
  margin-bottom: var(--spacing-4);
  color: var(--text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.balance-amount {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  background: linear-gradient(135deg, var(--primary-color), #7C3AED);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--spacing-2);
}

.balance-sub {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-xl);
  transition: all var(--duration-normal) var(--ease-in-out);
  cursor: pointer;
}

.task-item:hover {
  background-color: rgba(255, 255, 255, 0.8);
  transform: translateX(4px);
}

.task-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.task-icon {
  font-size: var(--font-size-2xl);
}

.task-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.task-btn {
  padding: var(--spacing-3) var(--spacing-4);
  background: linear-gradient(135deg, var(--primary-color), #7C3AED);
  color: white;
  border: none;
  border-radius: var(--radius-xl);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  transition: all var(--duration-normal) var(--ease-in-out);
}

.task-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.task-btn:disabled {
  background-color: #e5e7eb;
  background-image: none;
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.rank-list, .history-list {
  max-height: 300px;
  overflow-y: auto;
}

.loading, .empty {
  text-align: center;
  padding: var(--spacing-8);
  color: var(--text-tertiary);
}

.rank-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-4);
  border-radius: var(--radius-xl);
  transition: all var(--duration-normal) var(--ease-in-out);
  cursor: pointer;
}

.rank-item:hover {
  background-color: rgba(255, 255, 255, 0.5);
  transform: translateX(4px);
}

.rank-item.current-user {
  background-color: rgba(79, 70, 229, 0.1);
}

.rank-number {
  width: 30px;
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.rank-user {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.rank-username {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.rank-points {
  font-weight: var(--font-weight-semibold);
  background: linear-gradient(135deg, var(--primary-color), #7C3AED);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  border-radius: var(--radius-xl);
  transition: all var(--duration-normal) var(--ease-in-out);
  cursor: pointer;
}

.history-item:hover {
  background-color: rgba(255, 255, 255, 0.5);
  transform: translateX(4px);
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.history-type {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.history-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.history-amount {
  font-weight: var(--font-weight-semibold);
  color: var(--error-color);
}

.history-amount.positive {
  color: var(--success-color);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .points-container {
    padding: 0 var(--spacing-4);
  }
  
  .card {
    padding: var(--spacing-5);
    border-radius: var(--radius-3xl);
  }
  
  .balance-amount {
    font-size: var(--font-size-3xl);
  }
}
</style>