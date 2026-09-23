import axios from 'axios';
import { toast } from 'react-toastify';

const getBaseUrl = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://expense-tracker-spring-boot-and-react.onrender.com/api';
  }
  return 'http://localhost:8080/api';
};

export const API_BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL.replace(/\/+$/, ''), // Ensures no trailing slash
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = 
      localStorage.getItem('token') || 
      localStorage.getItem('jwt') || 
      localStorage.getItem('authToken');
      
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling (e.g., 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('jwt');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      toast.error('Session expired. Please sign in again.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
