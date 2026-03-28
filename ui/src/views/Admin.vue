<template>
  <div class="admin-layout">
    <!-- 登录页面 -->
    <div v-if="!isLoggedIn" class="login-container">
      <div class="login-card card">
        <div class="login-header">
          <h1>Admin 后台管理</h1>
          <p>管理员登录</p>
        </div>
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label>用户名</label>
            <input v-model="loginForm.username" type="text" placeholder="请输入管理员用户名" required />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="loginForm.password" type="password" placeholder="请输入密码" required />
          </div>
          <button type="submit" class="login-btn" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
          <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
        </form>
        <button class="back-home-btn" @click="router.push('/')">返回首页</button>
      </div>
    </div>

    <!-- 管理面板 -->
    <div v-else class="admin-container">
      <div class="admin-header">
        <h1>Admin 后台管理</h1>
        <div class="header-actions">
          <span class="admin-name">欢迎, {{ adminUser }}</span>
          <button class="logout-btn" @click="handleLogout">退出登录</button>
        </div>
      </div>

      <div class="admin-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="admin-content card">
        <!-- 数据库管理 -->
        <div v-if="activeTab === 'database'" class="database-section">
          <h2>数据库管理</h2>
          
          <div class="db-actions">
            <button class="action-btn primary" @click="loadDatabaseStats">刷新统计</button>
            <button class="action-btn warning" @click="exportDatabase">导出数据库</button>
            <button class="action-btn danger" @click="confirmClearDatabase">清空数据库</button>
          </div>

          <div v-if="dbStats" class="db-stats">
            <h3>数据统计</h3>
            <div class="stats-grid">
              <div v-for="(count, table) in dbStats" :key="table" class="stat-item">
                <span class="stat-label">{{ getTableLabel(table) }}</span>
                <span class="stat-value">{{ count }}</span>
              </div>
            </div>
          </div>

          <div class="db-tables">
            <h3>数据表管理</h3>
            <div v-for="table in tables" :key="table.id" class="table-section">
              <div class="table-header">
                <h4>{{ table.label }}</h4>
                <button class="view-btn" @click="viewTableData(table.id)">
                  {{ expandedTable === table.id ? '收起' : '查看数据' }}
                </button>
              </div>
              <div v-if="expandedTable === table.id" class="table-content">
                <div v-if="tableLoading" class="loader-wrapper">
                  <div class="loader"></div>
                </div>
                <div v-else-if="tableData.length === 0" class="empty-state">暂无数据</div>
                <div v-else class="data-table-wrapper">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th v-for="field in tableFields" :key="field">{{ field }}</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, index) in tableData" :key="index">
                        <td v-for="field in tableFields" :key="field" class="data-cell">
                          {{ formatCellValue(row[field]) }}
                        </td>
                        <td>
                          <button class="delete-row-btn" @click="deleteRow(table.id, row._id)">删除</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 用户管理 -->
        <div v-if="activeTab === 'users'" class="users-section">
          <h2>用户管理</h2>
          <div class="search-bar">
            <input v-model="userSearch" placeholder="搜索用户..." @input="searchUsers" />
          </div>
          <div v-if="users.length === 0" class="empty-state">暂无用户</div>
          <div v-else class="users-list">
            <div v-for="user in users" :key="user._id" class="user-item">
              <div class="user-info">
                <span class="username">{{ user.username || user.nickname }}</span>
                <span class="user-email">{{ user.email }}</span>
                <span :class="['role-badge', user.role]">{{ user.role }}</span>
              </div>
              <div class="user-actions">
                <button class="edit-btn" @click="editUser(user)">编辑</button>
                <button class="delete-btn" @click="deleteUser(user._id)">删除</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 系统日志 -->
        <div v-if="activeTab === 'logs'" class="logs-section">
          <h2>系统日志</h2>
          <div class="logs-container">
            <div v-for="(log, index) in systemLogs" :key="index" :class="['log-item', log.level]">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-level">[{{ log.level.toUpperCase() }}]</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 确认对话框 -->
    <div v-if="showConfirm" class="modal-overlay" @click.self="showConfirm = false">
      <div class="modal">
        <h3>{{ confirmTitle }}</h3>
        <p>{{ confirmMessage }}</p>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showConfirm = false">取消</button>
          <button class="confirm-btn" @click="confirmAction">确认</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="fade">
      <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const isLoggedIn = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const adminUser = ref('')
const toastMsg = ref('')

const loginForm = ref({
  username: '',
  password: ''
})

const tabs = [
  { id: 'database', label: '数据库管理' },
  { id: 'users', label: '用户管理' },
  { id: 'logs', label: '系统日志' }
]

const activeTab = ref('database')
const dbStats = ref(null)
const tables = [
  { id: 'users', label: '用户表' },
  { id: 'friends', label: '好友关系表' },
  { id: 'chats', label: '聊天表' },
  { id: 'messages', label: '消息表' },
  { id: 'moments', label: '动态表' },
  { id: 'communityPosts', label: '社区帖子表' }
]
const expandedTable = ref(null)
const tableData = ref([])
const tableFields = ref([])
const tableLoading = ref(false)

