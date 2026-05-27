import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ 여기에 서버 주소 입력 (로컬: http://localhost:8080, 배포: https://your-server.com)
const BASE_URL = 'https://study-lock-production.up.railway.app';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 요청마다 토큰 자동 주입
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 응답 에러 처리
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    }
    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────
// Auth API
// ──────────────────────────────────────────
export const authAPI = {
  signup: (data) => api.post('/api/auth/signup', data),
  login: (data) => api.post('/api/auth/login', data),
};

// ──────────────────────────────────────────
// Study API
// ──────────────────────────────────────────
export const studyAPI = {
  start: (data) => api.post('/api/study/start', data),
  end: (data) => api.post('/api/study/end', data),
  escape: (sessionId) => api.post('/api/study/escape', sessionId),
};

// ──────────────────────────────────────────
// Records API
// ──────────────────────────────────────────
export const recordsAPI = {
  today: () => api.get('/api/records/today'),
  all: () => api.get('/api/records'),
};

// ──────────────────────────────────────────
// Stats API
// ──────────────────────────────────────────
export const statsAPI = {
  weekly: () => api.get('/api/stats/weekly'),
  subject: () => api.get('/api/stats/subject'),
};

// ──────────────────────────────────────────
// User API
// ──────────────────────────────────────────
export const userAPI = {
  me: () => api.get('/api/user/me'),
  delete: () => api.delete('/api/user/me'),
};

export default api;
