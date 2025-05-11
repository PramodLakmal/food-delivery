const { consumeMessage, publishMessage } = require('../utils/messageBroker');
const Delivery = require('../models/Delivery');
const DeliveryPerson = require('../models/DeliveryPerson');
const { assignDelivery } = require('../controllers/deliveryController');
const { calculateEstimatedDeliveryTime, calculateDistance } = require('../utils/assignmentAlgorithm');
const axios = require('axios');
const config = require('../config');

// Initialize order event listeners
const initOrderListeners = () => {
  // Listen for order confirmed events
  consumeMessage('order.confirmed', async (message) => {
    try {
      console.log('Received order confirmed event:', message);
      const { orderId, orderNumber, restaurantId, deliveryAddress, customer } = message;
      
      // Get restaurant details to get location
      let restaurant;
      try {
        const restaurantResponse = await axios.get(`${config.restaurantServiceUrl}/api/restaurants/${restaurantId}`);
        restaurant = restaurantResponse.data.data;
      } catch (error) {
        console.error(`Error fetching restaurant details for ${restaurantId}:`, error);
        restaurant = { location: { coordinates: { latitude: 0, longitude: 0 } } };
      }
      
      // Get order details
      let order;
      try {
        const orderResponse = await axios.get(`${config.orderServiceUrl}/api/orders/${orderId}`);
        order = orderResponse.data.data;
      } catch (error) {
        console.error(`Error fetching order details for ${orderId}:`, error);
        order = { items: [] };
      }
      
      // Create delivery record
      const delivery = new Delivery({
        orderId: orderId,
        orderNumber: orderNumber || `ORD-${Date.now()}`,
        restaurantId: restaurantId,
        restaurantName: restaurant.name || 'Restaurant',
        customerName: customer?.name || 'Customer',
        customerPhone: customer?.phone || '',
        status: 'pending_assignment',
        pickupLocation: {
          address: restaurant.address || '',
          coordinates: restaurant.location?.coordinates || { latitude: 0, longitude: 0 }
        },
        dropoffLocation: {
          address: deliveryAddress?.address || '',
          coordinates: deliveryAddress?.coordinates || { latitude: 0, longitude: 0 }
        },
        estimatedDeliveryTime: calculateEstimatedDeliveryTime(
          restaurant.location?.coordinates, 
          deliveryAddress?.coordinates
        ),
        items: order.items?.map(item => ({
          name: item.name,
          quantity: item.quantity
        })) || [],
        trackingHistory: [
          {
            status: 'pending_assignment',
            timestamp: new Date(),
            note: 'Delivery created and pending assignment'
          }
        ]
      });
      
      await delivery.save();
      console.log(`Created delivery record for order ${orderId}`);
      
      // Publish delivery created event
      publishMessage('delivery.created', {
        deliveryId: delivery._id,
        orderId: orderId,
        orderNumber: delivery.orderNumber,
        status: 'pending_assignment'
      });
      
      // Auto-assign delivery person if enabled
      if (config.autoAssignmentEnabled !== false) {
        try {
          console.log(`Attempting to auto-assign delivery ${delivery._id}`);
          const assignmentResult = await assignDelivery(delivery._id);
          
          if (assignmentResult.success) {
            console.log(`Successfully auto-assigned delivery ${delivery._id} to ${assignmentResult.deliveryPersonName}`);
          } else {
            console.log(`Could not auto-assign delivery ${delivery._id}: ${assignmentResult.message}`);
          }
        } catch (error) {
          console.error('Error auto-assigning delivery person:', error);
        }
      }
    } catch (error) {
      console.error('Error processing order confirmed event:', error);
    }
  });
  
  // Listen for order cancelled events
  consumeMessage('order.cancelled', async (message) => {
    try {
      console.log('Received order cancelled event:', message);
      const { orderId } = message;
      
      // Find delivery for this order
      const delivery = await Delivery.findOne({ orderId: orderId });
      
      if (!delivery) {
        console.log(`No delivery found for cancelled order ${orderId}`);
        return;
      }
      
      // Update delivery status
      delivery.status = 'cancelled';
      delivery.trackingHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: 'Order was cancelled'
      });
      await delivery.save();
      
      // If delivery person was assigned, make them available again
      if (delivery.deliveryPersonId) {
        const deliveryPerson = await DeliveryPerson.findById(delivery.deliveryPersonId);
        if (deliveryPerson) {
          deliveryPerson.isAvailable = true;
          deliveryPerson.currentOrderId = null;
          await deliveryPerson.save();
          
          // Notify delivery person about cancellation
          publishMessage('delivery.cancelled', {
            deliveryId: delivery._id,
            deliveryPersonId: delivery.deliveryPersonId,
            orderId: orderId
          });
        }
      }
      
      console.log(`Updated delivery ${delivery._id} status to cancelled`);
    } catch (error) {
      console.error('Error processing order cancelled event:', error);
    }
  });
};

module.exports = {
  initOrderListeners
}; 