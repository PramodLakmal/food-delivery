import api from './api';

// User Management
export const getAllUsers = async (page = 1, limit = 10, search = '') => {
  try {
    const response = await api.get(`/users?page=${page}&limit=${limit}&search=${search}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await api.post('/admin/users', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const changeUserRole = async (userId, role) => {
  try {
    const response = await api.put(`/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    await api.delete(`/admin/users/${userId}`);
  } catch (error) {
    throw error;
  }
};

export const toggleUserStatus = async (userId) => {
  try {
    const response = await api.put(`/users/${userId}/status`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Restaurant Management
export const getAllRestaurants = async (page = 1, limit = 10, search = '') => {
  try {
    const response = await api.get(`/restaurants?page=${page}&limit=${limit}&search=${search}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRestaurantById = async (restaurantId) => {
  try {
    const response = await api.get(`/restaurants/${restaurantId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRestaurantsByOwner = async (ownerId) => {
  try {
    const response = await api.get(`/restaurants/owner/${ownerId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createRestaurant = async (restaurantData) => {
  try {
    const response = await api.post('/restaurants', restaurantData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateRestaurant = async (restaurantId, restaurantData) => {
  try {
    const response = await api.put(`/restaurants/${restaurantId}`, restaurantData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteRestaurant = async (restaurantId) => {
  try {
    await api.delete(`/restaurants/${restaurantId}`);
  } catch (error) {
    throw error;
  }
};

export const toggleRestaurantStatus = async (restaurantId) => {
  try {
    const response = await api.patch(`/restaurants/${restaurantId}/toggle-status`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Menu Item Management
export const getMenuItemsByRestaurant = async (restaurantId) => {
  try {
    const response = await api.get(`/menu-items/restaurant/${restaurantId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMenuItemById = async (menuItemId) => {
  try {
    const response = await api.get(`/menu-items/${menuItemId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createMenuItem = async (menuItemData) => {
  try {
    const response = await api.post('/menu-items', menuItemData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateMenuItem = async (menuItemId, menuItemData) => {
  try {
    const response = await api.put(`/menu-items/${menuItemId}`, menuItemData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteMenuItem = async (menuItemId) => {
  try {
    await api.delete(`/menu-items/${menuItemId}`);
  } catch (error) {
    throw error;
  }
};

export const toggleMenuItemAvailability = async (menuItemId) => {
  try {
    const response = await api.patch(`/menu-items/${menuItemId}/toggle-availability`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Dashboard Statistics
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  } catch (error) {
    throw error;
  }
}; 
 
 
 
 