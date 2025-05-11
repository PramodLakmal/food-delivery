import api from './api';

/**
 * Get all menu items with optional filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.search - Search term
 * @param {string} params.category - Category filter
 * @param {boolean} params.isAvailable - Filter by availability
 * @returns {Promise<Object>} - Menu items with pagination info
 */
export const getAllMenuItems = async (params = {}) => {
  try {
    // Add default filter for available items only
    const queryParams = {
      ...params,
      isAvailable: params.isAvailable !== undefined ? params.isAvailable : true
    };
    
    const response = await api.get('/menu-items', { params: queryParams });
    return response.data;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
};

/**
 * Get all available menu categories
 * @returns {Promise<Object>} - Categories list
 */
export const getAllCategories = async () => {
  try {
    const response = await api.get('/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Get menu items by restaurant ID
 * @param {string} restaurantId - Restaurant ID
 * @param {Object} params - Query parameters
 * @param {string} params.category - Optional category filter
 * @param {boolean} params.isAvailable - Filter by availability
 * @returns {Promise<Array>} - Menu items for the restaurant
 */
export const getMenuItemsByRestaurant = async (restaurantId, params = {}) => {
  try {
    // Add default filter for available items only
    const queryParams = {
      ...params,
      isAvailable: params.isAvailable !== undefined ? params.isAvailable : true
    };
    
    const response = await api.get(`/menu-items/restaurant/${restaurantId}`, {
      params: queryParams
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching menu items for restaurant ${restaurantId}:`, error);
    throw error;
  }
};

/**
 * Get menu item by ID
 * @param {string} id - Menu item ID
 * @returns {Promise<Object>} - Menu item details
 */
export const getMenuItemById = async (id) => {
  try {
    const response = await api.get(`/menu-items/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching menu item with ID ${id}:`, error);
    throw error;
  }
}; 
 
 
 
 