const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Password reset routes (public)
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-reset-token/:token', authController.verifyResetToken);

// Protected routes
router.get('/me', authenticateToken, authController.getCurrentUser);
router.put('/change-password', authenticateToken, authController.updatePassword);

module.exports = router; 
 
 