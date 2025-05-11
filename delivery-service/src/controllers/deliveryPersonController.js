const { StatusCodes } = require('http-status-codes');
const DeliveryPerson = require('../models/DeliveryPerson');
const Delivery = require('../models/Delivery');
const { publishMessage } = require('../utils/messageBroker');
const axios = require('axios');
const config = require('../config');

// Get delivery person profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find delivery person by userId
    let deliveryPerson = await DeliveryPerson.findOne({ userId });
    
    // If no profile exists, initialize one
    if (!deliveryPerson) {
      try {
        deliveryPerson = await initializeProfile(req.user);
        return res.status(StatusCodes.OK).json({
          success: true,
          data: deliveryPerson,
          message: 'Profile initialized. Please complete your profile.'
        });
      } catch (initError) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Failed to initialize delivery person profile',
          error: initError.message
        });
      }
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: deliveryPerson
    });
  } catch (error) {
    console.error('Error getting delivery person profile:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get delivery person profile',
      error: error.message
    });
  }
};

// Initialize profile for a new delivery person
const initializeProfile = async (user) => {
  console.log("Initializing profile with user data:", user);
  
  // Create a new delivery person record with only the required fields
  const deliveryPerson = new DeliveryPerson({
    userId: user.id,
    name: user.name || 'Delivery Driver',
    email: user.email || '',
    phone: user.phone || '',
    isAvailable: true,
    isActive: true,
    isVerified: false,
    isProfileComplete: false
  });
  
  try {
    await deliveryPerson.save();
    console.log(`Created new delivery person record for user ${user.id}`);
    return deliveryPerson;
  } catch (error) {
    console.error("Error saving new delivery person:", error);
    throw error;
  }
};

// Complete delivery person profile
const completeProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { vehicle, license, phone } = req.body;
    
    console.log("Complete profile request body:", req.body);
    console.log("Phone value:", phone, typeof phone);
    console.log("User data:", req.user);
    
    // Validate phone
    if (!phone || phone.trim() === '') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    // Find delivery person by userId
    let deliveryPerson = await DeliveryPerson.findOne({ userId });
    
    // If no profile exists, initialize one
    if (!deliveryPerson) {
      try {
        // Create a complete user object with all required fields
        const userData = {
          id: req.user.id,
          name: req.user.name || 'Delivery Driver',
          email: req.user.email || '',
          phone: phone
        };
        
        console.log("Creating new profile with data:", userData);
        deliveryPerson = await initializeProfile(userData);
      } catch (initError) {
        console.error('Profile initialization error:', initError);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Failed to initialize delivery person profile',
          error: initError.message
        });
      }
    } else {
      // Update existing profile's phone
      deliveryPerson.phone = phone;
    }
    
    // If vehicle and license info is provided, validate and update
    if (vehicle && license) {
      // Validate vehicle fields
      if (!vehicle.type || !vehicle.model || !vehicle.color || !vehicle.licensePlate) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Vehicle type, model, color, and license plate are required'
        });
      }
      
      // Validate license fields
      if (!license.number || !license.expiryDate) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'License number and expiry date are required'
        });
      }
      
      // Update profile with vehicle and license info
      deliveryPerson.vehicle = {
        type: vehicle.type,
        model: vehicle.model,
        color: vehicle.color,
        licensePlate: vehicle.licensePlate
      };
      
      deliveryPerson.license = {
        number: license.number,
        expiryDate: new Date(license.expiryDate),
        verified: false
      };
      
      // Mark profile as complete
      deliveryPerson.isProfileComplete = true;
      
      // Update user profile in user service to mark profile as complete
      try {
        await axios.put(`${config.userServiceUrl}/users/${userId}`, {
          isProfileComplete: true,
          phone: phone // Update phone in user service as well
        }, {
          headers: {
            Authorization: req.headers.authorization
          }
        });
      } catch (userUpdateError) {
        console.error('Error updating user profile:', userUpdateError);
        // Continue despite error updating user service
      }
      
      // Publish profile updated event
      await publishMessage('delivery_person.profile_updated', {
        deliveryPersonId: deliveryPerson._id,
        userId,
        status: 'pending_verification'
      });
    }
    
    try {
      console.log("Saving delivery person profile:", deliveryPerson);
      await deliveryPerson.save();
      
      res.status(StatusCodes.OK).json({
        success: true,
        message: vehicle && license ? 'Profile completed successfully. Pending verification.' : 'Profile initialized successfully.',
        data: deliveryPerson
      });
    } catch (saveError) {
      console.error('Error saving delivery person profile:', saveError);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to save profile',
        error: saveError.message
      });
    }
  } catch (error) {
    console.error('Error completing delivery person profile:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to complete profile',
      error: error.message
    });
  }
};

