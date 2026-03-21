<template>
  <div 
    class="avatar-component" 
    :style="style"
    :title="username"
  >
    {{ !src ? (username?.charAt(0).toUpperCase() || '?') : '' }}
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  src: {
    type: String,
    default: null
  },
  username: {
    type: String,
    default: 'User'
  },
  size: {
    type: Number,
    default: 40
  },
  color: {
    type: String,
    default: '#e0e7ff'
  },
  textColor: {
    type: String,
    default: '#4f46e5' // var(--primary-color)
  }
})

const fullUrl = computed(() => {
  if (!props.src) return null
  if (props.src.startsWith('http')) return props.src
  return `${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}${props.src}`
})

const style = computed(() => {
  const base = {
    width: `${props.size}px`,
    height: `${props.size}px`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: `${props.size * 0.4}px`,
    backgroundColor: props.color,
    color: props.textColor,
    flexShrink: 0
  }
  
  if (fullUrl.value) {
    return {
      ...base,
      backgroundImage: `url(${fullUrl.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'transparent' // Hide text
    }
  }
  
  return base
})
</script>

<style scoped>
.avatar-component {
  user-select: none;
}
</style>
