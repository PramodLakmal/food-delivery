const express = require('express');
const axios = require('axios');
const { StatusCodes } = require('http-status-codes');
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// Delivery service URL
const DELIVERY_SERVICE_URL = process.env.DELIVERY_SERVICE_URL || 'http://localhost:3005/api';

// Helper function to forward requests to the delivery service
const forwardToDeliveryService = async (req, res, endpoint = '') => {
  try {
    // Make sure we don't have duplicate /api in the URL
    const baseUrl = DELIVERY_SERVICE_URL.endsWith('/api') 
      ? DELIVERY_SERVICE_URL 
      : `${DELIVERY_SERVICE_URL}/api`;
      
    const url = `${baseUrl}${endpoint}`;
    console.log(`Forwarding request to: ${url}`);
    
    // Forward the request with the same method, headers, and body
    const response = await axios({
      method: req.method,
      url,
      data: req.body,
      headers: {
        ...(req.headers.authorization && { Authorization: req.headers.authorization }),
        'Content-Type': 'application/json',
      },
      params: req.query,
    });
    
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error forwarding to delivery service:', error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Delivery service error response:', error.response.data);
      return res.status(error.response.status).json(error.response.data);
    }
    
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error connecting to delivery service',
      error: error.message,
    });
  }
};

// Get delivery by ID
router.get('/deliveries/:deliveryId', async (req, res) => {
  console.log(`API Gateway: Getting delivery with ID ${req.params.deliveryId}`);
  return forwardToDeliveryService(req, res, `/deliveries/${req.params.deliveryId}`);
});

// Get all deliveries (admin only)
router.get('/deliveries', authenticate, authorizeRole('system_admin'), async (req, res) => {
  return forwardToDeliveryService(req, res, '/deliveries');
});

// Get deliveries for a restaurant
router.get('/restaurants/:restaurantId/deliveries', authenticate, authorizeRole('restaurant_admin'), async (req, res) => {
  return forwardToDeliveryService(req, res, `/restaurants/${req.params.restaurantId}/deliveries`);
});

// Get deliveries for a delivery person
router.get('/delivery-person/deliveries', authenticate, authorizeRole('delivery_person'), async (req, res) => {
  return forwardToDeliveryService(req, res, '/delivery-person/deliveries');
});

// Create delivery for order
router.post('/deliveries/create-for-order', authenticate, async (req, res) => {
  return forwardToDeliveryService(req, res, '/deliveries/create-for-order');
});

// Get available drivers for manual assignment
router.get('/deliveries/available-drivers', authenticate, authorizeRole('restaurant_admin', 'system_admin'), async (req, res) => {
  return forwardToDeliveryService(req, res, '/deliveries/available-drivers');
});

// Manually assign delivery person
router.post('/deliveries/:deliveryId/assign', authenticate, authorizeRole('restaurant_admin', 'system_admin'), async (req, res) => {
  return forwardToDeliveryService(req, res, `/deliveries/${req.params.deliveryId}/assign`);
});

// Update delivery status
router.put('/deliveries/:deliveryId/status', authenticate, async (req, res) => {
  return forwardToDeliveryService(req, res, `/deliveries/${req.params.deliveryId}/status`);
});

// Track delivery
router.get('/deliveries/:deliveryId/track', authenticate, async (req, res) => {
  return forwardToDeliveryService(req, res, `/deliveries/${req.params.deliveryId}/track`);
});

module.exports = router; 