const jwt = require('jsonwebtoken');
const axios = require('axios');

// Authenticate user using JWT token
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      
      // Add user from payload to request
      req.user = decoded;
      
      next();
    } catch (error) {
      res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Authorize based on user role
exports.authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }

    next();
  };
};

// Validate restaurant ownership
exports.isRestaurantOwner = async (req, res, next) => {
  try {
    const restaurantId = req.params.id || req.body.restaurantId;
    
    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }

    // If user is system admin, allow access
    if (req.user.role === 'system_admin') {
      return next();
    }

    // Get restaurant from database
    const response = await axios.get(`${process.env.RESTAURANT_SERVICE_URL}/api/restaurants/${restaurantId}`);
    const restaurant = response.data;

    // Check if user is the restaurant owner
    if (restaurant && restaurant.owner.toString() === req.user.id) {
      next();
    } else {
      res.status(403).json({ message: 'Not authorized to access this restaurant' });
    }
  } catch (error) {
    console.error('Restaurant ownership validation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 
 
 
 
 