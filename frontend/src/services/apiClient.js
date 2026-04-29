import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Tự động đính kèm token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('temp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Tự động logout khi token hết hạn (401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ → xóa session và redirect về login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('temp_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
