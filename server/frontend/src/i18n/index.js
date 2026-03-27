import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import zhCN from '../locales/zh-CN.json'
import zhTW from '../locales/zh-TW.json'
import ja from '../locales/ja.json'
import ko from '../locales/ko.json'
import ru from '../locales/ru.json'
import de from '../locales/de.json'
import fr from '../locales/fr.json'
import it from '../locales/it.json'
import es from '../locales/es.json'

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: localStorage.getItem('locale') || 'zh-CN', // Get from localStorage or default to 'zh-CN'
  fallbackLocale: 'en',
  messages: {
    en,
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    ja,
    ko,
    ru,
    de,
    fr,
    it,
    es
  }
})

export default i18n
