const express = require('express');
const proxy = require('express-http-proxy');
const { StatusCodes } = require('http-status-codes');
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimit');

const router = express.Router();
const userServiceUrl = process.env.USER_SERVICE_URL;

// Helper function to handle proxy errors
const handleProxyError = (err, res, next) => {
  console.error('Proxy error:', err);
  return res.status(StatusCodes.BAD_GATEWAY).json({
    status: 'error',
    message: 'Error connecting to user service'
  });
};

// Public routes - Auth

// Register
router.post('/auth/register', authLimiter, proxy(userServiceUrl, {
  proxyReqPathResolver: () => '/api/auth/register',
  proxyErrorHandler: handleProxyError
}));

// Login
router.post('/auth/login', authLimiter, proxy(userServiceUrl, {
  proxyReqPathResolver: () => '/api/auth/login',
  proxyErrorHandler: handleProxyError
}));

// Password reset routes (public)
router.post('/auth/forgot-password', authLimiter, proxy(userServiceUrl, {
  proxyReqPathResolver: () => '/api/auth/forgot-password',
  proxyErrorHandler: handleProxyError
}));

router.post('/auth/reset-password', authLimiter, proxy(userServiceUrl, {
  proxyReqPathResolver: () => '/api/auth/reset-password',
  proxyErrorHandler: handleProxyError
}));

router.get('/auth/verify-reset-token/:token', proxy(userServiceUrl, {
  proxyReqPathResolver: (req) => `/api/auth/verify-reset-token/${req.params.token}`,
  proxyErrorHandler: handleProxyError
}));

// Protected routes
router.use(authenticate);

// Get current user profile
router.get('/auth/me', proxy(userServiceUrl, {
  proxyReqPathResolver: () => '/api/auth/me',
  proxyErrorHandler: handleProxyError
}));

// Change password
router.put('/auth/change-password', proxy(userServiceUrl, {
  proxyReqPathResolver: () => '/api/auth/change-password',
  proxyErrorHandler: handleProxyError
}));

// User routes

// Get user by ID
router.get('/users/:id', proxy(userServiceUrl, {
  proxyReqPathResolver: (req) => `/api/users/${req.params.id}`,
  proxyErrorHandler: handleProxyError
}));

// Update user profile
router.put('/users/:id', proxy(userServiceUrl, {
  proxyReqPathResolver: (req) => `/api/users/${req.params.id}`,
  proxyErrorHandler: handleProxyError
}));

// Admin only routes
router.get('/users', authorizeRole('system_admin'), proxy(userServiceUrl, {
  proxyReqPathResolver: () => '/api/users',
  proxyErrorHandler: handleProxyError
}));

router.put('/users/:id/role', authorizeRole('system_admin'), proxy(userServiceUrl, {
  proxyReqPathResolver: (req) => `/api/users/${req.params.id}/role`,
  proxyErrorHandler: handleProxyError
}));

router.put('/users/:id/status', authorizeRole('system_admin'), proxy(userServiceUrl, {
  proxyReqPathResolver: (req) => `/api/users/${req.params.id}/status`,
  proxyErrorHandler: handleProxyError
}));

module.exports = router; 