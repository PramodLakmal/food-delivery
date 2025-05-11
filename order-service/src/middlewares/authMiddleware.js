const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');

// Authenticate user middleware
const authenticateUser = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      restaurantId: decoded.restaurantId
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Authorize roles middleware
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this resource`
      });
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizeRoles
}; 
 
 
 
 