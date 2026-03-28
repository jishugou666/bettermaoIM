// 朋友圈 API 调用

// 发布朋友圈动态
const createMoment = async (content, images) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/moments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content, images })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create moment');
  }
  
  return await response.json();
};

// 获取朋友圈动态列表
const getMoments = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/moments`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get moments');
  }
  
  return await response.json();
};

// 点赞朋友圈动态
const likeMoment = async (momentId) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/moments/${momentId}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to like moment');
  }
  
  return await response.json();
};

// 取消点赞
const unlikeMoment = async (momentId) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/moments/${momentId}/like`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to unlike moment');
  }
  
  return await response.json();
};

// 评论朋友圈动态
const commentMoment = async (momentId, content) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/moments/${momentId}/comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to comment moment');
  }
  
  return await response.json();
};

// 删除评论
const deleteComment = async (momentId, commentId) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/moments/${momentId}/comment/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete comment');
  }
  
  return await response.json();
};

// 获取动态详情
const getMomentById = async (momentId) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/moments/${momentId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get moment');
  }
  
  return await response.json();
};

// 获取评论列表
const getComments = async (momentId) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/moments/${momentId}/comments`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get comments');
  }
  
  return await response.json();
};

export { createMoment, getMoments, likeMoment, unlikeMoment, commentMoment, deleteComment, getMomentById, getComments };