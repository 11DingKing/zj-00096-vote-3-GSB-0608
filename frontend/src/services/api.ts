import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  getProfile: () => api.get('/auth/profile'),
};

export const pollsApi = {
  getAll: () => api.get('/polls'),
  getById: (id: number) => api.get(`/polls/${id}`),
  getResults: (id: number) => api.get(`/polls/${id}/results`),
  create: (data: any) => api.post('/polls', data),
  vote: (id: number, data: any) => api.post(`/polls/${id}/vote`, data),
  hasVoted: (id: number, browserFingerprint?: string) =>
    api.get(`/polls/${id}/has-voted`, { params: { browserFingerprint } }),
  export: (id: number, details?: boolean) =>
    api.get(`/polls/${id}/export`, { params: { details }, responseType: 'blob' }),
  updateStatus: (id: number, status: string) =>
    api.put(`/polls/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/polls/${id}`),
};

export const templatesApi = {
  getAll: () => api.get('/templates'),
  getById: (id: number) => api.get(`/templates/${id}`),
};

export const commentsApi = {
  getByPollId: (pollId: number, page: number = 1, limit: number = 20) =>
    api.get(`/polls/${pollId}/comments`, { params: { page, limit } }),
  create: (pollId: number, content: string) =>
    api.post(`/polls/${pollId}/comments`, { content }),
  like: (commentId: number) => api.post(`/comments/${commentId}/like`),
};

export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
