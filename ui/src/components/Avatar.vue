<template>
  <div class="avatar" :style="avatarStyle">
    <img v-if="src" :src="src" :alt="username" class="avatar-img" />
    <span v-else class="avatar-text">{{ getInitials(username) }}</span>
  </div>
</template>

<script setup>/* --- UI统一修改开始 --- */
import { computed } from 'vue'

const props = defineProps({
  username: {
    type: String,
    required: true
  },
  src: {
    type: String,
    default: ''
  },
  size: {
    type: [String, Number],
    default: 40
  },
  backgroundColor: {
    type: String,
    default: ''
  },
  textColor: {
    type: String,
    default: ''
  }
})

const getInitials = (username) => {
  if (!username) return '?'
  const parts = username.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  } else {
    return username.substring(0, 2).toUpperCase()
  }
}

const avatarStyle = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size
  const bgColor = props.backgroundColor || getRandomColor(props.username)
  const textColor = props.textColor || '#ffffff'
  
  return {
    width: size,
    height: size,
    backgroundColor: bgColor,
    color: textColor
  }
})

const getRandomColor = (username) => {
  const colors = [
    '#6366f1', // primary
    '#10b981', // success
    '#f59e0b', // warning
    '#ef4444', // error
    '#3b82f6', // info
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6'  // teal
  ]
  
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const index = Math.abs(hash) % colors.length
  return colors[index]
}
/* --- UI统一修改结束 --- */
</script>

<style scoped>/* --- UI统一修改开始 --- */
.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  overflow: hidden;
  font-weight: var(--font-weight-semibold);
  transition: all var(--duration-normal) var(--ease-in-out);
  box-shadow: var(--shadow-sm);
}

.avatar:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all var(--duration-normal) var(--ease-in-out);
}

.avatar-img:hover {
  transform: scale(1.1);
}

.avatar-text {
  font-size: 0.75em;
  line-height: 1;
  text-align: center;
}
/* --- UI统一修改结束 --- */
</style>
