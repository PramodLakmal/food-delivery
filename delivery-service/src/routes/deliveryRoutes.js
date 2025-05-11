const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { authenticateUser, authorizeRoles } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticateUser);

// Get available delivery persons for manual assignment
router.get('/available-drivers', 
  authorizeRoles(['admin', 'restaurant_owner', 'restaurant_admin', 'system_admin']), 
  deliveryController.getAvailableDeliveryPersons
);

// Create a delivery for an order
router.post('/create-for-order',
  authorizeRoles(['admin', 'restaurant_owner', 'restaurant_admin', 'system_admin']),
  deliveryController.createDeliveryForOrder
);

// Get delivery by order ID
router.get('/order/:orderId', deliveryController.getDeliveryByOrderId);

// Get restaurant deliveries (restaurant admin only)
router.get('/restaurant/:restaurantId', 
  authorizeRoles(['restaurant_admin', 'system_admin']), 
  deliveryController.getRestaurantDeliveries
);

// Find nearest delivery person
router.post('/nearest', 
  authorizeRoles(['restaurant_admin', 'system_admin']), 
  deliveryController.findNearest
);

// Get all active deliveries (admin only)
router.get('/', 
  authorizeRoles(['system_admin']), 
  deliveryController.getActiveDeliveries
);

// Manually assign a specific delivery person to a delivery
router.post('/:deliveryId/assign-specific', 
  authorizeRoles(['admin', 'restaurant_owner', 'restaurant_admin', 'system_admin']), 
  deliveryController.manuallyAssignSpecificDeliveryPerson
);

// Auto-assign nearest delivery person to a delivery
router.post('/:deliveryId/assign-auto', 
  authorizeRoles(['admin', 'restaurant_owner', 'restaurant_admin', 'system_admin']), 
  deliveryController.manuallyAssignDelivery
);

// Get delivery tracking
router.get('/:deliveryId/tracking', deliveryController.getDeliveryTracking);

// Get delivery by ID - This should be last to avoid conflicts with specific routes
router.get('/:deliveryId', deliveryController.getDeliveryById);

module.exports = router; 