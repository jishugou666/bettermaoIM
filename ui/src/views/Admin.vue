<template>
  <div class="admin-layout">
    <!-- 登录页面 -->
    <div v-if="!isLoggedIn" class="login-container">
      <div class="login-card card">
        <div class="login-header">
          <div class="logo-icon">🔐</div>
          <h1>BetterMao Admin</h1>
          <p>后台管理系统</p>
        </div>
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label>用户名</label>
            <div class="input-wrapper">
              <span class="input-icon">👤</span>
              <input v-model="loginForm.username" type="text" placeholder="请输入管理员用户名" required />
            </div>
          </div>
          <div class="form-group">
            <label>密码</label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input v-model="loginForm.password" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码" required />
              <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>
          <button type="submit" class="login-btn" :disabled="loading">
            {{ loading ? '登录中...' : '登 录' }}
          </button>
          <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
        </form>
        <button class="back-home-btn" @click="router.push('/')">← 返回首页</button>
      </div>
    </div>

    <!-- 管理面板 -->
    <div v-else class="admin-container">
      <!-- 顶部导航栏 -->
      <div class="admin-header">
        <div class="header-left">
          <div class="logo">
            <span class="logo-icon">⚡</span>
            <span class="logo-text">BetterMao Admin</span>
          </div>
        </div>
        <div class="header-right">
          <div class="admin-info">
            <span class="admin-avatar">{{ adminUser.charAt(0) }}</span>
            <div class="admin-details">
              <span class="admin-name">{{ adminUser }}</span>
              <span class="admin-role">{{ getRoleLabel(adminRole) }}</span>
            </div>
          </div>
          <button class="logout-btn" @click="handleLogout">
            <span>🚪</span> 退出
          </button>
        </div>
      </div>

      <div class="admin-body">
        <!-- 侧边栏 -->
        <div class="sidebar">
          <div class="sidebar-menu">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              :class="['menu-item', { active: activeTab === tab.id }]"
              @click="activeTab = tab.id"
            >
              <span class="menu-icon">{{ tab.icon }}</span>
              <span class="menu-label">{{ tab.label }}</span>
            </button>
          </div>
        </div>

        <!-- 主内容区 -->
        <div class="main-content">
          <!-- 数据库管理 -->
          <div v-if="activeTab === 'database'" class="tab-content">
            <div class="content-header">
              <h2>📊 数据库管理</h2>
              <div class="header-actions">
                <button class="btn btn-primary" @click="loadDatabaseStats">🔄 刷新统计</button>
                <button class="btn btn-warning" @click="exportDatabase">📥 导出数据库</button>
                <button v-if="adminRole === 'super_admin'" class="btn btn-danger" @click="confirmClearDatabase">⚠️ 清空数据库</button>
              </div>
            </div>

            <div v-if="dbStats" class="stats-dashboard">
              <div v-for="(count, table) in dbStats" :key="table" class="stat-card">
                <div class="stat-icon">{{ getTableIcon(table) }}</div>
                <div class="stat-info">
                  <span class="stat-value">{{ count }}</span>
                  <span class="stat-label">{{ getTableLabel(table) }}</span>
                </div>
              </div>
            </div>

            <div class="table-list">
              <h3>数据表管理</h3>
              <div class="table-grid">
                <div v-for="table in tables" :key="table.id" class="table-card">
                  <div class="table-card-header">
                    <div class="table-title">
                      <span class="table-icon">{{ table.icon }}</span>
                      <span>{{ table.label }}</span>
                    </div>
                    <button class="view-btn" @click="viewTableData(table.id)">
                      {{ expandedTable === table.id ? '收起' : '查看' }}
                    </button>
                  </div>
                  <div v-if="expandedTable === table.id" class="table-card-content">
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
                          <tr v-for="(row, index) in tableData.slice(0, 50)" :key="index">
                            <td v-for="field in tableFields" :key="field" class="data-cell">
                              {{ formatCellValue(row[field]) }}
                            </td>
                            <td>
                              <button class="delete-row-btn" @click="deleteRow(table.id, row._id)">删除</button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div v-if="tableData.length > 50" class="table-note">* 仅显示前50条记录</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 用户管理 -->
          <div v-if="activeTab === 'users'" class="tab-content">
            <div class="content-header">
              <h2>👥 用户管理</h2>
            </div>
            <div class="search-bar">
              <input v-model="userSearch" placeholder="搜索用户名/邮箱/昵称..." @input="searchUsers" />
              <button class="search-btn" @click="searchUsers">🔍</button>
            </div>
            <div v-if="users.length === 0" class="empty-state">暂无用户</div>
            <div v-else class="users-list">
              <div v-for="user in users" :key="user._id" class="user-card">
                <div class="user-avatar">{{ (user.nickname || user.username || 'U').charAt(0) }}</div>
                <div class="user-info">
                  <div class="user-name-row">
                    <span class="user-name">{{ user.nickname || user.username }}</span>
                    <span :class="['user-badge', user.role]">{{ user.role || 'user' }}</span>
                    <span v-if="user.isBanned" class="user-badge banned">已封禁</span>
                  </div>
                  <div class="user-detail">
                    <span>@{{ user.username }}</span>
                    <span v-if="user.email">· {{ user.email }}</span>
                  </div>
                </div>
                <div class="user-actions">
                  <button class="btn btn-sm" @click="editUser(user)">编辑</button>
                  <button class="btn btn-sm btn-danger" @click="deleteUser(user._id)">删除</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 私聊管理 -->
          <div v-if="activeTab === 'chats'" class="tab-content">
            <div class="content-header">
              <h2>💬 私聊管理</h2>
            </div>
            <div v-if="privateChats.length === 0" class="empty-state">暂无私聊</div>
            <div v-else class="chats-list">
              <div v-for="chat in privateChats" :key="chat._id" class="chat-card">
                <div class="chat-info">
                  <div class="chat-members">
                    <span v-for="(member, i) in chat.members" :key="member._id">
                      {{ member.nickname || member.username }}
                      <span v-if="i < chat.members.length - 1"> & </span>
                    </span>
                  </div>
                  <div class="chat-time">{{ formatDate(chat.createdAt) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 群组管理 -->
          <div v-if="activeTab === 'groups'" class="tab-content">
            <div class="content-header">
              <h2>👨‍👩‍👧‍👦 群组管理</h2>
            </div>
            <div v-if="groups.length === 0" class="empty-state">暂无群组</div>
            <div v-else class="groups-list">
              <div v-for="group in groups" :key="group._id" class="group-card">
                <div class="group-icon">👥</div>
                <div class="group-info">
                  <div class="group-name">{{ group.name || '未命名群组' }}</div>
                  <div class="group-meta">{{ group.memberCount }} 成员</div>
                </div>
                <button class="btn btn-sm btn-danger" @click="deleteGroup(group._id)">解散</button>
              </div>
            </div>
          </div>

          <!-- 朋友圈管理 -->
          <div v-if="activeTab === 'moments'" class="tab-content">
            <div class="content-header">
              <h2>📸 朋友圈管理</h2>
            </div>
            <div v-if="moments.length === 0" class="empty-state">暂无朋友圈</div>
            <div v-else class="moments-list">
              <div v-for="moment in moments" :key="moment._id" class="moment-card">
                <div class="moment-header">
                  <div class="moment-user">
                    <span class="user-avatar-sm">{{ (moment.user?.nickname || moment.user?.username || 'U').charAt(0) }}</span>
                    <span>{{ moment.user?.nickname || moment.user?.username }}</span>
                  </div>
                  <span class="moment-time">{{ formatDate(moment.createdAt) }}</span>
                </div>
                <div class="moment-content">{{ moment.content }}</div>
                <div class="moment-stats">
                  <span>❤️ {{ moment.likeCount }}</span>
                  <span>💬 {{ moment.commentCount }}</span>
                </div>
                <button class="delete-btn-sm" @click="deleteMoment(moment._id)">删除</button>
              </div>
            </div>
          </div>

          <!-- 帖子管理 -->
          <div v-if="activeTab === 'posts'" class="tab-content">
            <div class="content-header">
              <h2>📝 帖子管理</h2>
            </div>
            <div v-if="posts.length === 0" class="empty-state">暂无帖子</div>
            <div v-else class="posts-list">
              <div v-for="post in posts" :key="post._id" class="post-card">
                <div class="post-header">
                  <div class="post-user">
                    <span class="user-avatar-sm">{{ (post.user?.nickname || post.user?.username || 'U').charAt(0) }}</span>
                    <span>{{ post.user?.nickname || post.user?.username }}</span>
                  </div>
                  <span class="post-time">{{ formatDate(post.createdAt) }}</span>
                </div>
                <div class="post-title">{{ post.title }}</div>
                <div class="post-content">{{ post.content }}</div>
                <div class="post-stats">
                  <span>❤️ {{ post.likeCount }}</span>
                  <span>💬 {{ post.commentCount }}</span>
                </div>
                <button class="delete-btn-sm" @click="deletePost(post._id)">删除</button>
              </div>
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
          <button class="btn" @click="showConfirm = false">取消</button>
          <button class="btn btn-danger" @click="confirmAction">确认</button>
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
const showPassword = ref(false)
const errorMsg = ref('')
const adminUser = ref('')
const adminRole = ref('')
const toastMsg = ref('')

const loginForm = ref({
  username: '',
  password: ''
})

const tabs = [
  { id: 'database', label: '数据库', icon: '📊' },
  { id: 'users', label: '用户管理', icon: '👥' },
  { id: 'chats', label: '私聊管理', icon: '💬' },
  { id: 'groups', label: '群组管理', icon: '👨‍👩‍👧‍👦' },
  { id: 'moments', label: '朋友圈', icon: '📸' },
  { id: 'posts', label: '帖子管理', icon: '📝' }
]

const activeTab = ref('database')
const dbStats = ref(null)
const tables = [
  { id: 'users', label: '用户表', icon: '👤' },
  { id: 'friends', label: '好友关系', icon: '🤝' },
  { id: 'chats', label: '聊天', icon: '💬' },
  { id: 'messages', label: '消息', icon: '📨' },
  { id: 'moments', label: '动态', icon: '📸' },
  { id: 'communityPosts', label: '帖子', icon: '📝' }
]
const expandedTable = ref(null)
const tableData = ref([])
const tableFields = ref([])
const tableLoading = ref(false)

const users = ref([])
const userSearch = ref('')
const privateChats = ref([])
const groups = ref([])
const moments = ref([])
const posts = ref([])

const showConfirm = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmCallback = ref(null)

const getRoleLabel = (role) => {
  const labels = {
    super_admin: '站长',
    admin: '管理员',
    moderator: '风纪委员'
  }
  return labels[role] || role
}

const getTableIcon = (table) => {
  const icons = {
    users: '👤',
    friends: '🤝',
    friendRequests: '📩',
    chats: '💬',
    chatMembers: '👥',
    messages: '📨',
    points: '💰',
    moments: '📸',
    momentLikes: '❤️',
    momentComments: '💬',
    communityPosts: '📝',
    communityComments: '💭',
    communityLikes: '👍'
  }
  return icons[table] || '📋'
}

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

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

const showToast = (msg) => {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = '' }, 3000)
}

