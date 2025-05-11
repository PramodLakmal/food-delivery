import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const DELIVERY_SERVICE_URL = 'http://localhost:3005/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create delivery service axios instance
export const deliveryApi = axios.create({
  baseURL: DELIVERY_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in requests for both instances
const addAuthToken = (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

api.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));
deliveryApi.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));

// Add response interceptor for error handling for both instances
const handleResponseError = (error) => {
  console.error('API Error:', error);
  
  // Handle unauthorized errors (401)
    if (error.response && error.response.status === 401) {
    console.log('Unauthorized request detected');
    
    // Check if this is not a login/register request
    const isAuthEndpoint = 
      error.config.url.includes('/auth/login') || 
      error.config.url.includes('/auth/register');
    
    if (!isAuthEndpoint) {
      console.log('Session expired - clearing auth data');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Show toast notification
      toast.error('Your session has expired. Please log in again.', {
        duration: 5000,
        position: 'top-center'
      });
      
      // Redirect to login page
      setTimeout(() => {
      window.location.href = '/login';
      }, 1000);
    }
  }
  
    return Promise.reject(error);
};

api.interceptors.response.use((response) => response, handleResponseError);
deliveryApi.interceptors.response.use((response) => response, handleResponseError);

export default api; 
 