<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleClose">
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="modal-close" @click="handleClose">×</button>
      </div>
      <div class="modal-body">
        <slot></slot>
      </div>
      <div class="modal-footer" v-if="showConfirm || showCancel">
        <button 
          v-if="showCancel" 
          class="btn btn-secondary" 
          @click="handleClose"
        >
          {{ cancelText }}
        </button>
        <button 
          v-if="showConfirm" 
          class="btn btn-primary" 
          @click="handleConfirm"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>/* --- UI统一修改开始 --- */
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '提示'
  },
  showCancel: {
    type: Boolean,
    default: true
  },
  showConfirm: {
    type: Boolean,
    default: true
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  cancelText: {
    type: String,
    default: '取消'
  }
})

const emit = defineEmits(['close', 'confirm'])

const handleClose = () => {
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
}
/* --- UI统一修改结束 --- */
</script>

<style scoped>/* --- UI统一修改开始 --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn var(--duration-normal) var(--ease-in-out);
}

.modal {
  background-color: var(--card-color);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  padding: var(--spacing-6);
  max-width: 90%;
  width: 500px;
  animation: slideIn var(--duration-normal) var(--ease-out);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-4);
  border-bottom: 1px solid var(--divider-color);
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  cursor: pointer;
  color: var(--text-tertiary);
  padding: var(--spacing-1);
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--ease-in-out);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background-color: var(--bg-color);
  color: var(--text-secondary);
}

.modal-body {
  margin-bottom: var(--spacing-6);
  color: var(--text-primary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--divider-color);
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 640px) {
  .modal {
    width: 95%;
    padding: var(--spacing-4);
  }
  
  .modal-header {
    margin-bottom: var(--spacing-3);
    padding-bottom: var(--spacing-3);
  }
  
  .modal-title {
    font-size: var(--font-size-lg);
  }
  
  .modal-body {
    margin-bottom: var(--spacing-4);
  }
  
  .modal-footer {
    gap: var(--spacing-2);
    padding-top: var(--spacing-3);
  }
  
  .btn {
    padding: var(--spacing-2) var(--spacing-4);
    font-size: var(--font-size-sm);
  }
}
/* --- UI统一修改结束 --- */
</style>
