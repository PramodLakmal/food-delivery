const DeliveryPerson = require('../models/DeliveryPerson');
const config = require('../config');

/**
 * Calculate distance between two points using Haversine formula
 * @param {Object} point1 - First point with latitude and longitude
 * @param {Object} point2 - Second point with latitude and longitude
 * @returns {Number} Distance in kilometers
 */
function calculateDistance(point1, point2) {
  const toRad = (value) => (value * Math.PI) / 180;
  
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) * Math.cos(toRad(point2.latitude)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Find the nearest available delivery person to a given location
 * @param {Object} location - The location to find the nearest delivery person to
 * @param {number} location.latitude - The latitude of the location
 * @param {number} location.longitude - The longitude of the location
 * @param {number} maxDistance - Maximum distance in meters (default from config)
 * @returns {Promise<Object|null>} - The nearest delivery person or null if none found
 */
const findNearestDeliveryPerson = async (location, maxDistance = config.deliveryAssignment.maxDistance) => {
  try {
    if (!location || !location.latitude || !location.longitude) {
      throw new Error('Invalid location provided');
    }

    // Find available delivery persons within the specified distance
    const nearestDeliveryPersons = await DeliveryPerson.find({
      isAvailable: true,
      isActive: true,
      'currentLocation.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)]
          },
          $maxDistance: maxDistance
        }
      }
    }).limit(5);

    if (nearestDeliveryPersons.length === 0) {
      console.log('No available delivery persons found within the specified distance');
      return null;
    }

    // For now, simply return the nearest one (first in the results)
    // This could be enhanced with more sophisticated algorithms that consider:
    // - Delivery person ratings
    // - Current workload/fatigue
    // - Vehicle type and capacity
    // - Traffic conditions
    // - Estimated time of arrival
    return nearestDeliveryPersons[0];
  } catch (error) {
    console.error('Error finding nearest delivery person:', error);
    return null;
  }
};

/**
 * Calculate the estimated delivery time based on restaurant location and delivery address
 * @param {Object} restaurantLocation - The restaurant location
 * @param {Object} deliveryAddress - The delivery address
 * @returns {Date} - The estimated delivery time
 */
const calculateEstimatedDeliveryTime = (restaurantLocation, deliveryAddress) => {
  // Simple calculation for now
  // This would be enhanced with actual distance calculation and traffic consideration
  const now = new Date();
  
  // Assume 30 minutes for preparation
  const preparationTimeMinutes = 30;
  
  // Assume 20 minutes for delivery
  const deliveryTimeMinutes = 20;
  
  // Add preparation and delivery time
  now.setMinutes(now.getMinutes() + preparationTimeMinutes + deliveryTimeMinutes);
  
  return now;
};

module.exports = {
  calculateDistance,
  findNearestDeliveryPerson,
  calculateEstimatedDeliveryTime
}; 