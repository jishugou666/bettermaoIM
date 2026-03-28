// 积分 API 调用

// 获取积分记录
const getPoints = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/points`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get points');
  }
  
  return await response.json();
};

// 每日签到
const sign = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/points/sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to sign');
  }
  
  return await response.json();
};

export { getPoints, sign };