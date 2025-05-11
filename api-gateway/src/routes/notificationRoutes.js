const express = require('express');
const proxy = require('express-http-proxy');
const { StatusCodes } = require('http-status-codes');
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL;

// Helper function to handle proxy errors
const handleProxyError = (err, res, next) => {
  console.error('Proxy error:', err);
  return res.status(StatusCodes.BAD_GATEWAY).json({
    status: 'error',
    message: 'Error connecting to notification service'
  });
};

// All notification routes require authentication
router.use(authenticate);

// Get notifications (with optional filters)
router.get('/', proxy(notificationServiceUrl, {
  proxyReqPathResolver: (req) => {
    // Append user ID from token if not specified
    if (!req.query.userId && req.user && req.user.id) {
      const separator = req.url.includes('?') ? '&' : '?';
      return `/api/notifications${req.url}${separator}userId=${req.user.id}`;
    }
    return `/api/notifications${req.url}`;
  },
  proxyErrorHandler: handleProxyError
}));

// Get notification by ID
router.get('/:id', proxy(notificationServiceUrl, {
  proxyReqPathResolver: (req) => `/api/notifications/${req.params.id}`,
  proxyErrorHandler: handleProxyError
}));

// Send notification - restricted to admins and system
router.post('/send', authorizeRole('restaurant_admin', 'system_admin'), proxy(notificationServiceUrl, {
  proxyReqPathResolver: () => '/api/notifications/send',
  proxyErrorHandler: handleProxyError
}));

// Template routes - accessible only by admin
router.use('/templates', authorizeRole('system_admin'));

// Get all templates
router.get('/templates', proxy(notificationServiceUrl, {
  proxyReqPathResolver: () => '/api/notifications/templates',
  proxyErrorHandler: handleProxyError
}));

// Get template by ID
router.get('/templates/:id', proxy(notificationServiceUrl, {
  proxyReqPathResolver: (req) => `/api/notifications/templates/${req.params.id}`,
  proxyErrorHandler: handleProxyError
}));

// Create a new template
router.post('/templates', proxy(notificationServiceUrl, {
  proxyReqPathResolver: () => '/api/notifications/templates',
  proxyErrorHandler: handleProxyError
}));

// Update a template
router.put('/templates/:id', proxy(notificationServiceUrl, {
  proxyReqPathResolver: (req) => `/api/notifications/templates/${req.params.id}`,
  proxyErrorHandler: handleProxyError
}));

module.exports = router; 
 
 