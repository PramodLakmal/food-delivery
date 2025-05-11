import api from './api';

// Get user's cart
export const getUserCart = async () => {
  try {
    const response = await api.get('/cart');
    return response.data;
  } catch (error) {
    console.error('Error getting user cart:', error);
    throw error;
  }
};

// Add item to cart
export const addToCart = async (cartItem) => {
  try {
    const response = await api.post('/cart/add', cartItem);
    return response.data;
  } catch (error) {
    console.error('Error adding item to cart:', error);
    throw error;
  }
};

// Update cart item
export const updateCartItem = async (itemId, updates) => {
  try {
    const response = await api.put(`/cart/item/${itemId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
};

// Remove item from cart
export const removeFromCart = async (itemId) => {
  try {
    const response = await api.delete(`/cart/item/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing item from cart:', error);
    throw error;
  }
};

// Clear cart
export const clearCart = async () => {
  try {
    const response = await api.delete('/cart/clear');
    return response.data;
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

// Create order
export const createOrder = async (orderData) => {
  try {
    const response = await api.post('/orders', orderData);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Get user orders
export const getUserOrders = async (params = {}) => {
  try {
    const response = await api.get('/orders/user', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting user orders:', error);
    throw error;
  }
};

// Get restaurant orders
export const getRestaurantOrders = async (restaurantId, params = {}) => {
  try {
    const response = await api.get(`/orders/restaurant/${restaurantId}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error getting restaurant orders:', error);
    throw error;
  }
};

// Get all orders (system admin only)
export const getAllOrders = async (params = {}) => {
  try {
    const response = await api.get('/orders', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting all orders:', error);
    throw error;
  }
};

// Get order by ID
export const getOrderById = async (orderId) => {
  try {
    console.log(`Fetching order with ID: ${orderId}`);
    const response = await api.get(`/orders/${orderId}`);
    console.log(`Order fetched successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId, statusData) => {
  try {
    const response = await api.put(`/orders/${orderId}/status`, statusData);
    return response.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Cancel order
export const cancelOrder = async (orderId, cancellationReason) => {
  try {
    const response = await api.put(`/orders/${orderId}/cancel`, { cancellationReason });
    return response.data;
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
};

// Get restaurant order statistics
export const getRestaurantOrderStats = async (restaurantId) => {
  try {
    const response = await api.get(`/orders/restaurant/${restaurantId}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error getting restaurant order statistics:', error);
    throw error;
  }
};

// Update order details (for customers)
export const updateOrderDetails = async (orderId, orderDetails) => {
  try {
    const response = await api.put(`/orders/${orderId}/details`, orderDetails);
    return response.data;
  } catch (error) {
    console.error('Error updating order details:', error);
    throw error;
  }
};

// Update order delivery information
export const updateOrderDeliveryInfo = async (orderId, deliveryInfo) => {
  try {
    const response = await api.put(`/orders/${orderId}/delivery`, deliveryInfo);
    return response.data;
  } catch (error) {
    console.error('Error updating order delivery information:', error);
    throw error;
  }
}; 