<template>
  <div class="community-layout">
    <div class="header-section card">
      <button class="back-btn" @click="router.push('/')">← {{ $t('common.back') }}</button>
      <h2>{{ $t('community.title') }}</h2>
      <p class="subtitle">{{ $t('home.community_desc') }}</p>
      <button class="new-post-btn" @click="showCreatePost = true">
        <SvgIcon name="pen-tool" size="16px" /> {{ $t('community.new_post') }}
      </button>
    </div>

    <div class="content-grid">
      <div class="posts-list">
        <div v-if="loading" class="loader-wrapper"><div class="loader"></div></div>
        <div v-else-if="posts.length === 0" class="empty-state">{{ $t('community.no_posts') }} {{ $t('community.be_first') }}</div>
        
        <div v-for="post in posts" :key="post.id" class="post-card card">
          <div class="post-header">
            <Avatar :username="post.user.username" :src="post.user.avatar" />
            <div class="user-info">
              <span class="username">{{ post.user.username }}</span>
              <span v-if="post.user.isVip" class="vip-badge">
                <SvgIcon name="crown" size="14px" />
              </span>
              <span class="time">{{ formatDate(post.createdAt) }}</span>
            </div>
            <span class="category-tag">{{ $t(`community.categories.${post.category}`) }}</span>
          </div>
          
          <h3 class="post-title">{{ post.title }}</h3>
          <div class="post-content">{{ post.content }}</div>
          
          <div class="post-actions">
            <button class="action-btn" @click="toggleLike(post.id)">
              <SvgIcon name="heart" size="16px" /> {{ post._count.likes }}
            </button>
            <button class="action-btn" @click="showComments(post.id)">
              <SvgIcon name="message-circle" size="16px" /> {{ post._count.comments }}
            </button>
            <button class="action-btn" @click="messageAuthor(post.user.id, post.user.username)">
              <SvgIcon name="mail-open" size="16px" /> 私信
            </button>
            <button class="action-btn" @click="createDiscussionGroup(post.id, post.title, post.user.id)">
              <SvgIcon name="users-group" size="16px" /> 讨论群
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Post Modal -->
    <div v-if="showCreatePost" class="modal-overlay" @click.self="showCreatePost = false">
      <div class="modal">
        <h3>{{ $t('community.new_post') }}</h3>
        <input v-model="newPost.title" :placeholder="$t('community.title')" class="modal-input" />
        <select v-model="newPost.category" class="modal-input">
          <option value="general">{{ $t('community.categories.general') }}</option>
          <option value="tech">{{ $t('community.categories.tech') }}</option>
          <option value="team">{{ $t('community.categories.team') }}</option>
        </select>
        <textarea v-model="newPost.content" :placeholder="$t('community.content')" rows="5" class="modal-input"></textarea>
        
        <div class="modal-actions">
          <button class="cancel-btn" @click="showCreatePost = false">{{ $t('common.cancel') }}</button>
          <button class="confirm-btn" @click="handleCreatePost" :disabled="!newPost.title || !newPost.content">{{ $t('community.post') }}</button>
        </div>
      </div>
    </div>

    <!-- Comments Modal -->
    <div v-if="showCommentsModal" class="modal-overlay" @click.self="showCommentsModal = false">
      <div class="modal">
        <h3>评论</h3>
        <div class="comments-list">
          <div v-if="!postComments || postComments.length === 0" class="empty-comments">暂无评论，成为第一个评论的人吧！</div>
          <div v-else v-for="comment in postComments" :key="comment.id" class="comment-item">
            <Avatar :username="comment.user.username" :src="comment.user.avatar" :size="30" />
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-username">{{ comment.user.username }}</span>
                <span v-if="comment.user.isVip" class="vip-badge">
                  <SvgIcon name="crown" size="12px" />
                </span>
              </div>
              <div class="comment-text">{{ comment.content }}</div>
            </div>
          </div>
        </div>
        <div class="comment-input-wrapper">
          <input 
            v-model="newComment" 
            placeholder="写评论..." 
            class="modal-input" 
            @keyup.enter="createComment"
          />
          <button class="confirm-btn" @click="createComment" :disabled="!newComment.trim()">发布</button>
        </div>
        <button class="close-btn" @click="showCommentsModal = false">{{ $t('common.close') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Avatar from '../components/Avatar.vue'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import SvgIcon from '../components/SvgIcon.vue'

const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()
const posts = ref([])
const loading = ref(false)
const showCreatePost = ref(false)
const newPost = ref({ title: '', content: '', category: 'general' })
const showCommentsModal = ref(false)
const currentPostId = ref(null)
const postComments = ref([])
const newComment = ref('')

const fetchPosts = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/community/posts', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    posts.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleCreatePost = async () => {
  try {
    await axios.post('/api/community/posts', newPost.value, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    showCreatePost.value = false
    newPost.value = { title: '', content: '', category: 'general' }
    fetchPosts()
  } catch (err) {
    alert('Failed to create post')
  }
}

const toggleLike = async (postId) => {
  try {
    await axios.post(`/api/community/posts/${postId}/like`, {}, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    fetchPosts() // Refresh for simple counter update
  } catch (err) {
    console.error(err)
  }
}

const showComments = async (postId) => {
  console.log('Showing comments for post:', postId)
  currentPostId.value = postId
  await fetchComments(postId)
  console.log('Comments fetched, opening modal')
  showCommentsModal.value = true
  console.log('Modal opened, postComments:', postComments.value)
}

const fetchComments = async (postId) => {
  try {
    console.log('Fetching comments for post:', postId)
    console.log('Auth token:', authStore.token)
    
    if (!authStore.token) {
      console.error('No auth token found')
      postComments.value = []
      return
    }
    
    const res = await axios.get(`/api/community/posts/${postId}`, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}` 
      }
    })
    console.log('Response data:', res.data)
    if (res.data && res.data.comments) {
      postComments.value = res.data.comments
      console.log('postComments value:', postComments.value)
    } else {
      console.error('No comments found in response')
      postComments.value = []
    }
  } catch (err) {
    console.error('Error fetching comments:', err)
    console.error('Error response:', err.response)
    postComments.value = []
  }
}

const createComment = async () => {
  if (!newComment.value.trim()) return
  
  try {
    console.log('Creating comment for post:', currentPostId.value)
    console.log('Comment content:', newComment.value)
    console.log('Auth token:', authStore.token)
    
    if (!authStore.token) {
      console.error('No auth token found')
      alert('请先登录')
      return
    }
    
    const response = await axios.post(`/api/community/posts/${currentPostId.value}/comments`, 
      { content: newComment.value }, 
      {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}` 
        }
      }
    )
    
    console.log('Comment created successfully:', response.data)
    
    newComment.value = ''
    
    console.log('Fetching comments for post:', currentPostId.value)
    await fetchComments(currentPostId.value)
  } catch (err) {
    console.error('Error creating comment:', err)
    console.error('Error response:', err.response)
  }
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString()
}