// 检查登录状态
onMounted(() => {
  const token = localStorage.getItem('adminToken')
  const userStr = localStorage.getItem('adminUser')
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr)
      isLoggedIn.value = true
      adminUser.value = user.nickname || user.username || 'Admin'
      adminRole.value = user.role
      loadDatabaseStats()
      loadAllData()
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
      adminRole.value = res.data.user.role
      showToast('登录成功！')
      loadDatabaseStats()
      loadAllData()
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
  adminRole.value = ''
  loginForm.value = { username: '', password: '' }
  showToast('已退出登录')
}

const loadAllData = () => {
  searchUsers()
  loadPrivateChats()
  loadGroups()
  loadMoments()
  loadPosts()
}

// 加载数据库统计
const loadDatabaseStats = async () => {
  try {
    const res = await axios.get('/api/admin/database/stats', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    dbStats.value = res.data
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
const deleteRow = (tableId, rowId) => {
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
    } catch (err) {
      showToast('操作失败')
    }
  }
  showConfirm.value = true
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
const deleteUser = (userId) => {
  confirmTitle.value = '确认删除'
  confirmMessage.value = '确定要删除这个用户吗？'
  confirmCallback.value = async () => {
    try {
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      })
      showToast('用户已删除')
      searchUsers()
      loadDatabaseStats()
    } catch (err) {
      showToast('删除失败')
    }
  }
  showConfirm.value = true
}

