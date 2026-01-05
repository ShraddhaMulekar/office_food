import axios from 'axios';
console.log('2 import.meta.env.MODE -', import.meta.env.MODE);

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.PROD
    ? 'http://localhost:5000'
    : 'http://localhost:4001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Only redirect on 401 if we're not on the login page
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 