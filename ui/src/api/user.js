// 用户 API 调用

// 获取当前用户信息
const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get user info');
  }
  
  return await response.json();
};

// 更新用户信息
const updateUser = async (userData) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/users`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update user info');
  }
  
  return await response.json();
};

// 搜索用户
const searchUsers = async (keyword) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/users/search?keyword=${encodeURIComponent(keyword)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to search users');
  }
  
  return await response.json();
};

// 获取积分排行榜
const getPointsRank = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/users/points/rank`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get points rank');
  }
  
  return await response.json();
};

export { getCurrentUser, updateUser, searchUsers, getPointsRank };