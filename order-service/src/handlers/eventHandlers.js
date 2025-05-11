const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { publishEvent } = require('../utils/messageBroker');

// Process incoming events from other services
const processEvent = async (routingKey, data) => {
  console.log(`Processing event: ${routingKey}`, data);
  
  try {
    // Handle user events
    if (routingKey.startsWith('user.')) {
      await handleUserEvent(routingKey, data);
    }
    
    // Handle restaurant events
    else if (routingKey.startsWith('restaurant.')) {
      await handleRestaurantEvent(routingKey, data);
    }
    
    // Handle payment events (future implementation)
    else if (routingKey.startsWith('payment.')) {
      await handlePaymentEvent(routingKey, data);
    }
    
  } catch (error) {
    console.error(`Error processing event ${routingKey}:`, error);
  }
};

// Handle user-related events
const handleUserEvent = async (routingKey, data) => {
  switch (routingKey) {
    case 'user.deleted':
      // When a user is deleted, anonymize their orders
      if (data.userId) {
        console.log(`Anonymizing orders for deleted user ${data.userId}`);
        
        await Order.updateMany(
          { user: data.userId },
          { 
            $set: { 
              contactPhone: 'DELETED',
              deliveryAddress: {
                street: 'DELETED',
                city: 'DELETED',
                state: 'DELETED',
                zipCode: 'DELETED'
              },
              specialInstructions: 'User account deleted'
            }
          }
        );
        
        // Delete user's cart
        await Cart.deleteOne({ user: data.userId });
      }
      break;
      
    default:
      console.log(`No handler for user event: ${routingKey}`);
  }
};

// Handle restaurant-related events
const handleRestaurantEvent = async (routingKey, data) => {
  switch (routingKey) {
    case 'restaurant.status_changed':
      // When a restaurant is deactivated, handle pending orders
      if (data.restaurantId && data.isActive === false) {
        console.log(`Restaurant ${data.restaurantId} deactivated, handling pending orders`);
        
        // Find pending orders for this restaurant
        const pendingOrders = await Order.find({
          restaurantId: data.restaurantId,
          status: { $in: ['pending', 'confirmed'] }
        });
        
        // Cancel pending orders
        for (const order of pendingOrders) {
          order.status = 'cancelled';
          order.specialInstructions = 
            `${order.specialInstructions}\n[SYSTEM] Order cancelled due to restaurant deactivation`;
          
          await order.save();
          
          // Publish order cancelled event
          publishEvent('order.cancelled', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            userId: order.user,
            restaurantId: order.restaurantId,
            cancellationReason: 'Restaurant deactivated',
            cancelledBy: 'system'
          });
        }
      }
      break;
      
    case 'restaurant.deleted':
      // When a restaurant is deleted, handle all its orders
      if (data.restaurantId) {
        console.log(`Restaurant ${data.restaurantId} deleted, handling orders`);
        
        // Update all orders for this restaurant
        await Order.updateMany(
          { restaurantId: data.restaurantId },
          { 
            $set: { 
              restaurantName: 'DELETED RESTAURANT',
              specialInstructions: 'Restaurant has been deleted from the system'
            }
          }
        );
        
        // Delete carts for this restaurant
        await Cart.deleteMany({ restaurantId: data.restaurantId });
      }
      break;
      
    default:
      console.log(`No handler for restaurant event: ${routingKey}`);
  }
};

// Handle payment-related events (future implementation)
const handlePaymentEvent = async (routingKey, data) => {
  switch (routingKey) {
    case 'payment.succeeded':
      if (data.orderId) {
        console.log(`Payment succeeded for order ${data.orderId}`);
        
        // Update order payment status
        const order = await Order.findById(data.orderId);
        
        if (order) {
          order.paymentStatus = 'completed';
          await order.save();
          
          // Publish order payment updated event
          publishEvent('order.payment_updated', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            userId: order.user,
            restaurantId: order.restaurantId,
            paymentStatus: 'completed'
          });
        }
      }
      break;
      
    case 'payment.failed':
      if (data.orderId) {
        console.log(`Payment failed for order ${data.orderId}`);
        
        // Update order payment status
        const order = await Order.findById(data.orderId);
        
        if (order) {
          order.paymentStatus = 'failed';
          await order.save();
          
          // Publish order payment updated event
          publishEvent('order.payment_updated', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            userId: order.user,
            restaurantId: order.restaurantId,
            paymentStatus: 'failed'
          });
        }
      }
      break;
      
    default:
      console.log(`No handler for payment event: ${routingKey}`);
  }
};

module.exports = {
  processEvent
}; 
 
 
 
 