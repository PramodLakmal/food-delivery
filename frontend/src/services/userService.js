import api from './api';

/**
 * Get current user profile
 * @returns {Promise<Object>} Response with user data
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/user/me');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch user profile' };
  }
};

/**
 * Get user by ID (admin only)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response with user data
 */
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch user' };
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Response with updated user
 */
export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update user' };
  }
};

/**
 * Get all users (admin only)
 * @returns {Promise<Object>} Response with users data
 */
export const getAllUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch users' };
  }
};

/**
 * Update user role (admin only)
 * @param {string} userId - User ID
 * @param {string} role - New role
 * @returns {Promise<Object>} Response with updated user
 */
export const updateUserRole = async (userId, role) => {
  try {
    const response = await api.put(`/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update user role' };
  }
};

/**
 * Delete user account (admin or self)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response with deletion confirmation
 */
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete user' };
  }
};

/**
 * Get order history for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response with order history
 */
export const getUserOrderHistory = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/orders`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch order history' };
  }
};

/**
 * Update user address
 * @param {string} userId - User ID
 * @param {Object} addressData - Address data
 * @returns {Promise<Object>} Response with updated user
 */
export const updateUserAddress = async (userId, addressData) => {
  try {
    const response = await api.put(`/users/${userId}/address`, addressData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update address' };
  }
}; 
 
 