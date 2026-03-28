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

// --- 修改开始 ---
// 检查今日是否已签到
const checkSignInStatus = async () => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`/api/points`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    const today = new Date().toISOString().split('T')[0];
    
    // 检查是否有今天的签到记录
    const hasSignedToday = data.points?.some(record => {
      const recordDate = new Date(record.createTime).toISOString().split('T')[0];
      return record.type === 'sign' && recordDate === today;
    });
    
    return hasSignedToday || false;
  } catch (error) {
    console.error('Failed to check sign-in status:', error);
    return false;
  }
};
// --- 修改结束 ---

// 每日签到
const signIn = async () => {
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

export { getPoints, signIn, checkSignInStatus };