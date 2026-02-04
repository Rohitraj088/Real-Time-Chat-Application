import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me')
};

// Users API
export const usersAPI = {
  getUsers: (search = '') => api.get(`/users?search=${search}`),
  getUser: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  updateStatus: (status) => api.put('/users/status', { status })
};

// Rooms API
export const roomsAPI = {
  getRooms: () => api.get('/rooms'),
  getRoom: (id) => api.get(`/rooms/${id}`),
  createRoom: (data) => api.post('/rooms', data),
  createPrivateRoom: (userId) => api.post('/rooms/private', { userId }),
  updateRoom: (id, data) => api.put(`/rooms/${id}`, data),
  addMembers: (id, members) => api.post(`/rooms/${id}/members`, { members }),
  removeMember: (roomId, userId) => api.delete(`/rooms/${roomId}/members/${userId}`),
  deleteRoom: (id) => api.delete(`/rooms/${id}`)
};

// Messages API
export const messagesAPI = {
  getMessages: (roomId, page = 1, limit = 50) => 
    api.get(`/messages/${roomId}?page=${page}&limit=${limit}`),
  sendMessage: (roomId, data) => api.post(`/messages/${roomId}`, data),
  editMessage: (id, content) => api.put(`/messages/${id}`, { content }),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
  markAsRead: (id) => api.post(`/messages/${id}/read`)
};

// Upload API
export const uploadAPI = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export default api;
