const { StatusCodes } = require('http-status-codes');
const Delivery = require('../models/Delivery');
const DeliveryPerson = require('../models/DeliveryPerson');
const { publishMessage } = require('../utils/messageBroker');
const { calculateDistance, findNearestDeliveryPerson, calculateEstimatedDeliveryTime } = require('../utils/assignmentAlgorithm');
const mongoose = require('mongoose');
const axios = require('axios');
const config = require('../config');

// Get delivery by ID
const getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.deliveryId)
      .populate('deliveryPersonId', 'name phone currentLocation');
    
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    res.status(200).json(delivery);
  } catch (error) {
    console.error('Error getting delivery:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get delivery by order ID
const getDeliveryByOrderId = async (req, res) => {
  try {
    const delivery = await Delivery.findOne({ orderId: req.params.orderId })
      .populate('deliveryPersonId', 'name phone currentLocation');
    
    if (!delivery) {
      return res.status(404).json({ message: 'No delivery found for this order' });
    }

    res.status(200).json(delivery);
  } catch (error) {
    console.error('Error getting delivery by order ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get delivery tracking information
const getDeliveryTracking = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.deliveryId)
      .populate('deliveryPersonId', 'name phone currentLocation');
    
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Format tracking information
    const trackingInfo = {
      deliveryId: delivery._id,
      status: delivery.status,
      estimatedDeliveryTime: delivery.estimatedDeliveryTime,
      actualDeliveryTime: delivery.actualDeliveryTime,
      deliveryAddress: delivery.dropoffLocation,
      deliveryPerson: delivery.deliveryPersonId ? {
        name: delivery.deliveryPersonId.name,
        phone: delivery.deliveryPersonId.phone,
        currentLocation: delivery.deliveryPersonId.currentLocation
      } : null,
      statusHistory: delivery.trackingHistory
    };

    res.status(200).json(trackingInfo);
  } catch (error) {
    console.error('Error getting delivery tracking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Assign delivery person to delivery
const assignDeliveryPerson = async (req, res) => {
  try {
    const { deliveryPersonId } = req.body;
    
    if (!deliveryPersonId) {
      return res.status(400).json({ message: 'Delivery person ID is required' });
    }

    const deliveryPerson = await DeliveryPerson.findById(deliveryPersonId);
    if (!deliveryPerson) {
      return res.status(404).json({ message: 'Delivery person not found' });
    }

    if (!deliveryPerson.isAvailable) {
      return res.status(400).json({ message: 'Delivery person is not available' });
    }

    const delivery = await Delivery.findById(req.params.deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    if (delivery.deliveryPerson) {
      return res.status(400).json({ message: 'Delivery already has an assigned delivery person' });
    }

    // Update delivery with assigned delivery person
    delivery.deliveryPerson = deliveryPersonId;
    delivery.status = 'assigned';
    delivery.statusHistory.push({
      status: 'assigned',
      timestamp: new Date(),
      note: `Assigned to ${deliveryPerson.name}`
    });
    await delivery.save();

    // Update delivery person availability
    deliveryPerson.isAvailable = false;
    deliveryPerson.currentDelivery = delivery._id;
    await deliveryPerson.save();

    // Notify the delivery person about the new assignment
    publishMessage('delivery.assigned', {
      deliveryId: delivery._id,
      deliveryPersonId: deliveryPerson._id,
      orderId: delivery.order
    });

    res.status(200).json({ 
      message: 'Delivery person assigned successfully',
      delivery
    });
  } catch (error) {
    console.error('Error assigning delivery person:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Find nearest delivery person
const findNearest = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10000 } = req.body; // maxDistance in meters, default 10km
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Find available delivery persons within the specified distance
    const nearestDeliveryPersons = await DeliveryPerson.find({
      isAvailable: true,
      isActive: true,
      'currentLocation.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: maxDistance
        }
      }
    }).limit(5);

    if (nearestDeliveryPersons.length === 0) {
      return res.status(404).json({ message: 'No available delivery persons found nearby' });
    }

    res.status(200).json(nearestDeliveryPersons);
  } catch (error) {
    console.error('Error finding nearest delivery person:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all active deliveries (admin only)
const getActiveDeliveries = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    } else {
      // By default, get all active deliveries (not completed or cancelled)
      query.status = { $nin: ['delivered', 'cancelled'] };
    }

    const deliveries = await Delivery.find(query)
      .populate('deliveryPersonId', 'name phoneNumber currentLocation')
      .sort({ createdAt: -1 });

    res.status(200).json(deliveries);
  } catch (error) {
    console.error('Error getting active deliveries:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get restaurant deliveries
const getRestaurantDeliveries = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status, startDate, endDate } = req.query;
    
    // Check if user has permission for this restaurant
    if (req.user.role === 'restaurant_admin' && 
        (!req.user.restaurant || req.user.restaurant.toString() !== restaurantId)) {
      return res.status(403).json({ message: 'Not authorized to access deliveries for this restaurant' });
    }

    // Build query
    let query = {};
    
    // Get orders from order service
    const orderResponse = await axios.get(`${config.orderServiceUrl}/api/orders/restaurant/${restaurantId}`, {
      headers: { Authorization: req.headers.authorization }
    });
    
    const orderIds = orderResponse.data.map(order => order._id);
    
    query.order = { $in: orderIds };
    
    if (status) {
      query.status = status;
    }
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const deliveries = await Delivery.find(query)
      .populate('deliveryPersonId', 'name phoneNumber currentLocation')
      .sort({ createdAt: -1 });

    res.status(200).json(deliveries);
  } catch (error) {
    console.error('Error getting restaurant deliveries:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Automatically assign delivery to nearest available delivery person
const assignDelivery = async (deliveryId) => {
  try {
    console.log(`Attempting to assign delivery ${deliveryId} automatically`);
    
    // Get the delivery details
    const delivery = await Delivery.findById(deliveryId);
    
    if (!delivery) {
      console.error(`Delivery ${deliveryId} not found`);
      return { success: false, message: 'Delivery not found' };
    }
    
    // Check if delivery is already assigned
    if (delivery.deliveryPersonId) {
      console.log(`Delivery ${deliveryId} is already assigned to ${delivery.deliveryPersonId}`);
      return { success: false, message: 'Delivery already assigned' };
    }
    
    // Get pickup location coordinates
    const pickupCoordinates = delivery.pickupLocation.coordinates;
    
    if (!pickupCoordinates || !pickupCoordinates.latitude || !pickupCoordinates.longitude) {
      console.error(`Delivery ${deliveryId} has invalid pickup coordinates`);
      return { success: false, message: 'Invalid pickup coordinates' };
    }
    
    // Find available delivery persons
    const availableDeliveryPersons = await DeliveryPerson.find({
      isAvailable: true,
      isActive: true,
      isVerified: true,
      isProfileComplete: true,
      currentOrderId: null
    });
    
    if (availableDeliveryPersons.length === 0) {
      console.log('No available delivery persons found');
      return { success: false, message: 'No available delivery persons' };
    }
    
    console.log(`Found ${availableDeliveryPersons.length} available delivery persons`);
    
    // Calculate distance for each delivery person and sort by proximity
    const deliveryPersonsWithDistance = availableDeliveryPersons
      .filter(dp => dp.currentLocation && dp.currentLocation.latitude && dp.currentLocation.longitude)
      .map(dp => {
        // Use the imported calculateDistance function
        const distance = calculateDistance(
          { latitude: pickupCoordinates.latitude, longitude: pickupCoordinates.longitude },
          { latitude: dp.currentLocation.latitude, longitude: dp.currentLocation.longitude }
        );
        
        return {
          deliveryPerson: dp,
          distance
        };
      })
      .sort((a, b) => a.distance - b.distance);
    
    // If no delivery persons have location data, select randomly
    if (deliveryPersonsWithDistance.length === 0) {
      const randomIndex = Math.floor(Math.random() * availableDeliveryPersons.length);
      const selectedDeliveryPerson = availableDeliveryPersons[randomIndex];
      
      return await assignDeliveryToPerson(delivery, selectedDeliveryPerson);
    }
    
    // Select the closest delivery person
    const closestDeliveryPerson = deliveryPersonsWithDistance[0].deliveryPerson;
    console.log(`Selected delivery person ${closestDeliveryPerson._id} at distance ${deliveryPersonsWithDistance[0].distance.toFixed(2)} km`);
    
    // Assign the delivery
    return await assignDeliveryToPerson(delivery, closestDeliveryPerson);
  } catch (error) {
    console.error('Error assigning delivery:', error);
    return { success: false, message: 'Error assigning delivery', error: error.message };
  }
};

// Helper function to assign delivery to a specific delivery person
const assignDeliveryToPerson = async (delivery, deliveryPerson) => {
  try {
    // Update delivery with assigned delivery person
    delivery.deliveryPersonId = deliveryPerson._id;
    delivery.deliveryPersonName = deliveryPerson.name;
    delivery.deliveryPersonPhone = deliveryPerson.phone;
    delivery.status = 'assigned';
    delivery.assignedAt = new Date();
    
    // Add to tracking history
    delivery.trackingHistory.push({
      status: 'assigned',
      timestamp: new Date(),
      note: `Assigned to ${deliveryPerson.name}`
    });
    
    await delivery.save();
    
    // Update delivery person status
    deliveryPerson.isAvailable = false;
    deliveryPerson.currentOrderId = delivery._id;
    await deliveryPerson.save();
    
    // Publish delivery assigned event
    await publishMessage('delivery.assigned', {
      deliveryId: delivery._id,
      orderId: delivery.orderId,
      deliveryPersonId: deliveryPerson._id,
      deliveryPersonName: deliveryPerson.name,
      estimatedDeliveryTime: delivery.estimatedDeliveryTime
    });
    
    console.log(`Delivery ${delivery._id} assigned to ${deliveryPerson.name} (${deliveryPerson._id})`);
    
    return { 
      success: true, 
      message: 'Delivery assigned successfully',
      deliveryPersonId: deliveryPerson._id,
      deliveryPersonName: deliveryPerson.name
    };
  } catch (error) {
    console.error('Error in assignDeliveryToPerson:', error);
    return { success: false, message: 'Error assigning delivery', error: error.message };
  }
};

// Add endpoint to manually trigger assignment for a delivery
const manuallyAssignDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    
    const result = await assignDelivery(deliveryId);
    
    if (result.success) {
      res.status(StatusCodes.OK).json({
        success: true,
        message: result.message,
        data: {
          deliveryPersonId: result.deliveryPersonId,
          deliveryPersonName: result.deliveryPersonName
        }
      });
    } else {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error manually assigning delivery:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to assign delivery',
      error: error.message
    });
  }
};

// Get available delivery persons for manual assignment
const getAvailableDeliveryPersons = async (req, res) => {
  try {
    // Find all available, active, verified and profile-complete delivery persons
    const availableDeliveryPersons = await DeliveryPerson.find({
      isAvailable: true,
      isActive: true,
      isVerified: true,
      isProfileComplete: true,
      currentOrderId: null
    }).select('name phone currentLocation vehicle ratings');
    
    if (availableDeliveryPersons.length === 0) {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'No available delivery persons found',
        data: []
      });
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Found ${availableDeliveryPersons.length} available delivery persons`,
      data: availableDeliveryPersons
    });
  } catch (error) {
    console.error('Error getting available delivery persons:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get available delivery persons',
      error: error.message
    });
  }
};

// Manually assign a specific delivery person to a delivery
const manuallyAssignSpecificDeliveryPerson = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { deliveryPersonId } = req.body;
    
    if (!deliveryPersonId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Delivery person ID is required'
      });
    }
    
    // Get the delivery details
    const delivery = await Delivery.findById(deliveryId);
    
    if (!delivery) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Delivery not found'
      });
    }
    
    // Check if delivery is already assigned
    if (delivery.deliveryPersonId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Delivery already assigned'
      });
    }
    
    // Get the delivery person
    const deliveryPerson = await DeliveryPerson.findById(deliveryPersonId);
    
    if (!deliveryPerson) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Delivery person not found'
      });
    }
    
    // Check if delivery person is available
    if (!deliveryPerson.isAvailable || deliveryPerson.currentOrderId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Delivery person is not available'
      });
    }
    
    // Assign the delivery to the selected person
    const result = await assignDeliveryToPerson(delivery, deliveryPerson);
    
    if (result.success) {
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Delivery assigned successfully',
        data: {
          deliveryPersonId: result.deliveryPersonId,
          deliveryPersonName: result.deliveryPersonName
        }
      });
    } else {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error manually assigning specific delivery person:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to assign delivery person',
      error: error.message
    });
  }
};

// Create a delivery for an order if it doesn't exist
const createDeliveryForOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Order ID is required'
      });
    }
    
    // Check if delivery already exists for this order
    let delivery = await Delivery.findOne({ orderId });
    
    if (delivery) {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Delivery already exists for this order',
        data: delivery
      });
    }
    
    // Get order details from order service
    try {
      // Updated URL to match the correct endpoint
      const orderServiceUrl = `${config.orderServiceUrl}/orders/${orderId}`;
      console.log(`Fetching order details from: ${orderServiceUrl}`);
      
      const orderResponse = await axios.get(orderServiceUrl, {
        headers: {
          Authorization: req.headers.authorization
        }
      });
      
      console.log('Order response:', orderResponse.data);
      
      const orderData = orderResponse.data.data || orderResponse.data;
      
      if (!orderData) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      if (!orderData.deliveryAddress) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Order does not have a delivery address'
        });
      }

      // Get restaurant details to get location
      let restaurant;
      try {
        const restaurantResponse = await axios.get(`${config.restaurantServiceUrl}/restaurants/${orderData.restaurantId}`, {
          headers: {
            Authorization: req.headers.authorization
          }
        });
        restaurant = restaurantResponse.data;
        console.log('Restaurant data:', restaurant);
      } catch (error) {
        console.error(`Error fetching restaurant details for ${orderData.restaurantId}:`, error);
        restaurant = null;
      }
      
      // Format delivery address as a string
      let deliveryAddressString = '';
      if (typeof orderData.deliveryAddress === 'object') {
        deliveryAddressString = `${orderData.deliveryAddress.street}, ${orderData.deliveryAddress.city}, ${orderData.deliveryAddress.state} ${orderData.deliveryAddress.zipCode}`;
      } else {
        deliveryAddressString = orderData.deliveryAddress;
      }
      
      // Format restaurant address as a string
      let restaurantAddressString = 'Restaurant Address';
      if (restaurant?.address) {
        restaurantAddressString = restaurant.address;
      }
      
      // Get restaurant coordinates
      let restaurantCoordinates = { latitude: 0, longitude: 0 };
      if (restaurant?.location?.coordinates && Array.isArray(restaurant.location.coordinates) && restaurant.location.coordinates.length === 2) {
        // Restaurant service stores coordinates as [longitude, latitude]
        restaurantCoordinates = {
          longitude: restaurant.location.coordinates[0],
          latitude: restaurant.location.coordinates[1]
        };
      }
      
      // Create new delivery
      const newDelivery = new Delivery({
        orderId,
        orderNumber: orderData.orderNumber,
        restaurantId: orderData.restaurantId,
        restaurantName: restaurant?.name || orderData.restaurantName || 'Restaurant',
        status: 'pending_assignment',
        pickupLocation: {
          address: restaurantAddressString,
          coordinates: restaurantCoordinates
        },
        dropoffLocation: {
          address: deliveryAddressString,
          coordinates: {
            latitude: orderData.deliveryAddress?.latitude || 0,
            longitude: orderData.deliveryAddress?.longitude || 0
          }
        },
        customerName: orderData.customerName || 'Customer',
        customerPhone: orderData.contactPhone || 'N/A',
        items: orderData.items?.map(item => ({
          name: item.name,
          quantity: item.quantity
        })) || [],
        trackingHistory: [{
          status: 'pending_assignment',
          timestamp: new Date(),
          note: 'Delivery created'
        }]
      });
      
      await newDelivery.save();
      console.log('New delivery created:', newDelivery._id);
      
      return res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Delivery created successfully',
        data: newDelivery
      });
    } catch (error) {
      console.error('Error fetching order details:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch order details',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Error creating delivery for order:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to create delivery for order',
      error: error.message
    });
  }
};

module.exports = {
  getDeliveryById,
  getDeliveryByOrderId,
  getDeliveryTracking,
  assignDeliveryPerson,
  findNearest,
  getActiveDeliveries,
  getRestaurantDeliveries,
  assignDelivery,
  manuallyAssignDelivery,
  getAvailableDeliveryPersons,
  manuallyAssignSpecificDeliveryPerson,
  createDeliveryForOrder
}; 