const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../utils/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Routes accessible by all authenticated users
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);

// Admin only routes
router.get('/', authorizeRole('system_admin'), userController.getAllUsers);
router.put('/:id/role', authorizeRole('system_admin'), userController.changeUserRole);
router.put('/:id/status', authorizeRole('system_admin'), userController.toggleUserStatus);

module.exports = router; 
 
 