const messageAuthor = (userId, username) => {
  chatStore.setActiveConversation(userId, 'user')
  router.push('/chat')
}

const createDiscussionGroup = async (postId, postTitle, authorId) => {
  try {
    const res = await axios.post('/api/community/discussion-group', 
      { postId, memberIds: [] }, 
      {
        headers: { Authorization: `Bearer ${authStore.token}` }
      }
    )
    const group = res.data
    chatStore.setActiveConversation(group.id, 'group')
    router.push('/chat')
  } catch (error) {
    console.error('Failed to create discussion group:', error)
    alert('创建讨论群失败')
  }
}

onMounted(fetchPosts)
</script>

<style scoped>
/* Reusing some styles */
.community-layout {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.header-section {
  padding: 2rem;
  margin-bottom: 2rem;
  position: relative;
}

.new-post-btn {
  position: absolute;
  top: 2rem;
  right: 2rem;
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}

.post-card {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.vip-badge {
  font-size: 0.8rem;
  margin-left: 0.2rem;
}

.category-tag {
  margin-left: auto;
  background: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.post-title {
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
}

.post-content {
  color: #4b5563;
  margin-bottom: 1rem;
  white-space: pre-wrap;
}

.post-actions {
  display: flex;
  gap: 1rem;
  border-top: 1px solid #f3f4f6;
  padding-top: 1rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn:hover {
  color: var(--primary-color);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-input {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
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
}

.confirm-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
}

.back-btn {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: #6b7280;
}

.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.comments-list {
  max-height: 300px;
  overflow-y: auto;
  margin: 1rem 0;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
  padding: 1rem;
}

.comment-item {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.comment-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.comment-username {
  font-weight: 600;
  margin-right: 0.5rem;
}

.comment-text {
  color: #4b5563;
  line-height: 1.4;
}

.empty-comments {
  text-align: center;
  color: #6b7280;
  padding: 2rem;
}

.comment-input-wrapper {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.close-btn {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  font-weight: 500;
}
</style>