const users = ref([])
const userSearch = ref('')

const systemLogs = ref([
  { time: new Date().toLocaleString(), level: 'info', message: '系统启动成功' }
])

const showConfirm = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmCallback = ref(null)

// 检查登录状态
onMounted(() => {
  const token = localStorage.getItem('adminToken')
  const userStr = localStorage.getItem('adminUser')
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr)
      isLoggedIn.value = true
      adminUser.value = user.nickname || user.username || 'Admin'
      loadDatabaseStats()
    } catch (e) {
      handleLogout()
    }
  }
})

// 管理员登录
const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  
  try {
    const res = await axios.post('/api/admin/login', loginForm.value)
    if (res.data.success) {
      localStorage.setItem('adminToken', res.data.token)
      localStorage.setItem('adminUser', JSON.stringify(res.data.user))
      isLoggedIn.value = true
      adminUser.value = res.data.user.nickname || res.data.user.username || 'Admin'
      showToast('登录成功！')
      loadDatabaseStats()
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '登录失败'
  } finally {
    loading.value = false
  }
}

// 退出登录
const handleLogout = () => {
  localStorage.removeItem('adminToken')
  localStorage.removeItem('adminUser')
  isLoggedIn.value = false
  adminUser.value = ''
  loginForm.value = { username: '', password: '' }
  showToast('已退出登录')
}

// 加载数据库统计
const loadDatabaseStats = async () => {
  try {
    const res = await axios.get('/api/admin/database/stats', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    dbStats.value = res.data
    addLog('info', '数据库统计已刷新')
  } catch (err) {
    showToast('加载统计失败')
  }
}

// 查看表数据
const viewTableData = async (tableId) => {
  if (expandedTable.value === tableId) {
    expandedTable.value = null
    return
  }
  
  expandedTable.value = tableId
  tableLoading.value = true
  
  try {
    const res = await axios.get(`/api/admin/database/table/${tableId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    tableData.value = res.data
    if (res.data.length > 0) {
      // 收集所有记录的所有字段，确保显示完整字段
      const allFields = new Set()
      res.data.forEach(row => {
        Object.keys(row).forEach(key => {
          if (!key.startsWith('__')) {
            allFields.add(key)
          }
        })
      })
      tableFields.value = Array.from(allFields)
    }
  } catch (err) {
    showToast('加载数据失败')
    tableData.value = []
  } finally {
    tableLoading.value = false
  }
}

// 删除行
const deleteRow = async (tableId, rowId) => {
  confirmTitle.value = '确认删除'
  confirmMessage.value = '确定要删除这条记录吗？此操作不可恢复。'
  confirmCallback.value = async () => {
    try {
      await axios.delete(`/api/admin/database/table/${tableId}/${rowId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      })
      showToast('删除成功')
      viewTableData(tableId)
      loadDatabaseStats()
    } catch (err) {
      showToast('删除失败')
    }
  }
  showConfirm.value = true
}

// 导出数据库
const exportDatabase = async () => {
  try {
    const res = await axios.get('/api/admin/database/export', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bettermao_backup_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('导出成功')
    addLog('info', '数据库已导出')
  } catch (err) {
    showToast('导出失败')
  }
}

// 清空数据库
const confirmClearDatabase = () => {
  confirmTitle.value = '危险操作'
  confirmMessage.value = '确定要清空数据库吗？此操作不可恢复！'
  confirmCallback.value = async () => {
    try {
      await axios.post('/api/admin/database/clear', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      })
      showToast('数据库已清空')
      loadDatabaseStats()
      addLog('warning', '数据库已清空')
    } catch (err) {
      showToast('操作失败')
    }
  }
  showConfirm.value = true
}

// 确认操作
const confirmAction = () => {
  if (confirmCallback.value) {
    confirmCallback.value()
  }
  showConfirm.value = false
}

// 搜索用户
const searchUsers = async () => {
  try {
    const res = await axios.get('/api/admin/users', {
      params: { search: userSearch.value },
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    users.value = res.data
  } catch (err) {
    users.value = []
  }
}

// 编辑用户
const editUser = (user) => {
  showToast('编辑功能开发中')
}

// 删除用户
const deleteUser = async (userId) => {
  confirmTitle.value = '确认删除'
  confirmMessage.value = '确定要删除这个用户吗？'
  confirmCallback.value = async () => {
    try {
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      })
      showToast('用户已删除')
      searchUsers()
    } catch (err) {
      showToast('删除失败')
    }
  }
  showConfirm.value = true
}

