<template>
  <div class="admin-layout">
    <!-- 登录页面 -->
    <div v-if="!isLoggedIn" class="login-container">
      <div class="login-card card">
        <div class="login-header">
          <div class="logo-icon"><SvgIcon name="shield" size="3rem" /></div>
          <h1>BetterMao Admin</h1>
          <p>后台管理系统</p>
        </div>
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label>用户名</label>
            <div class="input-wrapper">
              <span class="input-icon"><SvgIcon name="user" size="1.1rem" /></span>
              <input v-model="loginForm.username" type="text" placeholder="请输入管理员用户名" required />
            </div>
          </div>
          <div class="form-group">
            <label>密码</label>
            <div class="input-wrapper">
              <span class="input-icon"><SvgIcon name="lock" size="1.1rem" /></span>
              <input v-model="loginForm.password" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码" required />
              <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                <SvgIcon :name="showPassword ? 'eye-off' : 'eye'" size="1.2rem" />
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
            <span class="logo-icon"><SvgIcon name="zap" size="1.5rem" /></span>
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
            <SvgIcon name="log-out" size="1rem" /> 退出
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
              @click="activeTab = tab.id; loadTabData(tab.id)"
            >
              <span class="menu-icon"><SvgIcon :name="tab.icon" size="1.25rem" /></span>
              <span class="menu-label">{{ tab.label }}</span>
            </button>
          </div>
        </div>

        <!-- 主内容区 -->
        <div class="main-content">
          <!-- 数据库管理 -->
          <div v-if="activeTab === 'database'" class="tab-content">
            <div class="content-header">
              <h2><SvgIcon name="bar-chart" size="1.5rem" /> 数据库管理</h2>
              <div class="header-actions">
                <button class="btn btn-primary" @click="loadDatabaseStats"><SvgIcon name="refresh-cw" size="1rem" /> 刷新统计</button>
                <button class="btn btn-warning" @click="exportDatabase"><SvgIcon name="download" size="1rem" /> 导出数据库</button>
                <button v-if="adminRole === 'super_admin'" class="btn btn-danger" @click="confirmClearDatabase"><SvgIcon name="alert-triangle" size="1rem" /> 清空数据库</button>
              </div>
            </div>

            <div v-if="dbStats" class="stats-dashboard">
              <div v-for="(count, table) in dbStats" :key="table" class="stat-card">
                <div class="stat-icon"><SvgIcon :name="getTableIcon(table)" size="2rem" /></div>
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
                      <span class="table-icon"><SvgIcon :name="table.icon" size="1.25rem" /></span>
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
              <h2><SvgIcon name="users" size="1.5rem" /> 用户管理</h2>
            </div>
            <div class="search-bar">
              <input v-model="userSearch" placeholder="搜索用户名/邮箱/昵称..." @keyup.enter="searchUsers(1)" />
              <button class="search-btn" @click="searchUsers(1)"><SvgIcon name="search" size="1.25rem" /></button>
            </div>
            
            <!-- 用户详情视图 -->
            <div v-if="selectedUserDetail" class="user-detail-view">
              <button class="btn btn-sm back-btn" @click="backToUserList">← 返回用户列表</button>
              <div class="user-detail-card">
                <div class="user-detail-header">
                  <div class="user-avatar-large">{{ (selectedUserDetail.nickname || selectedUserDetail.username || 'U').charAt(0) }}</div>
                  <div class="user-detail-info">
                    <h3>{{ selectedUserDetail.nickname || selectedUserDetail.username }}</h3>
                    <p>@{{ selectedUserDetail.username }}</p>
                    <p v-if="selectedUserDetail.email">{{ selectedUserDetail.email }}</p>
                    <div class="user-badges">
                      <span :class="['user-badge', selectedUserDetail.role]">{{ selectedUserDetail.role || 'user' }}</span>
                      <span v-if="selectedUserDetail.isBanned" class="user-badge banned">已封禁</span>
                    </div>
                  </div>
                </div>
                <div class="user-stats">
                  <div class="stat-item">
                    <span class="stat-number">{{ selectedUserDetail.stats?.friendCount || 0 }}</span>
                    <span class="stat-label">好友</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">{{ selectedUserDetail.stats?.chatCount || 0 }}</span>
                    <span class="stat-label">聊天</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">{{ selectedUserDetail.stats?.momentCount || 0 }}</span>
                    <span class="stat-label">朋友圈</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">{{ selectedUserDetail.stats?.postCount || 0 }}</span>
                    <span class="stat-label">帖子</span>
                  </div>
                </div>
                <div class="user-detail-actions">
                  <button class="btn btn-primary" @click="editUser(selectedUserDetail)">编辑信息</button>
                  <button class="btn btn-warning" @click="toggleUserBan(selectedUserDetail)">
                    {{ selectedUserDetail.isBanned ? '解封' : '封禁' }}
                  </button>
                  <button class="btn btn-danger" @click="deleteUser(selectedUserDetail._id)">删除用户</button>
                </div>
              </div>
            </div>
            
            <!-- 用户列表视图 -->
            <div v-else>
              <div v-if="usersData.users?.length === 0" class="empty-state">暂无用户</div>
              <div v-else class="users-list">
                <div v-for="user in usersData.users" :key="user._id" class="user-card" @click="viewUserDetail(user._id)">
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
                  <div class="user-actions" @click.stop>
                    <button class="btn btn-sm" @click="editUser(user)">编辑</button>
                    <button class="btn btn-sm btn-danger" @click="deleteUser(user._id)">删除</button>
                  </div>
                </div>
              </div>
              
              <!-- 分页 -->
              <div v-if="usersData.total > usersData.limit" class="pagination">
                <button class="btn btn-sm" :disabled="usersData.page <= 1" @click="changePage(usersData.page - 1)">上一页</button>
                <span class="page-info">第 {{ usersData.page }} 页 / 共 {{ Math.ceil(usersData.total / usersData.limit) }} 页</span>
                <button class="btn btn-sm" :disabled="usersData.page >= Math.ceil(usersData.total / usersData.limit)" @click="changePage(usersData.page + 1)">下一页</button>
              </div>
            </div>
          </div>

          <!-- 私聊管理 -->
          <div v-if="activeTab === 'chats'" class="tab-content">
            <div class="content-header">
              <h2><SvgIcon name="message-square" size="1.5rem" /> 私聊管理</h2>
            </div>
            
            <!-- 聊天记录视图 -->
            <div v-if="selectedChat" class="chat-detail-view">
              <button class="btn btn-sm back-btn" @click="backToChatList">← 返回聊天列表</button>
              <div class="chat-detail-header">
                <div class="chat-members-title">
                  <span v-for="(member, i) in selectedChat.members" :key="member._id">
                    {{ member.nickname || member.username }}
                    <span v-if="i < selectedChat.members.length - 1"> & </span>
                  </span>
                </div>
                <span class="chat-meta">{{ chatMessages.total }} 条消息</span>
              </div>
              
              <div class="chat-messages-container">
                <div v-if="chatMessagesLoading" class="loader-wrapper">
                  <div class="loader"></div>
                </div>
                <div v-else class="chat-messages">
                  <div v-for="msg in chatMessages.messages" :key="msg._id" class="chat-message">
                    <div class="message-avatar">{{ (msg.sender?.nickname || msg.sender?.username || 'U').charAt(0) }}</div>
                    <div class="message-content">
                      <div class="message-header">
                        <span class="message-sender">{{ msg.sender?.nickname || msg.sender?.username }}</span>
                        <span class="message-time">{{ formatDate(msg.createdAt) }}</span>
                      </div>
                      <div class="message-text">{{ msg.content }}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 消息分页 -->
              <div v-if="chatMessages.total > chatMessages.limit" class="pagination">
                <button class="btn btn-sm" :disabled="chatMessages.page <= 1" @click="changeChatPage(chatMessages.page - 1)">上一页</button>
                <span class="page-info">第 {{ chatMessages.page }} 页 / 共 {{ Math.ceil(chatMessages.total / chatMessages.limit) }} 页</span>
                <button class="btn btn-sm" :disabled="chatMessages.page >= Math.ceil(chatMessages.total / chatMessages.limit)" @click="changeChatPage(chatMessages.page + 1)">下一页</button>
              </div>
            </div>
            
            <!-- 聊天列表视图 -->
            <div v-else>
              <div v-if="privateChats.length === 0" class="empty-state">暂无私聊</div>
              <div v-else class="chats-list">
                <div v-for="chat in privateChats" :key="chat._id" class="chat-card" @click="viewChatDetail(chat)">
                  <div class="chat-info">
                    <div class="chat-members">
                      <span v-for="(member, i) in chat.members" :key="member._id">
                        {{ member.nickname || member.username }}
                        <span v-if="i < chat.members.length - 1"> & </span>
                      </span>
                    </div>
                    <div class="chat-preview" v-if="chat.lastMessage">
                      {{ chat.lastMessage.content?.substring(0, 50) }}{{ chat.lastMessage.content?.length > 50 ? '...' : '' }}
                    </div>
                    <div class="chat-meta-row">
                      <span class="chat-time">{{ formatDate(chat.createdAt) }}</span>
                      <span class="chat-count">{{ chat.messageCount }} 条消息</span>
                    </div>
                  </div>
                  <div class="chat-action">
                    <span class="view-icon">→</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 群组管理 -->
          <div v-if="activeTab === 'groups'" class="tab-content">
            <div class="content-header">
              <h2><SvgIcon name="family" size="1.5rem" /> 群组管理</h2>
            </div>
            <div v-if="!selectedGroup">
              <div v-if="groups.length === 0" class="empty-state">暂无群组</div>
              <div v-else class="groups-list">
                <div v-for="group in groups" :key="group._id" class="group-card" @click="viewGroupDetails(group._id)">
                  <div class="group-icon"><SvgIcon name="users" size="1.25rem" /></div>
                  <div class="group-info">
                    <div class="group-name">{{ group.name || '未命名群组' }}</div>
                    <div class="group-meta">{{ group.memberCount }} 成员</div>
                  </div>
                  <button class="btn btn-sm btn-danger" @click.stop="deleteGroup(group._id)">解散</button>
                </div>
              </div>
            </div>
            <div v-else class="group-detail-view">
              <button class="btn btn-sm back-btn" @click="backToGroups">← 返回群组列表</button>
              <div class="group-detail-header">
                <div class="group-icon-large">
                  <SvgIcon name="users-group" size="3rem" />
                </div>
                <div class="group-detail-info">
                  <h3>{{ selectedGroup.name || '未命名群组' }}</h3>
                  <p>{{ selectedGroup.description || '暂无描述' }}</p>
                  <span class="group-meta">{{ selectedGroup.members?.length || 0 }} 成员</span>
                </div>
              </div>
              <div class="group-members-section">
                <h4>群组成员</h4>
                <div v-if="selectedGroup.members?.length === 0" class="empty-state">暂无成员</div>
                <div v-else class="group-members-list">
                  <div v-for="member in selectedGroup.members" :key="member._id" class="group-member-card">
                    <div class="member-avatar">{{ (member.nickname || member.username || 'U').charAt(0) }}</div>
                    <div class="member-info">
                      <div class="member-name">{{ member.nickname || member.username }}</div>
                      <div class="member-username">@{{ member.username }}</div>
                    </div>
                    <div class="member-role">
                      <select v-model="member.role" @change="updateMemberRole(member._id, member.role)" class="role-select">
                        <option value="member">成员</option>
                        <option value="admin">管理员</option>
                        <option value="owner">群主</option>
                      </select>
                    </div>
                    <button class="btn btn-sm btn-danger" @click="removeMember(member._id)">移除</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 朋友圈管理 -->
          <div v-if="activeTab === 'moments'" class="tab-content">
            <div class="content-header">
              <h2><SvgIcon name="camera" size="1.5rem" /> 朋友圈管理</h2>
            </div>
            <div v-if="momentsData.moments?.length === 0" class="empty-state">暂无朋友圈</div>
            <div v-else class="moments-list">
              <div v-for="moment in momentsData.moments" :key="moment._id" class="moment-card">
                <div class="moment-header">
                  <div class="moment-user">
                    <span class="user-avatar-sm">{{ (moment.user?.nickname || moment.user?.username || 'U').charAt(0) }}</span>
                    <span>{{ moment.user?.nickname || moment.user?.username }}</span>
                  </div>
                  <span class="moment-time">{{ formatDate(moment.createdAt) }}</span>
                </div>
                <div class="moment-content">{{ moment.content }}</div>
                <div class="moment-stats">
                  <span><SvgIcon name="heart" size="0.85rem" /> {{ moment.likeCount }}</span>
                  <span><SvgIcon name="message-circle" size="0.85rem" /> {{ moment.commentCount }}</span>
                </div>
                <div class="moment-actions">
                  <button class="btn btn-sm" @click="toggleMomentComments(moment._id)">
                    {{ expandedMoments.includes(moment._id) ? '收起评论' : '查看评论' }}
                  </button>
                  <button class="delete-btn-sm" @click="deleteMoment(moment._id)">删除</button>
                </div>
                
                <!-- 评论展开区域 -->
                <div v-if="expandedMoments.includes(moment._id)" class="comments-section">
                  <div v-if="momentCommentsLoading === moment._id" class="loader-wrapper">
                    <div class="loader"></div>
                  </div>
                  <div v-else-if="momentDetails[moment._id]">
                    <div v-if="momentDetails[moment._id].comments?.length === 0" class="empty-state small">暂无评论</div>
                    <div v-else class="comments-list">
                      <div v-for="comment in momentDetails[moment._id].comments" :key="comment._id" class="comment-card">
                        <div class="comment-avatar">{{ (comment.user?.nickname || comment.user?.username || 'U').charAt(0) }}</div>
                        <div class="comment-content">
                          <div class="comment-header">
                            <span class="comment-author">{{ comment.user?.nickname || comment.user?.username }}</span>
                            <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
                          </div>
                          <div class="comment-text">{{ comment.content }}</div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- 评论分页 -->
                    <div v-if="momentDetails[moment._id].totalComments > momentDetails[moment._id].commentLimit" class="pagination small">
                      <button class="btn btn-sm" :disabled="momentDetails[moment._id].commentPage <= 1" @click="changeMomentCommentPage(moment._id, momentDetails[moment._id].commentPage - 1)">上一页</button>
                      <span class="page-info">第 {{ momentDetails[moment._id].commentPage }} 页 / 共 {{ Math.ceil(momentDetails[moment._id].totalComments / momentDetails[moment._id].commentLimit) }} 页</span>
                      <button class="btn btn-sm" :disabled="momentDetails[moment._id].commentPage >= Math.ceil(momentDetails[moment._id].totalComments / momentDetails[moment._id].commentLimit)" @click="changeMomentCommentPage(moment._id, momentDetails[moment._id].commentPage + 1)">下一页</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 分页 -->
            <div v-if="momentsData.total > momentsData.limit" class="pagination">
              <button class="btn btn-sm" :disabled="momentsData.page <= 1" @click="changeMomentsPage(momentsData.page - 1)">上一页</button>
              <span class="page-info">第 {{ momentsData.page }} 页 / 共 {{ Math.ceil(momentsData.total / momentsData.limit) }} 页</span>
              <button class="btn btn-sm" :disabled="momentsData.page >= Math.ceil(momentsData.total / momentsData.limit)" @click="changeMomentsPage(momentsData.page + 1)">下一页</button>
            </div>
          </div>

          <!-- 帖子管理 -->
          <div v-if="activeTab === 'posts'" class="tab-content">
            <div class="content-header">
              <h2><SvgIcon name="file-text" size="1.5rem" /> 帖子管理</h2>
            </div>
            <div v-if="postsData.posts?.length === 0" class="empty-state">暂无帖子</div>
            <div v-else class="posts-list">
              <div v-for="post in postsData.posts" :key="post._id" class="post-card">
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
                  <span><SvgIcon name="heart" size="0.85rem" /> {{ post.likeCount }}</span>
                  <span><SvgIcon name="message-circle" size="0.85rem" /> {{ post.commentCount }}</span>
                </div>
                <div class="post-actions">
                  <button class="btn btn-sm" @click="togglePostComments(post._id)">
                    {{ expandedPosts.includes(post._id) ? '收起评论' : '查看评论' }}
                  </button>
                  <button class="delete-btn-sm" @click="deletePost(post._id)">删除</button>
                </div>
                
                <!-- 评论展开区域 -->
                <div v-if="expandedPosts.includes(post._id)" class="comments-section">
                  <div v-if="postCommentsLoading === post._id" class="loader-wrapper">
                    <div class="loader"></div>
                  </div>
                  <div v-else-if="postDetails[post._id]">
                    <div v-if="postDetails[post._id].comments?.length === 0" class="empty-state small">暂无评论</div>
                    <div v-else class="comments-list">
                      <div v-for="comment in postDetails[post._id].comments" :key="comment._id" class="comment-card">
                        <div class="comment-avatar">{{ (comment.user?.nickname || comment.user?.username || 'U').charAt(0) }}</div>
                        <div class="comment-content">
                          <div class="comment-header">
                            <span class="comment-author">{{ comment.user?.nickname || comment.user?.username }}</span>
                            <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
                          </div>
                          <div class="comment-text">{{ comment.content }}</div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- 评论分页 -->
                    <div v-if="postDetails[post._id].totalComments > postDetails[post._id].commentLimit" class="pagination small">
                      <button class="btn btn-sm" :disabled="postDetails[post._id].commentPage <= 1" @click="changePostCommentPage(post._id, postDetails[post._id].commentPage - 1)">上一页</button>
                      <span class="page-info">第 {{ postDetails[post._id].commentPage }} 页 / 共 {{ Math.ceil(postDetails[post._id].totalComments / postDetails[post._id].commentLimit) }} 页</span>
                      <button class="btn btn-sm" :disabled="postDetails[post._id].commentPage >= Math.ceil(postDetails[post._id].totalComments / postDetails[post._id].commentLimit)" @click="changePostCommentPage(post._id, postDetails[post._id].commentPage + 1)">下一页</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 分页 -->
            <div v-if="postsData.total > postsData.limit" class="pagination">
              <button class="btn btn-sm" :disabled="postsData.page <= 1" @click="changePostsPage(postsData.page - 1)">上一页</button>
              <span class="page-info">第 {{ postsData.page }} 页 / 共 {{ Math.ceil(postsData.total / postsData.limit) }} 页</span>
              <button class="btn btn-sm" :disabled="postsData.page >= Math.ceil(postsData.total / postsData.limit)" @click="changePostsPage(postsData.page + 1)">下一页</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户编辑模态框 -->
    <div v-if="showUserEditModal" class="modal-overlay" @click.self="showUserEditModal = false">
      <div class="modal large">
        <h3>编辑用户</h3>
        <form @submit.prevent="saveUserEdit" class="edit-form">
          <div class="form-group">
            <label>昵称</label>
            <input v-model="userEditForm.nickname" type="text" />
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="userEditForm.email" type="email" />
          </div>
          <div class="form-group">
            <label>角色</label>
            <select v-model="userEditForm.role">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div class="form-group checkbox">
            <label>
              <input type="checkbox" v-model="userEditForm.isBanned" />
              封禁用户
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn" @click="showUserEditModal = false">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
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
import SvgIcon from '../components/SvgIcon.vue'

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
  { id: 'database', label: '数据库', icon: 'bar-chart' },
  { id: 'users', label: '用户管理', icon: 'users' },
  { id: 'chats', label: '私聊管理', icon: 'message-square' },
  { id: 'groups', label: '群组管理', icon: 'family' },
  { id: 'moments', label: '朋友圈', icon: 'camera' },
  { id: 'posts', label: '帖子管理', icon: 'file-text' }
]

