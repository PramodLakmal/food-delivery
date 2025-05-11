const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateUser } = require('../middlewares/authMiddleware');

// All cart routes require authentication
router.use(authenticateUser);

// Get user's cart
router.get('/', cartController.getUserCart);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update cart item
router.put('/item/:itemId', cartController.updateCartItem);

// Remove item from cart
router.delete('/item/:itemId', cartController.removeFromCart);

// Clear cart
router.delete('/clear', cartController.clearCart);

module.exports = router; 
 
 
 
 