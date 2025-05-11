const rateLimit = require('express-rate-limit');
const { StatusCodes } = require('http-status-codes');

/**
 * Global rate limiter
 */
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the RateLimit-* headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.'
  },
  statusCode: StatusCodes.TOO_MANY_REQUESTS
});

/**
 * Auth endpoint rate limiter (more strict)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many login attempts, please try again later.'
  },
  statusCode: StatusCodes.TOO_MANY_REQUESTS
});

module.exports = {
  globalLimiter,
  authLimiter
}; 
 
 