const activeTab = ref('database')
const dbStats = ref(null)
const tables = [
  { id: 'users', label: '用户表', icon: 'user' },
  { id: 'friends', label: '好友关系', icon: 'handshake' },
  { id: 'chats', label: '聊天', icon: 'message-square' },
  { id: 'messages', label: '消息', icon: 'mail' },
  { id: 'moments', label: '动态', icon: 'camera' },
  { id: 'communityPosts', label: '帖子', icon: 'file-text' }
]
const expandedTable = ref(null)
const tableData = ref([])
const tableFields = ref([])
const tableLoading = ref(false)

const usersData = ref({ users: [], total: 0, page: 1, limit: 20 })
const userSearch = ref('')
const selectedUserDetail = ref(null)
const privateChats = ref([])
const selectedChat = ref(null)
const chatMessages = ref({ messages: [], total: 0, page: 1, limit: 50 })
const chatMessagesLoading = ref(false)
const groups = ref([])
const selectedGroup = ref(null)
const momentsData = ref({ moments: [], total: 0, page: 1, limit: 20 })
const expandedMoments = ref([])
const momentDetails = ref({})
const momentCommentsLoading = ref(null)
const postsData = ref({ posts: [], total: 0, page: 1, limit: 20 })
const expandedPosts = ref([])
const postDetails = ref({})
const postCommentsLoading = ref(null)

