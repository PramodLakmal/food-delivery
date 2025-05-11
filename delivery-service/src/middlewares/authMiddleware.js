const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../config');
const { StatusCodes } = require('http-status-codes');

/**
 * Middleware to authenticate user from JWT token
 */
const authenticateUser = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret);
      
      try {
        // Get user from user service
        const userResponse = await axios.get(`${config.userServiceUrl}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!userResponse.data) {
          return res.status(401).json({ message: 'User not found' });
        }

        // Attach user to request object
        req.user = userResponse.data;
        req.token = token;
        next();
      } catch (userServiceError) {
        console.error('Error connecting to user service:', userServiceError.message);
        
        // If we can't reach the user service, extract user info from token
        // This is a fallback mechanism
        req.user = {
          id: decoded.id,
          role: decoded.role,
          email: decoded.email
        };
        req.token = token;
        next();
      }
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid authentication token' });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Authentication token expired' });
      } else {
        console.error('Auth error:', error);
        return res.status(500).json({ message: 'Authentication error', error: error.message });
      }
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Middleware to authorize user roles
 * @param {Array} allowedRoles - Array of allowed roles
 */
const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
  };
};

/**
 * Middleware to check if user is a delivery person
 */
const isDeliveryPerson = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'delivery_person') {
      return res.status(403).json({ message: 'Forbidden: Only delivery persons can access this resource' });
    }

    next();
  } catch (error) {
    console.error('Delivery person middleware error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  authenticateUser,
  authorizeRoles,
  isDeliveryPerson
}; 