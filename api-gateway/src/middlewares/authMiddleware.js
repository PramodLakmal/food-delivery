const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');

/**
 * Middleware to validate JWT token
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Authentication token is required'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(StatusCodes.FORBIDDEN).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Middleware to check user role
 */
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        status: 'error',
        message: 'Access denied: Insufficient privileges'
      });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorizeRole
}; 
 
 