// 加载私聊
const loadPrivateChats = async () => {
  try {
    const res = await axios.get('/api/admin/chats/private', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    privateChats.value = res.data
  } catch (err) {
    privateChats.value = []
  }
}

// 加载群组
const loadGroups = async () => {
  try {
    const res = await axios.get('/api/admin/groups', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    groups.value = res.data
  } catch (err) {
    groups.value = []
  }
}

// 删除群组
const deleteGroup = (groupId) => {
  confirmTitle.value = '确认解散'
  confirmMessage.value = '确定要解散这个群组吗？'
  confirmCallback.value = async () => {
    try {
      await axios.delete(`/api/admin/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      })
      showToast('群组已解散')
      loadGroups()
      loadDatabaseStats()
    } catch (err) {
      showToast('删除失败')
    }
  }
  showConfirm.value = true
}

// 加载朋友圈
const loadMoments = async () => {
  try {
    const res = await axios.get('/api/admin/moments', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    moments.value = res.data
  } catch (err) {
    moments.value = []
  }
}

// 删除朋友圈
const deleteMoment = (momentId) => {
  confirmTitle.value = '确认删除'
  confirmMessage.value = '确定要删除这条朋友圈吗？'
  confirmCallback.value = async () => {
    try {
      await axios.delete(`/api/admin/moments/${momentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      })
      showToast('已删除')
      loadMoments()
      loadDatabaseStats()
    } catch (err) {
      showToast('删除失败')
    }
  }
  showConfirm.value = true
}

// 加载帖子
const loadPosts = async () => {
  try {
    const res = await axios.get('/api/admin/posts', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    posts.value = res.data
  } catch (err) {
    posts.value = []
  }
}

// 删除帖子
const deletePost = (postId) => {
  confirmTitle.value = '确认删除'
  confirmMessage.value = '确定要删除这篇帖子吗？'
  confirmCallback.value = async () => {
    try {
      await axios.delete(`/api/admin/posts/${postId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      })
      showToast('已删除')
      loadPosts()
      loadDatabaseStats()
    } catch (err) {
      showToast('删除失败')
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
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24px;
  padding: 3rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.login-header h1 {
  font-size: 1.75rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: #6b7280;
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  font-size: 1.1rem;
}

.input-wrapper input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  background: #f9fafb;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  background: white;
}

.toggle-password {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
}

.login-btn {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.4);
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
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  border: none;
  border-radius: 12px;
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.back-home-btn:hover {
  background: #e5e7eb;
}

/* 管理面板 */
.admin-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left .logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  font-size: 1.75rem;
}

.logo-text {
  color: white;
  font-weight: 700;
  font-size: 1.25rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.admin-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

.admin-details {
  display: flex;
  flex-direction: column;
}

.admin-name {
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
}

.admin-role {
  color: #9ca3af;
  font-size: 0.8rem;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.3);
}

.admin-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.sidebar {
  width: 240px;
  background: rgba(255, 255, 255, 0.03);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem 0;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0 1rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: transparent;
  border: none;
  border-radius: 12px;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.menu-item.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
  color: white;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.menu-icon {
  font-size: 1.25rem;
}

.menu-label {
  font-weight: 500;
  font-size: 0.95rem;
}

.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.content-header h2 {
  color: white;
  font-size: 1.5rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-sm {
  padding: 0.375rem 0.875rem;
  font-size: 0.85rem;
}

.btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
}

/* 统计面板 */
.stats-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 2rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  color: white;
  font-size: 1.75rem;
  font-weight: 700;
}

.stat-label {
  color: #9ca3af;
  font-size: 0.85rem;
}

/* 表格管理 */
.table-list h3 {
  color: white;
  margin-bottom: 1rem;
}

.table-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.table-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
}

.table-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.03);
}

.table-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
  font-weight: 600;
}

.view-btn {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 0.375rem 0.875rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.view-btn:hover {
  background: rgba(99, 102, 241, 0.3);
}

.table-card-content {
  padding: 1rem 1.5rem;
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #e5e7eb;
}

.data-table th {
  background: rgba(255, 255, 255, 0.03);
  font-weight: 600;
  color: #9ca3af;
}

.data-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-row-btn {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
}

.table-note {
  color: #6b7280;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.search-bar input {
  flex: 1;
  padding: 0.875rem 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.search-bar input::placeholder {
  color: #6b7280;
}

.search-bar input:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(255, 255, 255, 0.08);
}

.search-btn {
  padding: 0 1.25rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 12px;
  font-size: 1.25rem;
  cursor: pointer;
}

/* 用户列表 */
.users-list,
.chats-list,
.groups-list,
.moments-list,
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-card,
.chat-card,
.group-card,
.moment-card,
.post-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
}

.user-card:hover,
.group-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.user-avatar,
.group-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.user-name {
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.user-badge {
  padding: 0.125rem 0.625rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
}

.user-badge.admin {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.user-badge.user {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.user-badge.banned {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.user-detail {
  color: #9ca3af;
  font-size: 0.85rem;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

/* 私聊、群组 */
.chat-info,
.group-info {
  flex: 1;
}

.chat-members,
.group-name {
  color: white;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.chat-time,
.group-meta {
  color: #9ca3af;
  font-size: 0.85rem;
}

/* 朋友圈、帖子 */
.moment-card,
.post-card {
  flex-direction: column;
  align-items: flex-start;
}

.moment-header,
.post-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.moment-user,
.post-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-weight: 500;
}

.user-avatar-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
}

.moment-time,
.post-time {
  color: #6b7280;
  font-size: 0.8rem;
}

.post-title {
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.moment-content,
.post-content {
  color: #d1d5db;
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.moment-stats,
.post-stats {
  display: flex;
  gap: 1rem;
  color: #6b7280;
  font-size: 0.85rem;
}

.delete-btn-sm {
  align-self: flex-end;
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: #1f2937;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 20px;
  width: 100%;
  max-width: 420px;
  animation: modalIn 0.3s ease;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.modal h3 {
  color: white;
  margin-bottom: 0.75rem;
}

.modal p {
  color: #9ca3af;
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
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
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  z-index: 1001;
  font-weight: 500;
}

/* 加载器 */
.loader-wrapper {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.loader {
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top: 3px solid #6366f1;
  width: 32px;
  height: 32px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
