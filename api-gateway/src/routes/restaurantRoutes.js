const express = require('express');
const axios = require('axios');
const { StatusCodes } = require('http-status-codes');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3003';

// Error handler for restaurant service requests
const handleServiceError = (error, res) => {
  console.error('Restaurant service error:', error.message);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return res.status(error.response.status).json(error.response.data);
  } else if (error.request) {
    // The request was made but no response was received
    return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      message: 'Restaurant service is currently unavailable'
    });
  } else {
    // Something happened in setting up the request that triggered an Error
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error processing request',
      error: error.message
    });
  }
};

// Public routes

// Get all restaurants
router.get('/restaurants', async (req, res) => {
  try {
    const response = await axios.get(`${RESTAURANT_SERVICE_URL}/api/restaurants`, {
      params: req.query
    });
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Get restaurants by owner - must be before the generic ID route
router.get('/restaurants/owner/:ownerId', authenticate, async (req, res) => {
  try {
    const response = await axios.get(
      `${RESTAURANT_SERVICE_URL}/api/restaurants/owner/${req.params.ownerId}`,
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Get restaurant by ID
router.get('/restaurants/:id', async (req, res) => {
  try {
    const response = await axios.get(`${RESTAURANT_SERVICE_URL}/api/restaurants/${req.params.id}`);
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Get menu items by restaurant
router.get('/menu-items/restaurant/:restaurantId', async (req, res) => {
  try {
    const response = await axios.get(
      `${RESTAURANT_SERVICE_URL}/api/menu-items/restaurant/${req.params.restaurantId}`,
      { params: req.query }
    );
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Get menu item by ID
router.get('/menu-items/:id', async (req, res) => {
  try {
    const response = await axios.get(`${RESTAURANT_SERVICE_URL}/api/menu-items/${req.params.id}`);
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Protected routes - require authentication
// Create restaurant
router.post('/restaurants', authenticate, async (req, res) => {
  try {
    const response = await axios.post(
      `${RESTAURANT_SERVICE_URL}/api/restaurants`,
      req.body,
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    res.status(StatusCodes.CREATED).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Update restaurant
router.put('/restaurants/:id', authenticate, async (req, res) => {
  try {
    const response = await axios.put(
      `${RESTAURANT_SERVICE_URL}/api/restaurants/${req.params.id}`,
      req.body,
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Delete restaurant
router.delete('/restaurants/:id', authenticate, async (req, res) => {
  try {
    const response = await axios.delete(
      `${RESTAURANT_SERVICE_URL}/api/restaurants/${req.params.id}`,
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Toggle restaurant status
router.patch('/restaurants/:id/toggle-status', authenticate, async (req, res) => {
  try {
    const response = await axios.patch(
      `${RESTAURANT_SERVICE_URL}/api/restaurants/${req.params.id}/toggle-status`,
      {},
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Menu item routes
// Create menu item
router.post('/menu-items', authenticate, async (req, res) => {
  try {
    const response = await axios.post(
      `${RESTAURANT_SERVICE_URL}/api/menu-items`,
      req.body,
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    res.status(StatusCodes.CREATED).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Update menu item
router.put('/menu-items/:id', authenticate, async (req, res) => {
  try {
    const response = await axios.put(
      `${RESTAURANT_SERVICE_URL}/api/menu-items/${req.params.id}`,
      req.body,
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Delete menu item
router.delete('/menu-items/:id', authenticate, async (req, res) => {
  try {
    const response = await axios.delete(
      `${RESTAURANT_SERVICE_URL}/api/menu-items/${req.params.id}`,
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Toggle menu item availability
router.patch('/menu-items/:id/toggle-availability', authenticate, async (req, res) => {
  try {
    const response = await axios.patch(
      `${RESTAURANT_SERVICE_URL}/api/menu-items/${req.params.id}/toggle-availability`,
      {},
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

module.exports = router; 
 
 
 
 