const express = require('express');
const router = express.Router();
const deliveryPersonController = require('../controllers/deliveryPersonController');
const { authenticateUser, authorizeRoles } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticateUser);

// Get delivery person profile
router.get('/profile', authorizeRoles(['delivery_person']), deliveryPersonController.getProfile);

// Complete delivery person profile
router.post('/complete-profile', authorizeRoles(['delivery_person']), deliveryPersonController.completeProfile);

// Update current location
router.post('/location', authorizeRoles(['delivery_person']), deliveryPersonController.updateLocation);

// Get current delivery
router.get('/current-delivery', authorizeRoles(['delivery_person']), deliveryPersonController.getCurrentDelivery);

// Update delivery status
router.put('/deliveries/:deliveryId/status', authorizeRoles(['delivery_person']), deliveryPersonController.updateDeliveryStatus);

// Get delivery history
router.get('/history', authorizeRoles(['delivery_person']), deliveryPersonController.getDeliveryHistory);

// Toggle availability
router.put('/availability', authorizeRoles(['delivery_person']), deliveryPersonController.toggleAvailability);

module.exports = router; 