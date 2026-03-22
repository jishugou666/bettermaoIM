import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3000',
});

// Add interceptor to include token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default {
  uploadAvatar(formData) {
    return api.post('/api/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  uploadMomentImage(formData) {
    return api.post('/api/upload/moment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  uploadChatImage(formData) {
    return api.post('/api/upload/chat', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  uploadGroupFile(formData) {
    return api.post('/api/upload/group-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};
