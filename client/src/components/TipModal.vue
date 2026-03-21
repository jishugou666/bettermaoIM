<template>
  <Transition name="modal">
    <div v-if="show" class="modal-mask" @click.self="$emit('close')">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ $t('tip.title') }}</h3>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>

        <div class="modal-body">
          <p class="balance-info">
            {{ $t('credit.balance') }}: <span class="gold">{{ creditStore.balance }} 💰</span>
          </p>

          <div class="amount-grid">
            <button 
              v-for="amt in amounts" 
              :key="amt"
              class="amount-btn"
              :class="{ selected: selectedAmount === amt }"
              @click="selectedAmount = amt"
            >
              {{ amt }} 💰
            </button>
            <div class="custom-amount">
              <input 
                v-model.number="customAmount" 
                :placeholder="$t('tip.custom')" 
                type="number"
                @focus="selectedAmount = null"
              />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" @click="$emit('close')">{{ $t('common.cancel') }}</button>
          <button 
            class="confirm-btn" 
            :disabled="!isValidAmount || loading"
            @click="handleTip"
          >
            {{ loading ? $t('common.loading') : $t('tip.send') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCreditStore } from '../stores/credit'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  show: Boolean,
  toUserId: Number
})

const emit = defineEmits(['close', 'success'])

const { t } = useI18n()
const creditStore = useCreditStore()
const amounts = [5, 10, 20, 50, 100]
const selectedAmount = ref(10)
const customAmount = ref('')
const loading = ref(false)

const finalAmount = computed(() => {
  if (selectedAmount.value) return selectedAmount.value
  return parseInt(customAmount.value) || 0
})

const isValidAmount = computed(() => {
  return finalAmount.value > 0 && finalAmount.value <= creditStore.balance
})

const handleTip = async () => {
  if (!isValidAmount.value || !props.toUserId) return
  
  loading.value = true
  const success = await creditStore.tipUser(props.toUserId, finalAmount.value)
  loading.value = false
  
  if (success) {
    emit('success', finalAmount.value)
    emit('close')
  } else {
    // 显示错误提示，使用toast或其他自定义组件
    // 这里可以使用与应用一致的错误提示方式
    console.error('Tip failed')
    // 可以在这里添加一个错误提示，比如使用与Credits.vue相同的toast
  }
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  transition: opacity 0.3s ease;
  align-items: center;
  justify-content: center;
}

.modal-container {
  width: 300px;
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
  padding: 1.5rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #9ca3af;
  padding: 0;
  line-height: 1;
}

.balance-info {
  text-align: center;
  margin-bottom: 1rem;
  color: #4b5563;
  font-size: 0.9rem;
}

.gold {
  color: #f59e0b;
  font-weight: 600;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.amount-btn {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.amount-btn.selected {
  background-color: #eff6ff;
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.custom-amount input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-align: center;
}

.custom-amount input:focus {
  border-color: var(--primary-color);
  outline: none;
}

.modal-footer {
  display: flex;
  gap: 1rem;
}

.modal-footer button {
  flex: 1;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.cancel-btn {
  background-color: #f3f4f6;
  color: #4b5563;
}

.confirm-btn {
  background-color: var(--primary-color);
  color: white;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Transitions */
.modal-enter-from {
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(1.1);
}
</style>
