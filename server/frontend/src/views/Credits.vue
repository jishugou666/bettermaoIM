<template>
  <div class="credit-layout">
    <div class="credit-content">
      <div class="header-section card">
          <button class="back-btn" @click="router.push('/')">← {{ $t('common.back') }}</button>
          <div class="balance-container">
            <div class="balance-item">
              <span class="label">{{ $t('credit.balance') }}</span>
              <span class="value gold">{{ creditStore.balance }} 💰</span>
            </div>
            <div class="balance-divider"></div>
            <div class="balance-item">
              <span class="label">{{ $t('credit.total_earned') }}</span>
              <span class="value">{{ creditStore.totalEarned }}</span>
            </div>
          </div>
          <div class="vip-banner" v-if="!authStore.user?.isVip">
            <div class="vip-info">
              <span class="vip-icon">👑</span>
              <div class="vip-text">
                <h4>{{ $t('credit.vip_title') }}</h4>
                <p>{{ $t('credit.vip_desc') }}</p>
              </div>
            </div>
            <button class="vip-btn" @click="handlePurchaseVip">
              {{ $t('credit.vip_buy') }}
            </button>
          </div>
          <div class="vip-status" v-else>
            <span class="vip-badge">👑 {{ $t('credit.vip_member') }}</span>
          </div>
        </div>

      <div class="main-grid">
        <div class="tasks-section card">
          <h3>{{ $t('credit.daily_tasks') }}</h3>
          <div class="task-list">
            <div v-for="task in creditStore.tasks" :key="task.key" class="task-item" :class="{ 'completed': task.completed }">
              <div class="task-info">
                <span class="task-name">{{ $t(`credit.task_${task.key}`) }}</span>
                <span class="task-reward">+{{ task.reward }} 💰</span>
              </div>
              <button 
                v-if="!task.completed" 
                class="complete-btn"
                :class="{ 'action-btn': getTaskAction(task.key).isAction }"
                @click="handleTaskAction(task.key)"
              >
                {{ getTaskAction(task.key).label }}
              </button>
              <div v-else class="completed-badge">
                <span class="completed-icon">✓</span>
                <span class="completed-text">{{ $t('credit.done') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="history-section card">
          <h3>{{ $t('credit.history') }}</h3>
          <div class="transaction-list">
            <div v-if="creditStore.transactions.length === 0" class="empty">
              {{ $t('credit.no_history') }}
            </div>
            <div v-for="tx in creditStore.transactions" :key="tx.id" class="tx-item">
              <div class="tx-info">
                <span class="tx-type">{{ tx.remark }}</span>
                <span class="tx-date">{{ formatDate(tx.createdAt) }}</span>
              </div>
              <span class="tx-amount" :class="{ plus: tx.amount > 0 }">
                {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reward Toast -->
    <Transition name="fade">
      <div v-if="rewardToast" class="reward-toast">
        <span class="toast-icon">✨</span>
        <span class="toast-msg">{{ rewardToast }}</span>
      </div>
    </Transition>

    <!-- VIP Purchase Confirm Modal -->
    <Modal
      :visible="showVipModal"
      :title="$t('credit.vip_title')"
      @close="showVipModal = false"
      @confirm="confirmVipPurchase"
    >
      <div>
        <p>{{ $t('credit.purchase_vip_confirm') }}</p>
        <p class="balance-warning" v-if="creditStore.balance < 5000">
          {{ $t('credit.insufficient_balance') }}
        </p>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCreditStore } from '../stores/credit'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Modal from '../components/Modal.vue'

const { t } = useI18n()
const creditStore = useCreditStore()
const authStore = useAuthStore()
const router = useRouter()
const rewardToast = ref('')
const showVipModal = ref(false)

onMounted(async () => {
  await creditStore.fetchBalance()
  await creditStore.fetchTransactions()
  await creditStore.fetchTasks()
  
  // Auto-check daily login
  handleDailyLogin()
})

const handleDailyLogin = async () => {
  const result = await creditStore.reportTask('daily_login')
  if (result) {
    showToast(result.message)
  }
}

const handlePurchaseVip = async () => {
  if (creditStore.balance < 5000) {
    showToast(t('credit.insufficient_balance'))
    return
  }
  
  showVipModal.value = true
}

const confirmVipPurchase = async () => {
  showVipModal.value = false
  
  try {
    const result = await creditStore.purchaseVip()
    if (result) {
      showToast(t('credit.vip_purchased'))
      authStore.user.isVip = true // Optimistic update
    }
  } catch (e) {
    showToast(e.message || t('credit.purchase_failed'))
  }
}

const handleTaskAction = async (taskKey) => {
  const action = getTaskAction(taskKey)
  
  if (action.isAction) {
    router.push(action.route)
  } else {
    // Direct claim (e.g. daily login)
    const result = await creditStore.reportTask(taskKey)
    if (result) {
      showToast(result.message)
      await creditStore.fetchTransactions()
      await creditStore.fetchTasks() // 确保任务状态被正确更新
    }
  }
}

const getTaskAction = (taskKey) => {
  switch (taskKey) {
    case 'daily_login':
      return { label: t('credit.action_check_in'), isAction: false }
    case 'profile_complete':
      return { label: t('credit.action_go_edit'), isAction: true, route: '/profile' }
    case 'first_friend':
      return { label: t('credit.action_find_friends'), isAction: true, route: '/friends' }
    case 'first_moment':
      return { label: t('credit.action_post_now'), isAction: true, route: '/moments' }
    case 'first_like':
    case 'first_comment':
      return { label: t('credit.action_go_explore'), isAction: true, route: '/moments' }
    default:
      return { label: t('credit.action_complete'), isAction: false }
  }
}

const showToast = (msg) => {
  rewardToast.value = msg
  setTimeout(() => {
    rewardToast.value = ''
  }, 3000)
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString() + ' ' + new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.credit-layout {
  min-height: 100vh;
  width: 100vw;
  overflow-x: hidden;
  background: linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  box-sizing: border-box;
}

.credit-content {
  max-width: 1000px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.header-section {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.back-btn {
  align-self: flex-start;
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  font-weight: 500;
}

.balance-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4rem;
}

.balance-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.balance-item .label {
  font-size: 0.9rem;
  color: var(--text-light);
}

.balance-item .value {
  font-size: 2.5rem;
  font-weight: 800;
}

.value.gold {
  color: #f59e0b;
}

.balance-divider {
  width: 1px;
  height: 50px;
  background-color: #e5e7eb;
}

.vip-banner {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.vip-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.vip-icon {
  font-size: 2.5rem;
}

.vip-text h4 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fbbf24;
  margin: 0;
}

.vip-text p {
  font-size: 0.9rem;
  color: #e0e7ff;
  margin: 0;
}

.vip-btn {
  background: #fbbf24;
  color: #1e1b4b;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s;
}

.vip-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
}

.vip-status {
  text-align: center;
  margin-top: 1rem;
  padding: 1rem;
  background: #fef3c7;
  border-radius: 16px;
  color: #b45309;
  font-weight: 700;
  font-size: 1.2rem;
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background: white;
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
}

h3 {
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
}

.task-list, .transaction-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-item, .tx-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 16px;
}

.task-info, .tx-info {
  display: flex;
  flex-direction: column;
}

.task-name {
  font-weight: 600;
}

.task-reward {
  font-size: 0.85rem;
  color: #f59e0b;
  font-weight: 500;
}

.complete-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.complete-btn.action-btn {
  background-color: white;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.complete-btn.action-btn:hover {
  background-color: #e0e7ff;
}

.completed-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--success);
  font-weight: 600;
  background-color: #d1fae5;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.completed-icon {
  background-color: var(--success);
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.task-item.completed {
  background-color: #f0fdf4;
  border-left: 4px solid var(--success);
}

.tx-type {
  font-weight: 500;
}

.tx-date {
  font-size: 0.75rem;
  color: var(--text-light);
}

.tx-amount {
  font-weight: 700;
  font-size: 1.1rem;
}

.tx-amount.plus {
  color: var(--success);
}

.reward-toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: #111827;
  color: white;
  padding: 1rem 2rem;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.fade-enter-active, .fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
