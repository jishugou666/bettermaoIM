// 聊天 API 调用

// 创建聊天会话
const createChat = async (type, name, avatar, memberIds) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/chats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ type, name, avatar, memberIds })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create chat');
  }
  
  return await response.json();
};

// 获取聊天会话列表
const getChats = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/chats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get chats');
  }
  
  return await response.json();
};

// 获取聊天会话的消息记录
const getMessages = async (chatId) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/chats/${chatId}/messages`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get messages');
  }
  
  return await response.json();
};

// 发送消息
const sendMessage = async (chatId, content, type = 'text') => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/chats/${chatId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content, type })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to send message');
  }
  
  return await response.json();
};

export { createChat, getChats, getMessages, sendMessage };