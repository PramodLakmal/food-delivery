const express = require('express');
const router = express.Router();
const menuItemController = require('../controllers/menuItemController');
const { authenticate, authorize } = require('../middlewares/auth');

// Public routes
router.get('/restaurant/:restaurantId', menuItemController.getMenuItemsByRestaurant);
router.get('/:id', menuItemController.getMenuItemById);

// Protected routes - require authentication
router.post('/', authenticate, authorize(['restaurant_admin', 'system_admin']), menuItemController.createMenuItem);
router.put('/:id', authenticate, authorize(['restaurant_admin', 'system_admin']), menuItemController.updateMenuItem);
router.delete('/:id', authenticate, authorize(['restaurant_admin', 'system_admin']), menuItemController.deleteMenuItem);
router.patch('/:id/toggle-availability', authenticate, authorize(['restaurant_admin', 'system_admin']), menuItemController.toggleMenuItemAvailability);

module.exports = router; 
 
 
 
 