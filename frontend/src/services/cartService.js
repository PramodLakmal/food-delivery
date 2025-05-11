import api from './api';

/**
 * Add an item to the user's cart
 * @param {Object} cartItem - Cart item to add
 * @param {string} cartItem.menuItemId - Menu item ID
 * @param {number} cartItem.quantity - Quantity to add
 * @returns {Promise<Object>} - Updated cart
 */
export const addToCart = async (cartItem) => {
  try {
    const response = await api.post('/cart/items', cartItem);
    return response.data;
  } catch (error) {
    console.error('Error adding item to cart:', error);
    throw error;
  }
};

/**
 * Get the current user's cart
 * @returns {Promise<Object>} - User's cart with items
 */
export const getCart = async () => {
  try {
    const response = await api.get('/cart');
    return response.data;
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }
};

/**
 * Update cart item quantity
 * @param {string} itemId - Cart item ID
 * @param {number} quantity - New quantity
 * @returns {Promise<Object>} - Updated cart
 */
export const updateCartItemQuantity = async (itemId, quantity) => {
  try {
    const response = await api.patch(`/cart/items/${itemId}`, { quantity });
    return response.data;
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw error;
  }
};

/**
 * Remove an item from the cart
 * @param {string} itemId - Cart item ID
 * @returns {Promise<Object>} - Updated cart
 */
export const removeCartItem = async (itemId) => {
  try {
    const response = await api.delete(`/cart/items/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing item from cart:', error);
    throw error;
  }
};

/**
 * Clear the entire cart
 * @returns {Promise<Object>} - Empty cart
 */
export const clearCart = async () => {
  try {
    const response = await api.delete('/cart');
    return response.data;
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
}; 
 
 
 
 