// Update current location
const updateLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;
    
    // Validate location data
    if (!latitude || !longitude) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    // Find delivery person by userId
    const deliveryPerson = await DeliveryPerson.findOne({ userId });
    
    if (!deliveryPerson) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Delivery person profile not found'
      });
    }
    
    // Update location
    deliveryPerson.currentLocation = {
      latitude,
      longitude,
      updatedAt: new Date()
    };
    
    await deliveryPerson.save();
    
    // If delivery person has an active delivery, update the delivery tracking
    if (deliveryPerson.currentOrderId) {
      const delivery = await Delivery.findById(deliveryPerson.currentOrderId);
      
      if (delivery) {
        // Add location to tracking history
        delivery.trackingHistory.push({
          status: delivery.status,
          location: {
            latitude,
            longitude
          },
          timestamp: new Date(),
          note: 'Location updated'
        });
        
        await delivery.save();
      }
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};

// Get current delivery
const getCurrentDelivery = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find delivery person by userId
    const deliveryPerson = await DeliveryPerson.findOne({ userId });
    
    if (!deliveryPerson) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Delivery person profile not found'
      });
    }
    
    // Check if delivery person has an active delivery
    if (!deliveryPerson.currentOrderId) {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'No active delivery',
        data: null
      });
    }
    
    // Get delivery details with populated delivery person
    const delivery = await Delivery.findById(deliveryPerson.currentOrderId)
      .populate('deliveryPersonId', 'name phone currentLocation');
    
    if (!delivery) {
      // Reset current order ID if delivery not found
      deliveryPerson.currentOrderId = null;
      await deliveryPerson.save();
      
      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'No active delivery',
        data: null
      });
    }

    // Get order details from order service
    try {
      const orderResponse = await axios.get(`${config.orderServiceUrl}/orders/${delivery.orderId}`, {
        headers: {
          Authorization: req.headers.authorization
        }
      });
      const orderData = orderResponse.data.data || orderResponse.data;
      
      // Format the delivery data with order details
      const deliveryWithOrder = {
        ...delivery.toObject(),
        order: {
          ...orderData,
          restaurant: {
            name: delivery.restaurantName,
            address: delivery.pickupLocation.address
          },
          customer: {
            name: delivery.customerName,
            phone: delivery.customerPhone
          },
          deliveryAddress: {
            street: delivery.dropoffLocation.address,
            city: orderData.deliveryAddress?.city || '',
            state: orderData.deliveryAddress?.state || '',
            zipCode: orderData.deliveryAddress?.zipCode || ''
          }
        }
      };
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: deliveryWithOrder
      });
    } catch (orderError) {
      console.error('Error fetching order details:', orderError);
      // If order fetch fails, return delivery data with basic order info
      const deliveryWithBasicOrder = {
        ...delivery.toObject(),
        order: {
          restaurant: {
            name: delivery.restaurantName,
            address: delivery.pickupLocation.address
          },
          customer: {
            name: delivery.customerName,
            phone: delivery.customerPhone
          },
          deliveryAddress: {
            street: delivery.dropoffLocation.address
          }
        }
      };
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: deliveryWithBasicOrder
      });
    }
  } catch (error) {
    console.error('Error getting current delivery:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get current delivery',
      error: error.message
    });
  }
};