// 辅助函数
const getTableLabel = (table) => {
  const labels = {
    users: '用户',
    friends: '好友关系',
    friendRequests: '好友请求',
    chats: '聊天',
    chatMembers: '聊天成员',
    messages: '消息',
    points: '积分记录',
    moments: '动态',
    momentLikes: '动态点赞',
    momentComments: '动态评论',
    communityPosts: '社区帖子',
    communityComments: '社区评论',
    communityLikes: '社区点赞'
  }
  return labels[table] || table
}

const formatCellValue = (value) => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') return JSON.stringify(value).substring(0, 50) + '...'
  if (typeof value === 'string' && value.length > 50) return value.substring(0, 50) + '...'
  return String(value)
}

const addLog = (level, message) => {
  systemLogs.value.unshift({
    time: new Date().toLocaleString(),
    level,
    message
  })
  if (systemLogs.value.length > 100) {
    systemLogs.value.pop()
  }
}

const showToast = (msg) => {
  toastMsg.value = msg
  setTimeout(() => {
    toastMsg.value = ''
  }, 3000)
}

// 初始化加载用户列表
onMounted(() => {
  if (isLoggedIn.value) {
    searchUsers()
  }
})
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
}

/* 登录页面 */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
}

.login-card {
  background: white;
  border-radius: 24px;
  padding: 3rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 1.75rem;
  color: #4F46E5;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: #6b7280;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.form-group input {
  padding: 0.875rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #4F46E5;
}

.login-btn {
  background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-msg {
  color: #ef4444;
  text-align: center;
  font-size: 0.9rem;
}

.back-home-btn {
  margin-top: 1.5rem;
  width: 100%;
  padding: 0.875rem;
  background: #f3f4f6;
  border: none;
  border-radius: 12px;
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
}

/* 管理面板 */
.admin-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.admin-header h1 {
  font-size: 1.5rem;
  color: #1f2937;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-name {
  color: #6b7280;
}

.logout-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

/* 标签页 */
.admin-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tab-btn {
  background: white;
  border: none;
  padding: 0.875rem 1.5rem;
  border-radius: 12px 12px 0 0;
  font-weight: 500;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.tab-btn.active {
  background: white;
  color: #4F46E5;
  box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.05);
}

/* 内容区 */
.admin-content {
  background: white;
  border-radius: 0 16px 16px 16px;
  padding: 2rem;
  min-height: 500px;
}

.card {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* 数据库管理 */
.database-section h2 {
  margin-bottom: 1.5rem;
  color: #1f2937;
}

.db-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: #4F46E5;
  color: white;
}

.action-btn.warning {
  background: #f59e0b;
  color: white;
}

.action-btn.danger {
  background: #ef4444;
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.db-stats {
  margin-bottom: 2rem;
}

.db-stats h3 {
  margin-bottom: 1rem;
  color: #374151;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-item {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.stat-value {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  color: #4F46E5;
}

/* 数据表 */
.db-tables h3 {
  margin-bottom: 1rem;
  color: #374151;
}

.table-section {
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f9fafb;
}

.table-header h4 {
  margin: 0;
  color: #374151;
}

.view-btn {
  background: #4F46E5;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}

.table-content {
  padding: 1rem;
  max-height: 400px;
  overflow: auto;
}

.data-table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  position: sticky;
  top: 0;
}

.data-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-row-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

/* 用户管理 */
.users-section h2 {
  margin-bottom: 1.5rem;
  color: #1f2937;
}

.search-bar {
  margin-bottom: 1.5rem;
}

.search-bar input {
  width: 100%;
  padding: 0.875rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-radius: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.username {
  font-weight: 600;
  color: #1f2937;
}

.user-email {
  color: #6b7280;
  font-size: 0.9rem;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.role-badge.admin {
  background: #fef3c7;
  color: #d97706;
}

.role-badge.user {
  background: #dbeafe;
  color: #2563eb;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn {
  background: #4F46E5;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

.delete-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

/* 日志 */
.logs-section h2 {
  margin-bottom: 1.5rem;
  color: #1f2937;
}

.logs-container {
  background: #1f2937;
  border-radius: 12px;
  padding: 1rem;
  max-height: 500px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
}

.log-item {
  padding: 0.5rem;
  margin-bottom: 0.25rem;
  border-radius: 4px;
}

.log-item.info {
  color: #60a5fa;
}

.log-item.warning {
  color: #fbbf24;
}

.log-item.error {
  color: #f87171;
}

.log-time {
  color: #9ca3af;
  margin-right: 0.5rem;
}

.log-level {
  font-weight: 600;
  margin-right: 0.5rem;
}

.log-message {
  color: #e5e7eb;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
}

.modal h3 {
  margin-bottom: 1rem;
  color: #1f2937;
}

.modal p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-btn {
  background: #f3f4f6;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.confirm-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #111827;
  color: white;
  padding: 1rem 2rem;
  border-radius: 50px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
  z-index: 1001;
}

/* 加载器 */
.loader-wrapper {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.loader {
  border: 3px solid #f3f3f3;
  border-radius: 50%;
  border-top: 3px solid #4F46E5;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
