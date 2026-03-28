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
import { usePointsStore } from '../stores/credit'
import { useRouter } from 'vue-router'
import Avatar from '../components/Avatar.vue'
import { useI18n } from 'vue-i18n'
import { signIn } from '../api/points'

const { t } = useI18n()
const userStore = useUserStore()
const pointsStore = usePointsStore()
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
  background: linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%);
  display: flex;
  justify-content: center;
  padding-top: 2rem;
  margin: 0;
}

.points-container {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0 1rem;
}

.points-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.back-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-light);
  padding: 0;
  display: flex;
  align-items: center;
  margin-right: 1rem;
}

.back-btn:hover {
  color: var(--primary-color);
}

.card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.points-balance h3, .points-actions h3, .points-rank h3, .points-history h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--text-color);
  font-size: 1.2rem;
}

.balance-amount {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.balance-sub {
  font-size: 0.9rem;
  color: var(--text-light);
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 12px;
  transition: background 0.2s;
  cursor: pointer;
}

.task-item:hover {
  background-color: #f3f4f6;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.task-icon {
  font-size: 1.5rem;
}

.task-name {
  font-weight: 500;
  color: var(--text-color);
}

.task-btn {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.task-btn:hover:not(:disabled) {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.task-btn:disabled {
  background-color: #e5e7eb;
  color: var(--text-light);
  cursor: not-allowed;
}

.rank-list, .history-list {
  max-height: 300px;
  overflow-y: auto;
}

.loading, .empty {
  text-align: center;
  padding: 2rem;
  color: var(--text-light);
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 12px;
  transition: background 0.2s;
  cursor: pointer;
}

.rank-item:hover {
  background-color: #f9fafb;
}

.rank-item.current-user {
  background-color: #e0e7ff;
}

.rank-number {
  width: 30px;
  font-weight: 600;
  color: var(--text-color);
}

.rank-user {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.rank-username {
  font-weight: 500;
  color: var(--text-color);
}

.rank-points {
  font-weight: 600;
  color: var(--primary-color);
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 12px;
  transition: background 0.2s;
  cursor: pointer;
}

.history-item:hover {
  background-color: #f9fafb;
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.history-type {
  font-weight: 500;
  color: var(--text-color);
}

.history-time {
  font-size: 0.8rem;
  color: var(--text-light);
}

.history-amount {
  font-weight: 600;
  color: var(--error);
}

.history-amount.positive {
  color: var(--success);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .points-container {
    padding: 0 0.5rem;
  }
  
  .card {
    padding: 1rem;
  }
  
  .balance-amount {
    font-size: 2rem;
  }
}
</style>