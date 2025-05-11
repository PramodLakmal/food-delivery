const express = require('express');
const axios = require('axios');
const { StatusCodes } = require('http-status-codes');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3004';

// Error handler for order service requests
const handleServiceError = (error, res) => {
  console.error('Order service error:', error.message);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return res.status(error.response.status).json(error.response.data);
  } else if (error.request) {
    // The request was made but no response was received
    return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      message: 'Order service is currently unavailable'
    });
  } else {
    // Something happened in setting up the request that triggered an Error
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error processing request',
      error: error.message
    });
  }
};

// Cart routes
// Get user's cart
router.get('/cart', authenticate, async (req, res) => {
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/api/cart`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Add item to cart
router.post('/cart/add', authenticate, async (req, res) => {
  try {
    const response = await axios.post(`${ORDER_SERVICE_URL}/api/cart/add`, req.body, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Update cart item
router.put('/cart/item/:itemId', authenticate, async (req, res) => {
  try {
    const response = await axios.put(
      `${ORDER_SERVICE_URL}/api/cart/item/${req.params.itemId}`, 
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

// Remove item from cart
router.delete('/cart/item/:itemId', authenticate, async (req, res) => {
  try {
    const response = await axios.delete(
      `${ORDER_SERVICE_URL}/api/cart/item/${req.params.itemId}`,
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

// Clear cart
router.delete('/cart/clear', authenticate, async (req, res) => {
  try {
    const response = await axios.delete(`${ORDER_SERVICE_URL}/api/cart/clear`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Order routes
// Create a new order
router.post('/orders', authenticate, async (req, res) => {
  try {
    const response = await axios.post(`${ORDER_SERVICE_URL}/api/orders`, req.body, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.status(StatusCodes.CREATED).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Get user orders
router.get('/orders/user', authenticate, async (req, res) => {
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders/user`, {
      params: req.query,
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Get order by ID
router.get('/orders/:orderId', authenticate, async (req, res) => {
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders/${req.params.orderId}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Cancel order
router.put('/orders/:orderId/cancel', authenticate, async (req, res) => {
  try {
    const response = await axios.put(
      `${ORDER_SERVICE_URL}/api/orders/${req.params.orderId}/cancel`, 
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

// Get restaurant orders
router.get('/orders/restaurant/:restaurantId', authenticate, async (req, res) => {
  try {
    const response = await axios.get(
      `${ORDER_SERVICE_URL}/api/orders/restaurant/${req.params.restaurantId}`,
      {
        params: req.query,
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

// Get restaurant order statistics
router.get('/orders/restaurant/:restaurantId/stats', authenticate, async (req, res) => {
  try {
    const response = await axios.get(
      `${ORDER_SERVICE_URL}/api/orders/restaurant/${req.params.restaurantId}/stats`,
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

// Update order status
router.put('/orders/:orderId/status', authenticate, async (req, res) => {
  try {
    const response = await axios.put(
      `${ORDER_SERVICE_URL}/api/orders/${req.params.orderId}/status`, 
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

// Get all orders (system admin only)
router.get('/orders', authenticate, async (req, res) => {
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders`, {
      params: req.query,
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Update order details (for customers)
router.put('/orders/:orderId/details', authenticate, async (req, res) => {
  try {
    const response = await axios.put(
      `${ORDER_SERVICE_URL}/api/orders/${req.params.orderId}/details`, 
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

// Update order delivery information
router.put('/orders/:orderId/delivery', authenticate, async (req, res) => {
  try {
    console.log(`API Gateway: Forwarding delivery update for order ${req.params.orderId} to ${ORDER_SERVICE_URL}/api/orders/${req.params.orderId}/delivery`);
    const response = await axios.put(
      `${ORDER_SERVICE_URL}/api/orders/${req.params.orderId}/delivery`, 
      req.body,
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    console.error(`API Gateway: Error forwarding delivery update for order ${req.params.orderId}:`, error.message);
    handleServiceError(error, res);
  }
});

module.exports = router; 