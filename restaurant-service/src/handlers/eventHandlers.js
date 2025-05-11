const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

// Handle user events
const handleUserEvent = async (routingKey, data) => {
  try {
    console.log(`Processing user event: ${routingKey}`, data);
    
    switch (routingKey) {
      case 'user.deleted':
        // If a user is deleted, handle their restaurants
        if (data.userId) {
          console.log(`User ${data.userId} deleted, updating their restaurants`);
          
          // Option 1: Delete all restaurants owned by this user
          // await Restaurant.deleteMany({ ownerId: data.userId });
          
          // Option 2: Mark restaurants as inactive (preferred approach)
          await Restaurant.updateMany(
            { ownerId: data.userId },
            { isActive: false, deactivationReason: 'Owner account deleted' }
          );
          
          console.log(`Updated restaurants for deleted user ${data.userId}`);
        }
        break;
        
      case 'user.role_changed':
        // Handle user role changes that affect restaurant ownership
        if (data.userId && data.newRole !== 'restaurant_admin' && data.oldRole === 'restaurant_admin') {
          console.log(`User ${data.userId} is no longer a restaurant admin, updating their restaurants`);
          
          // Mark restaurants as inactive
          await Restaurant.updateMany(
            { ownerId: data.userId },
            { isActive: false, deactivationReason: 'Owner role changed' }
          );
          
          console.log(`Updated restaurants for user ${data.userId} with changed role`);
        }
        break;
        
      default:
        // No action needed for other user events
        break;
    }
  } catch (error) {
    console.error(`Error handling user event ${routingKey}:`, error.message);
  }
};

// Handle order events
const handleOrderEvent = async (routingKey, data) => {
  try {
    console.log(`Processing order event: ${routingKey}`, data);
    
    switch (routingKey) {
      case 'order.created':
        // Update restaurant metrics when an order is created
        if (data.restaurantId) {
          console.log(`Updating restaurant ${data.restaurantId} metrics for new order`);
          
          await Restaurant.findByIdAndUpdate(
            data.restaurantId,
            { 
              $inc: { 
                orderCount: 1,
                totalSales: data.orderTotal || 0
              }
            }
          );
          
          // Update menu item popularity if items are provided
          if (data.items && Array.isArray(data.items)) {
            for (const item of data.items) {
              if (item.menuItemId && item.quantity) {
                await MenuItem.findByIdAndUpdate(
                  item.menuItemId,
                  { $inc: { orderCount: item.quantity } }
                );
              }
            }
          }
          
          console.log(`Updated restaurant metrics for ${data.restaurantId}`);
        }
        break;
        
      case 'order.canceled':
        // Update restaurant metrics when an order is canceled
        if (data.restaurantId) {
          console.log(`Updating restaurant ${data.restaurantId} metrics for canceled order`);
          
          await Restaurant.findByIdAndUpdate(
            data.restaurantId,
            { 
              $inc: { 
                canceledOrderCount: 1,
                // Optionally decrement total sales if needed
                // totalSales: -(data.orderTotal || 0)
              }
            }
          );
          
          console.log(`Updated restaurant metrics for canceled order ${data.orderId}`);
        }
        break;
        
      default:
        // No action needed for other order events
        break;
    }
  } catch (error) {
    console.error(`Error handling order event ${routingKey}:`, error.message);
  }
};

// Process incoming events based on routing key
const processEvent = (routingKey, data) => {
  // Route to the appropriate handler based on the event type
  if (routingKey.startsWith('user.')) {
    handleUserEvent(routingKey, data);
  } else if (routingKey.startsWith('order.')) {
    handleOrderEvent(routingKey, data);
  } else {
    console.log(`No handler for event: ${routingKey}`);
  }
};

module.exports = {
  processEvent
}; 
 
 
 
 