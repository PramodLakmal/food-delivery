const { consumeMessage, publishMessage } = require('../utils/messageBroker');
const Delivery = require('../models/Delivery');
const DeliveryPerson = require('../models/DeliveryPerson');
const axios = require('axios');
const config = require('../config');

// Initialize delivery event listeners
const initDeliveryListeners = () => {
  // Listen for delivery status update events
  consumeMessage('delivery.status.update', async (message) => {
    try {
      console.log('Received delivery status update event:', message);
      const { deliveryId, status, note } = message;
      
      // Find delivery
      const delivery = await Delivery.findById(deliveryId);
      
      if (!delivery) {
        console.log(`Delivery ${deliveryId} not found`);
        return;
      }
      
      // Update delivery status
      delivery.status = status;
      delivery.statusHistory.push({
        status,
        timestamp: new Date(),
        note: note || `Status updated to ${status}`
      });
      
      // If status is delivered, update actual delivery time
      if (status === 'delivered') {
        delivery.actualDeliveryTime = new Date();
        
        // Make delivery person available again
        if (delivery.deliveryPerson) {
          const deliveryPerson = await DeliveryPerson.findById(delivery.deliveryPerson);
          if (deliveryPerson) {
            deliveryPerson.isAvailable = true;
            deliveryPerson.currentDelivery = null;
            await deliveryPerson.save();
          }
        }
        
        // Update order status
        try {
          await axios.put(`${config.orderServiceUrl}/api/orders/${delivery.order}/status`, {
            status: 'delivered'
          });
        } catch (error) {
          console.error(`Error updating order ${delivery.order} status:`, error);
        }
      }
      
      await delivery.save();
      
      // Publish delivery status updated event
      publishMessage('delivery.status.updated', {
        deliveryId: delivery._id,
        orderId: delivery.order,
        status: status
      });
      
      console.log(`Updated delivery ${deliveryId} status to ${status}`);
    } catch (error) {
      console.error('Error processing delivery status update event:', error);
    }
  });
  
  // Listen for delivery person location updates
  consumeMessage('delivery.location.update', async (message) => {
    try {
      console.log('Received delivery person location update:', message);
      const { deliveryPersonId, latitude, longitude } = message;
      
      // Find delivery person
      const deliveryPerson = await DeliveryPerson.findById(deliveryPersonId);
      
      if (!deliveryPerson) {
        console.log(`Delivery person ${deliveryPersonId} not found`);
        return;
      }
      
      // Update location
      deliveryPerson.currentLocation = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
      
      await deliveryPerson.save();
      
      // If delivery person is on an active delivery, publish location update
      if (deliveryPerson.currentDelivery) {
        publishMessage('delivery.tracking.update', {
          deliveryId: deliveryPerson.currentDelivery,
          deliveryPersonId: deliveryPerson._id,
          location: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
          },
          timestamp: new Date()
        });
      }
      
      console.log(`Updated location for delivery person ${deliveryPersonId}`);
    } catch (error) {
      console.error('Error processing delivery person location update:', error);
    }
  });
};

// Initialize listeners
initDeliveryListeners();

module.exports = {
  initDeliveryListeners
}; 