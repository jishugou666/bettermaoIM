// 好友 API 调用

// 发送好友请求
const sendFriendRequest = async (toUserId) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/friends/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ toUserId })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to send friend request');
  }
  
  return await response.json();
};

// 处理好友请求
const handleFriendRequest = async (requestId, status) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/friends/request/${requestId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to handle friend request');
  }
  
  return await response.json();
};

// 获取好友列表
const getFriends = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/friends`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get friends');
  }
  
  return await response.json();
};

// 获取好友请求列表
const getFriendRequests = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/friends/requests`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get friend requests');
  }
  
  return await response.json();
};

// 删除好友
const deleteFriend = async (friendId) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/friends/${friendId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete friend');
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

export { sendFriendRequest, handleFriendRequest, getFriends, getFriendRequests, deleteFriend, searchUsers };