const showConfirm = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmCallback = ref(null)

const showUserEditModal = ref(false)
const userEditForm = ref({})
const editingUserId = ref(null)

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
    users: 'user',
    friends: 'handshake',
    friendRequests: 'inbox',
    chats: 'message-square',
    chatMembers: 'users',
    messages: 'mail',
    points: 'dollar-sign',
    moments: 'camera',
    momentLikes: 'heart',
    momentComments: 'message-circle',
    communityPosts: 'file-text',
    communityComments: 'message-circle',
    communityLikes: 'thumbs-up'
  }
  return icons[table] || 'clipboard'
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

// 加载标签页数据
const loadTabData = (tabId) => {
  switch (tabId) {
    case 'database':
      loadDatabaseStats()
      break
    case 'users':
      searchUsers(1)
      break
    case 'chats':
      loadPrivateChats()
      break
    case 'groups':
      loadGroups()
      break
    case 'moments':
      loadMoments()
      break
    case 'posts':
      loadPosts()
      break
  }
}

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
  searchUsers(1)
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
const searchUsers = async (page = 1) => {
  try {
    const res = await axios.get('/api/admin/users', {
      params: { search: userSearch.value, page, limit: usersData.value.limit },
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    usersData.value = res.data
  } catch (err) {
    usersData.value = { users: [], total: 0, page: 1, limit: 20 }
  }
}

// 切换页码
const changePage = (page) => {
  usersData.value.page = page
  searchUsers(page)
}

// 查看用户详情
const viewUserDetail = async (userId) => {
  try {
    const res = await axios.get(`/api/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    selectedUserDetail.value = res.data
  } catch (err) {
    showToast('获取用户详情失败')
  }
}

// 返回用户列表
const backToUserList = () => {
  selectedUserDetail.value = null
  searchUsers()
}

// 编辑用户
const editUser = (user) => {
  editingUserId.value = user._id
  userEditForm.value = {
    nickname: user.nickname || '',
    email: user.email || '',
    role: user.role || 'user',
    isBanned: user.isBanned || false
  }
  showUserEditModal.value = true
}

// 保存用户编辑
const saveUserEdit = async () => {
  try {
    await axios.put(`/api/admin/users/${editingUserId.value}`, userEditForm.value, {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    showToast('保存成功')
    showUserEditModal.value = false
    
    // 刷新数据
    if (selectedUserDetail.value && selectedUserDetail.value._id === editingUserId.value) {
      viewUserDetail(editingUserId.value)
    }
    searchUsers(usersData.value.page)
  } catch (err) {
    showToast('保存失败')
  }
}

// 切换用户封禁状态
const toggleUserBan = async (user) => {
  try {
    await axios.put(`/api/admin/users/${user._id}`, { isBanned: !user.isBanned }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    showToast(user.isBanned ? '已解封' : '已封禁')
    viewUserDetail(user._id)
    searchUsers(usersData.value.page)
  } catch (err) {
    showToast('操作失败')
  }
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
      selectedUserDetail.value = null
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

// 查看聊天详情
const viewChatDetail = async (chat) => {
  selectedChat.value = chat
  chatMessages.value = { messages: [], total: 0, page: 1, limit: 50 }
  loadChatMessages(chat._id, 1)
}

// 加载聊天记录
const loadChatMessages = async (chatId, page = 1) => {
  chatMessagesLoading.value = true
  try {
    const res = await axios.get(`/api/admin/chats/private/${chatId}/messages`, {
      params: { page, limit: chatMessages.value.limit },
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    chatMessages.value = res.data
  } catch (err) {
    showToast('获取聊天记录失败')
  } finally {
    chatMessagesLoading.value = false
  }
}

// 切换聊天页码
const changeChatPage = (page) => {
  loadChatMessages(selectedChat.value._id, page)
}

// 返回聊天列表
const backToChatList = () => {
  selectedChat.value = null
  loadPrivateChats()
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

// 查看群组详情
const viewGroupDetails = async (groupId) => {
  try {
    const res = await axios.get(`/api/admin/groups/${groupId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    selectedGroup.value = res.data
  } catch (err) {
    showToast('获取群组详情失败')
  }
}

// 返回群组列表
const backToGroups = () => {
  selectedGroup.value = null
  loadGroups()
}

// 更新成员角色
const updateMemberRole = async (userId, role) => {
  try {
    await axios.put(`/api/admin/groups/${selectedGroup.value._id}/members/${userId}/role`, 
      { role },
      { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
    )
    showToast('角色更新成功')
  } catch (err) {
    showToast('更新角色失败')
    viewGroupDetails(selectedGroup.value._id)
  }
}

// 移除成员
const removeMember = (userId) => {
  confirmTitle.value = '确认移除'
  confirmMessage.value = '确定要移除这个成员吗？'
  confirmCallback.value = async () => {
    try {
      await axios.delete(`/api/admin/groups/${selectedGroup.value._id}/members/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      })
      showToast('成员已移除')
      viewGroupDetails(selectedGroup.value._id)
    } catch (err) {
      showToast('移除失败')
    }
  }
  showConfirm.value = true
}

// 加载朋友圈
const loadMoments = async (page = 1) => {
  try {
    const res = await axios.get('/api/admin/moments', {
      params: { page, limit: momentsData.value.limit },
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    momentsData.value = res.data
  } catch (err) {
    momentsData.value = { moments: [], total: 0, page: 1, limit: 20 }
  }
}

// 切换朋友圈页码
const changeMomentsPage = (page) => {
  momentsData.value.page = page
  loadMoments(page)
}

// 展开/收起朋友圈评论
const toggleMomentComments = async (momentId) => {
  const index = expandedMoments.value.indexOf(momentId)
  if (index > -1) {
    expandedMoments.value.splice(index, 1)
  } else {
    expandedMoments.value.push(momentId)
    loadMomentComments(momentId, 1)
  }
}

// 加载朋友圈评论
const loadMomentComments = async (momentId, page = 1) => {
  momentCommentsLoading.value = momentId
  try {
    const res = await axios.get(`/api/admin/moments/${momentId}`, {
      params: { commentPage: page, commentLimit: 20 },
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    momentDetails.value[momentId] = res.data
  } catch (err) {
    showToast('获取评论失败')
  } finally {
    momentCommentsLoading.value = null
  }
}

// 切换朋友圈评论页码
const changeMomentCommentPage = (momentId, page) => {
  loadMomentComments(momentId, page)
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
      loadMoments(momentsData.value.page)
      loadDatabaseStats()
    } catch (err) {
      showToast('删除失败')
    }
  }
  showConfirm.value = true
}

// 加载帖子
const loadPosts = async (page = 1) => {
  try {
    const res = await axios.get('/api/admin/posts', {
      params: { page, limit: postsData.value.limit },
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    postsData.value = res.data
  } catch (err) {
    postsData.value = { posts: [], total: 0, page: 1, limit: 20 }
  }
}

// 切换帖子页码
const changePostsPage = (page) => {
  postsData.value.page = page
  loadPosts(page)
}

// 展开/收起帖子评论
const togglePostComments = async (postId) => {
  const index = expandedPosts.value.indexOf(postId)
  if (index > -1) {
    expandedPosts.value.splice(index, 1)
  } else {
    expandedPosts.value.push(postId)
    loadPostComments(postId, 1)
  }
}

// 加载帖子评论
const loadPostComments = async (postId, page = 1) => {
  postCommentsLoading.value = postId
  try {
    const res = await axios.get(`/api/admin/posts/${postId}`, {
      params: { commentPage: page, commentLimit: 20 },
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
    postDetails.value[postId] = res.data
  } catch (err) {
    showToast('获取评论失败')
  } finally {
    postCommentsLoading.value = null
  }
}

// 切换帖子评论页码
const changePostCommentPage = (postId, page) => {
  loadPostComments(postId, page)
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
      loadPosts(postsData.value.page)
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
  background: #f8fafc;
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

.input-wrapper input,
.input-wrapper select {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  background: #f9fafb;
}

.input-wrapper input:focus,
.input-wrapper select:focus {
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
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-left .logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-text {
  color: #1e293b;
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
  color: #1e293b;
  font-weight: 600;
  font-size: 0.95rem;
}

.admin-role {
  color: #64748b;
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
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
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
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.menu-item:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.menu-item.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.2);
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
  color: #1e293b;
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
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stat-card:hover {
  background: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  color: #1e293b;
  font-size: 1.75rem;
  font-weight: 700;
}

.stat-label {
  color: #64748b;
  font-size: 0.85rem;
}

/* 表格管理 */
.table-list h3 {
  color: #1e293b;
  margin-bottom: 1rem;
}

.table-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.table-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.table-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #1e293b;
  font-weight: 600;
}

.view-btn {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.2);
  padding: 0.375rem 0.875rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.view-btn:hover {
  background: rgba(99, 102, 241, 0.2);
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
  border-bottom: 1px solid #e2e8f0;
  color: #374151;
}

.data-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #64748b;
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
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  background: #ffffff;
  color: #1e293b;
}

.search-bar input::placeholder {
  color: #94a3b8;
}

.search-bar input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  background: #ffffff;
}

.search-btn {
  padding: 0 1.25rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 12px;
  font-size: 1.25rem;
  cursor: pointer;
}

/* 用户详情、聊天详情、群组详情视图 */
.back-btn {
  background: #f1f5f9;
  color: #374151;
  margin-bottom: 1.5rem;
}

.user-detail-card,
.chat-detail-header,
.group-detail-header {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.user-detail-header,
.group-detail-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-avatar-large,
.group-icon-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 2rem;
  flex-shrink: 0;
}

.user-detail-info h3,
.group-detail-info h3 {
  color: #1e293b;
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
}

.user-detail-info p,
.group-detail-info p {
  color: #64748b;
  margin: 0 0 0.5rem 0;
}

.user-badges {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.user-stats {
  display: flex;
  gap: 2rem;
  padding: 1.5rem 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  margin: 1.5rem 0;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  color: #1e293b;
  font-size: 1.75rem;
  font-weight: 700;
}

.stat-label {
  color: #64748b;
  font-size: 0.85rem;
}

.user-detail-actions,
.chat-detail-header {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.chat-detail-header {
  justify-content: space-between;
  align-items: center;
}

.chat-members-title {
  color: #1e293b;
  font-weight: 600;
  font-size: 1.25rem;
}

.chat-meta {
  color: #64748b;
}

.chat-messages-container {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  max-height: 500px;
  overflow-y: auto;
}

.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chat-message {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.message-sender {
  color: #1e293b;
  font-weight: 600;
}

.message-time {
  color: #94a3b8;
  font-size: 0.8rem;
}

.message-text {
  color: #374151;
}

/* 用户列表、聊天列表、群组列表 */
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
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.user-card:hover,
.chat-card:hover,
.group-card:hover {
  background: #f8fafc;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

.user-info,
.chat-info,
.group-info {
  flex: 1;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.user-name,
.chat-members,
.group-name {
  color: #1e293b;
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
  color: #64748b;
  font-size: 0.85rem;
}

.user-actions,
.moment-actions,
.post-actions {
  display: flex;
  gap: 0.5rem;
}

.chat-preview {
  color: #64748b;
  font-size: 0.9rem;
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
}

.chat-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-time,
.group-meta {
  color: #64748b;
  font-size: 0.85rem;
}

.chat-count {
  color: #6366f1;
  font-size: 0.85rem;
  font-weight: 500;
}

.chat-action {
  color: #64748b;
  font-size: 1.5rem;
}

/* 群组详情 */
.group-members-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.group-members-section h4 {
  color: #1e293b;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.group-members-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.group-member-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s;
}

.group-member-card:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.member-avatar {
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

.member-info {
  flex: 1;
}

.member-name {
  color: #1e293b;
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.member-username {
  color: #64748b;
  font-size: 0.85rem;
}

.role-select {
  padding: 0.5rem 0.75rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #1e293b;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.role-select:hover {
  background: #f8fafc;
}

.role-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
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
  color: #1e293b;
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
  color: #94a3b8;
  font-size: 0.8rem;
}

.post-title {
  color: #1e293b;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.moment-content,
.post-content {
  color: #374151;
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.moment-stats,
.post-stats {
  display: flex;
  gap: 1rem;
  color: #64748b;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.delete-btn-sm {
  align-self: flex-end;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
}

/* 评论区域 */
.comments-section {
  width: 100%;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.comment-card {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.comment-author {
  color: #1e293b;
  font-weight: 500;
  font-size: 0.9rem;
}

.comment-time {
  color: #94a3b8;
  font-size: 0.75rem;
}

.comment-text {
  color: #374151;
  font-size: 0.9rem;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px dashed #e2e8f0;
}

.empty-state.small {
  padding: 1.5rem;
  font-size: 0.9rem;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination.small {
  margin-top: 1rem;
}

.page-info {
  color: #64748b;
  font-size: 0.9rem;
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
  padding: 1rem;
}

.modal {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 2rem;
  border-radius: 20px;
  width: 100%;
  max-width: 420px;
  animation: modalIn 0.3s ease;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal.large {
  max-width: 500px;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.modal h3 {
  color: #1e293b;
  margin-bottom: 0.75rem;
}

.modal p {
  color: #64748b;
  margin-bottom: 1.5rem;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.edit-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.edit-form .form-group label {
  color: #374151;
  font-size: 0.9rem;
  font-weight: 500;
}

.edit-form .form-group input,
.edit-form .form-group select {
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  background: #f9fafb;
  color: #1e293b;
}

.edit-form .form-group input:focus,
.edit-form .form-group select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  background: #ffffff;
}

.edit-form .form-group.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.edit-form .form-group.checkbox label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: white;
  padding: 1rem 2rem;
  border-radius: 50px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
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
  border: 3px solid #f1f5f9;
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