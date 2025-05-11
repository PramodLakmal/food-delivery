import api from './api';

// Register a new user
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    
    // Store token and user data in localStorage
    localStorage.setItem('token', response.data.token);
    
    // Normalize user data to ensure consistent properties
    const user = normalizeUserData(response.data.user);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token: response.data.token, user };
  } catch (error) {
    throw handleAuthError(error);
  }
};

// Login user
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    
    // Store token and user data in localStorage
    localStorage.setItem('token', response.data.token);
    
    // Normalize user data to ensure consistent properties
    const user = normalizeUserData(response.data.user);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token: response.data.token, user };
  } catch (error) {
    throw handleAuthError(error);
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    
    // Check response structure - the API might return { user: {...} } or just {...}
    const userData = response.data.user || response.data;
    
    // Normalize user data to ensure consistent properties
    const user = normalizeUserData(userData);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { user };
  } catch (error) {
    throw handleAuthError(error);
  }
};

// Logout user
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Get authenticated user from localStorage
export const getAuthUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Get auth token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Helper function to normalize user data
const normalizeUserData = (userData) => {
  if (!userData) return null;
  
  const normalized = { ...userData };
  
  // Ensure id is consistent (some responses use _id, others use id)
  if (normalized._id && !normalized.id) {
    normalized.id = normalized._id;
  } else if (normalized.id && !normalized._id) {
    normalized._id = normalized.id;
  }
  
  return normalized;
};

// Helper function to handle auth errors
const handleAuthError = (error) => {
  console.error('Auth error:', error);
  
  if (error.response) {
    // Server responded with an error
    const errorMessage = error.response.data.message || 'Authentication failed';
    return new Error(errorMessage);
  }
  
  return new Error('Network error. Please check your connection.');
};

// Function to update the user's password
export const changePassword = async (passwordData) => {
  try {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to change password' };
  }
};

// Function to request a password reset
export const requestPasswordReset = async (email) => {
  try {
    console.log('Requesting password reset for:', email);
    const response = await api.post('/auth/forgot-password', { email });
    console.log('Password reset response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Password reset request error:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      throw error.response.data;
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw { message: 'No response from server. Please try again later.' };
    } else {
      console.error('Request setup error:', error.message);
      throw { message: error.message || 'Failed to request password reset' };
    }
  }
};

// Function to verify a password reset token
export const verifyResetToken = async (token) => {
  try {
    const response = await api.get(`/auth/verify-reset-token/${token}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Invalid or expired reset token' };
  }
};

// Function to reset password with token
export const resetPassword = async (resetData) => {
  try {
    const response = await api.post('/auth/reset-password', resetData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to reset password' };
  }
};

// Function to check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Function to check if user has a specific role
export const hasRole = (role) => {
  const user = getAuthUser();
  return user && user.role === role;
}; 