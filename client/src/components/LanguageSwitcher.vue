<template>
  <div class="language-switcher">
    <select v-model="currentLocale" @change="changeLocale">
      <option value="en">English</option>
      <option value="zh-CN">简体中文</option>
      <option value="zh-TW">繁體中文</option>
      <option value="ja">日本語</option>
      <option value="ko">한국어</option>
      <option value="ru">Русский</option>
      <option value="de">Deutsch</option>
      <option value="fr">Français</option>
      <option value="it">Italiano</option>
      <option value="es">Español</option>
    </select>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { ref, watch } from 'vue'

const { locale } = useI18n()
const currentLocale = ref(locale.value)

const changeLocale = () => {
  locale.value = currentLocale.value
  localStorage.setItem('locale', currentLocale.value)
}

// Sync if changed elsewhere
watch(locale, (newVal) => {
  currentLocale.value = newVal
})
</script>

<style scoped>
.language-switcher select {
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background-color: white;
  font-size: 0.9rem;
  cursor: pointer;
  outline: none;
}

.language-switcher select:hover {
  border-color: var(--primary-color);
}
</style>
