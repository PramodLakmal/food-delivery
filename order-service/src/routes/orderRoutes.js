const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateUser, authorizeRoles } = require('../middlewares/authMiddleware');

// All order routes require authentication
router.use(authenticateUser);

// Create a new order from cart
router.post('/', orderController.createOrder);

// Get user orders
router.get('/user', orderController.getUserOrders);

// Get order by ID
router.get('/:orderId', orderController.getOrderById);

// Cancel order
router.put('/:orderId/cancel', orderController.cancelOrder);

// Update order details (for customers - only pending orders)
router.put('/:orderId/details', orderController.updateOrderDetails);

// Update order delivery information
router.put('/:orderId/delivery', authorizeRoles(['restaurant_admin', 'system_admin', 'delivery_admin']), orderController.updateOrderDeliveryInfo);

// Routes that require restaurant_admin or system_admin role
router.get('/restaurant/:restaurantId', authorizeRoles(['restaurant_admin', 'system_admin']), orderController.getRestaurantOrders);
router.get('/restaurant/:restaurantId/stats', authorizeRoles(['restaurant_admin', 'system_admin']), orderController.getRestaurantOrderStats);
router.put('/:orderId/status', authorizeRoles(['restaurant_admin', 'system_admin']), orderController.updateOrderStatus);

// Routes that require system_admin role
router.get('/', authorizeRoles(['system_admin']), orderController.getAllOrders);

module.exports = router; 