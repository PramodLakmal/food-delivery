import api from './api';

// Debug logger
const logDebug = (message, data) => {
  console.log(`[RestaurantService] ${message}`, data || '');
};

// Get all restaurants with pagination and search
export const getAllRestaurants = async (page = 1, limit = 10, search = '', isActive = true) => {
  try {
    logDebug(`Fetching restaurants: page=${page}, limit=${limit}, search=${search}, isActive=${isActive}`);
    
    let url = `/restaurants?page=${page}&limit=${limit}`;
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    if (isActive !== undefined) {
      url += `&isActive=${isActive}`;
    }
    
    const response = await api.get(url);
    logDebug('Restaurants fetched successfully', response.data);
    return response.data;
  } catch (error) {
    logDebug('Error fetching restaurants', error);
    throw error;
  }
};

// Get restaurant by ID
export const getRestaurantById = async (id) => {
  try {
    logDebug(`Fetching restaurant by ID: ${id}`);
    const response = await api.get(`/restaurants/${id}`);
    logDebug('Restaurant fetched successfully', response.data);
    return response.data;
  } catch (error) {
    logDebug(`Error fetching restaurant ${id}`, error);
    throw error;
  }
};

// Get restaurants by owner ID
export const getRestaurantsByOwner = async (ownerId) => {
  try {
    logDebug(`Fetching restaurants by owner: ${ownerId}`);
    const response = await api.get(`/restaurants/owner/${ownerId}`);
    logDebug('Owner restaurants fetched successfully', response.data);
    return response.data;
  } catch (error) {
    logDebug(`Error fetching restaurants for owner ${ownerId}`, error);
    throw error;
  }
};

// Create restaurant
export const createRestaurant = async (restaurantData) => {
  try {
    logDebug('Creating restaurant', restaurantData);
    const response = await api.post('/restaurants', restaurantData);
    logDebug('Restaurant created successfully', response.data);
    return response.data;
  } catch (error) {
    logDebug('Error creating restaurant', error);
    throw error;
  }
};

// Update restaurant
export const updateRestaurant = async (id, restaurantData) => {
  try {
    logDebug(`Updating restaurant ${id}`, restaurantData);
    const response = await api.put(`/restaurants/${id}`, restaurantData);
    logDebug('Restaurant updated successfully', response.data);
    return response.data;
  } catch (error) {
    logDebug(`Error updating restaurant ${id}`, error);
    throw error;
  }
};

// Delete restaurant
export const deleteRestaurant = async (id) => {
  try {
    logDebug(`Deleting restaurant ${id}`);
    const response = await api.delete(`/restaurants/${id}`);
    logDebug('Restaurant deleted successfully', response.data);
    return response.data;
  } catch (error) {
    logDebug(`Error deleting restaurant ${id}`, error);
    throw error;
  }
};

// Toggle restaurant status
export const toggleRestaurantStatus = async (id) => {
  try {
    logDebug(`Toggling status for restaurant ${id}`);
    const response = await api.patch(`/restaurants/${id}/toggle-status`);
    logDebug('Restaurant status toggled successfully', response.data);
    return response.data;
  } catch (error) {
    logDebug(`Error toggling restaurant status ${id}`, error);
    throw error;
  }
};

// Get all menu items for a restaurant
export const getMenuItemsByRestaurant = async (restaurantId) => {
  try {
    logDebug(`Fetching menu items for restaurant ${restaurantId}`);
    const response = await api.get(`/menu-items/restaurant/${restaurantId}`);
    logDebug('Menu items fetched successfully', response.data);
    return response.data;
  } catch (error) {
    logDebug(`Error fetching menu items for restaurant ${restaurantId}`, error);
    throw error;
  }
};

// Get menu item by ID
export const getMenuItemById = async (id) => {
  try {
    const response = await api.get(`/menu-items/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching menu item with ID ${id}:`, error);
    throw error;
  }
};

// Create menu item
export const createMenuItem = async (menuItemData) => {
  try {
    logDebug('Creating menu item', menuItemData);
    const response = await api.post('/menu-items', menuItemData);
    logDebug('Menu item created successfully', response.data);
    return response.data;
  } catch (error) {
    logDebug('Error creating menu item', error);
    throw error;
  }
};

// Update menu item
export const updateMenuItem = async (id, menuItemData) => {
  try {
    logDebug(`Updating menu item ${id}`, menuItemData);
    const response = await api.put(`/menu-items/${id}`, menuItemData);
    logDebug('Menu item updated successfully', response.data);
    return response.data;
  } catch (error) {
    logDebug(`Error updating menu item ${id}`, error);
    throw error;
  }
};

// Delete menu item
export const deleteMenuItem = async (id) => {
  try {
    logDebug(`Deleting menu item ${id}`);
    const response = await api.delete(`/menu-items/${id}`);
    logDebug('Menu item deleted successfully', response.data);
    return response.data;
  } catch (error) {
    logDebug(`Error deleting menu item ${id}`, error);
    throw error;
  }
};

// Toggle menu item availability
export const toggleMenuItemAvailability = async (id) => {
  try {
    logDebug(`Toggling availability for menu item ${id}`);
    const response = await api.patch(`/menu-items/${id}/toggle-availability`);
    logDebug('Menu item availability toggled successfully', response.data);
    return response.data;
  } catch (error) {
    logDebug(`Error toggling menu item availability ${id}`, error);
    throw error;
  }
}; 
 
 
 
 