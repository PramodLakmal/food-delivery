const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { authenticate, authorize } = require('../middlewares/auth');

// Public routes
router.get('/', restaurantController.getAllRestaurants);

// Protected routes - require authentication
// Important: Define specific routes before generic routes
router.get('/owner/:ownerId', authenticate, restaurantController.getRestaurantsByOwner);
router.get('/:id', restaurantController.getRestaurantById);
router.post('/', authenticate, authorize(['restaurant_admin', 'system_admin']), restaurantController.createRestaurant);
router.put('/:id', authenticate, authorize(['restaurant_admin', 'system_admin']), restaurantController.updateRestaurant);
router.delete('/:id', authenticate, authorize(['restaurant_admin', 'system_admin']), restaurantController.deleteRestaurant);
router.patch('/:id/toggle-status', authenticate, authorize(['restaurant_admin', 'system_admin']), restaurantController.toggleRestaurantStatus);

module.exports = router; 
 
 
 
 