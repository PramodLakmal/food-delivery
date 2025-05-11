import api, { deliveryApi } from './api';

/**
 * Get the delivery person's profile
 * @returns {Promise} Promise object with delivery person profile
 */
export const getDeliveryPersonProfile = async () => {
  try {
    console.log("Fetching delivery person profile...");
    const response = await deliveryApi.get('/delivery-persons/profile');
    console.log("Profile response:", response.data);
    
    // Check if this is a profile initialization response
    if (response.data.message && 
        (response.data.message.includes('Profile initialized') || 
         response.data.message.includes('complete your profile'))) {
      // Return the response directly so the component can handle the message
      return {
        data: response.data.data,
        message: response.data.message,
        needsCompletion: true
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching delivery person profile:', error);
    
    // If it's a 500 error, it might be that the profile needs to be initialized
    // Return a response that will trigger the complete profile flow
    if (error.response) {
      console.log("Error response status:", error.response.status);
      console.log("Error response data:", error.response.data);
      
      if (error.response.status === 500 || error.response.status === 404) {
        return {
          data: null,
          message: 'Please complete your profile',
          needsCompletion: true
        };
      }
    }
    
    throw error;
  }
};

/**
 * Complete the delivery person's profile
 * @param {Object} profileData - The profile data to update
 * @returns {Promise} Promise object with updated profile
 */
export const completeProfile = async (profileData) => {
  try {
    console.log("Sending profile data to server:", profileData);
    
    // Make sure phone is not nested and is at the top level
    const formattedData = {
      ...profileData,
      phone: profileData.phone ? String(profileData.phone).trim() : '', // Ensure phone is a string and trimmed
      vehicle: {
        ...profileData.vehicle,
        // Ensure vehicle fields are properly formatted
        type: profileData.vehicle.type,
        model: profileData.vehicle.model,
        color: profileData.vehicle.color,
        licensePlate: profileData.vehicle.licensePlate
      },
      license: {
        ...profileData.license,
        // Ensure license fields are properly formatted
        number: profileData.license.number,
        expiryDate: profileData.license.expiryDate
      }
    };
    
    console.log("Formatted data being sent:", formattedData);
    const response = await deliveryApi.post('/delivery-persons/complete-profile', formattedData);
    console.log("Complete profile response:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error completing profile:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

/**
 * Update the delivery person's current location
 * @param {Object} locationData - The location data with latitude and longitude
 * @returns {Promise} Promise object with update status
 */
export const updateLocation = async (locationData) => {
  try {
    const response = await deliveryApi.post('/delivery-persons/location', locationData);
    return response.data;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

/**
 * Get the delivery person's current delivery
 * @returns {Promise} Promise object with current delivery data
 */
export const getCurrentDelivery = async () => {
  try {
    const response = await deliveryApi.get('/delivery-persons/current-delivery');
    return response.data;
  } catch (error) {
    console.error('Error fetching current delivery:', error);
    throw error;
  }
};

/**
 * Update the status of a delivery
 * @param {string} deliveryId - The ID of the delivery to update
 * @param {string} status - The new status
 * @param {Object} locationData - Optional location data
 * @returns {Promise} Promise object with updated delivery
 */
export const updateDeliveryStatus = async (deliveryId, status, locationData = null) => {
  try {
    const payload = { status };
    if (locationData) {
      payload.location = locationData;
    }
    const response = await deliveryApi.put(`/delivery-persons/deliveries/${deliveryId}/status`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating delivery status:', error);
    throw error;
  }
};

/**
 * Get the delivery person's delivery history
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of items per page
 * @returns {Promise} Promise object with delivery history
 */
export const getDeliveryHistory = async (page = 1, limit = 10) => {
  try {
    const response = await deliveryApi.get(`/delivery-persons/history?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching delivery history:', error);
    throw error;
  }
};

/**
 * Toggle the delivery person's availability status
 * @param {boolean} isAvailable - Whether the delivery person is available
 * @returns {Promise} Promise object with updated availability status
 */
export const toggleAvailability = async (isAvailable) => {
  try {
    const response = await deliveryApi.put('/delivery-persons/availability', { isAvailable });
    return response.data;
  } catch (error) {
    console.error('Error toggling availability:', error);
    throw error;
  }
};

/**
 * Get delivery by ID
 * @param {string} deliveryId - The ID of the delivery
 * @returns {Promise} Promise object with delivery data
 */
export const getDeliveryById = async (deliveryId) => {
  try {
    const response = await deliveryApi.get(`/deliveries/${deliveryId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching delivery:', error);
    throw error;
  }
};

/**
 * Get delivery tracking information
 * @param {string} deliveryId - The ID of the delivery
 * @returns {Promise} Promise object with tracking data
 */
export const getDeliveryTracking = async (deliveryId) => {
  try {
    const response = await deliveryApi.get(`/deliveries/${deliveryId}/tracking`);
    return response.data;
  } catch (error) {
    console.error('Error fetching delivery tracking:', error);
    throw error;
  }
};

/**
 * Get delivery by order ID
 * @param {string} orderId - The ID of the order
 * @returns {Promise} Promise object with delivery data
 */
export const getDeliveryByOrderId = async (orderId) => {
  try {
    const response = await deliveryApi.get(`/deliveries/order/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching delivery by order ID:', error);
    // We're not throwing the error here as not all orders have deliveries
    return null;
  }
}; 