// Update delivery status
const updateDeliveryStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deliveryId } = req.params;
    const { status, latitude, longitude } = req.body;
    
    // Validate status
    const validStatuses = ['picked_up', 'in_transit', 'delivered', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    // Find delivery person by userId
    const deliveryPerson = await DeliveryPerson.findOne({ userId });
    
    if (!deliveryPerson) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Delivery person profile not found'
      });
    }
    
    // Find delivery by ID
    const delivery = await Delivery.findById(deliveryId);
    
    if (!delivery) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Delivery not found'
      });
    }
    
    // Ensure delivery is assigned to this delivery person
    if (delivery.deliveryPersonId.toString() !== deliveryPerson._id.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Not authorized to update this delivery'
      });
    }

    // If status is being updated to picked_up, check if order is ready
    if (status === 'picked_up') {
      try {
        // Get order details from order service with authorization header
        const orderResponse = await axios.get(`${config.orderServiceUrl}/orders/${delivery.orderId}`, {
          headers: {
            Authorization: req.headers.authorization
          }
        });
        const orderData = orderResponse.data.data || orderResponse.data;

        if (!orderData) {
          return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: 'Order not found'
          });
        }

        // Check if order status is ready
        if (orderData.status !== 'ready') {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Cannot pick up order that is not ready'
          });
        }
      } catch (error) {
        console.error('Error checking order status:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Failed to verify order status',
          error: error.message
        });
      }
    }
    
    // Update delivery status
    delivery.status = status;
    
    // Update timestamps based on status
    if (status === 'picked_up') {
      delivery.pickedUpAt = new Date();
    } else if (status === 'delivered') {
      delivery.deliveredAt = new Date();
      delivery.actualDeliveryTime = new Date();
      
      // Free up the delivery person
      deliveryPerson.isAvailable = true;
      deliveryPerson.currentOrderId = null;
      await deliveryPerson.save();
    }
    
    // Add to tracking history
    delivery.trackingHistory.push({
      status,
      location: latitude && longitude ? { latitude, longitude } : undefined,
      timestamp: new Date(),
      note: `Status updated to ${status}`
    });
    
    await delivery.save();
    
    // Publish delivery status updated event
    await publishMessage('delivery.status_updated', {
      deliveryId: delivery._id,
      orderId: delivery.orderId,
      orderNumber: delivery.orderNumber,
      status,
      deliveryPersonId: deliveryPerson._id,
      deliveryPersonName: deliveryPerson.name
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Delivery status updated successfully',
      data: delivery
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update delivery status',
      error: error.message
    });
  }
};

// Get delivery history
const getDeliveryHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    
    // Find delivery person by userId
    const deliveryPerson = await DeliveryPerson.findOne({ userId });
    
    if (!deliveryPerson) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Delivery person profile not found'
      });
    }
    
    // Get completed deliveries
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const deliveries = await Delivery.find({
      deliveryPersonId: deliveryPerson._id,
      status: { $in: ['delivered', 'failed', 'cancelled'] }
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalDeliveries = await Delivery.countDocuments({
      deliveryPersonId: deliveryPerson._id,
      status: { $in: ['delivered', 'failed', 'cancelled'] }
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: deliveries,
      pagination: {
        total: totalDeliveries,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalDeliveries / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting delivery history:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get delivery history',
      error: error.message
    });
  }
};

// Toggle availability
const toggleAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isAvailable } = req.body;
    
    // Validate isAvailable
    if (typeof isAvailable !== 'boolean') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'isAvailable must be a boolean'
      });
    }
    
    // Find delivery person by userId
    const deliveryPerson = await DeliveryPerson.findOne({ userId });
    
    if (!deliveryPerson) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Delivery person profile not found'
      });
    }
    
    // Check if delivery person has an active delivery
    if (deliveryPerson.currentOrderId && isAvailable === false) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Cannot change availability while having an active delivery'
      });
    }
    
    // Update availability
    deliveryPerson.isAvailable = isAvailable;
    await deliveryPerson.save();
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Availability ${isAvailable ? 'enabled' : 'disabled'} successfully`,
      data: { isAvailable }
    });
  } catch (error) {
    console.error('Error toggling availability:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to toggle availability',
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  completeProfile,
  updateLocation,
  getCurrentDelivery,
  updateDeliveryStatus,
  getDeliveryHistory,
  toggleAvailability,
  initializeProfile
}; 