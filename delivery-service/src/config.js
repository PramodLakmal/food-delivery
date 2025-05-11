require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3005,
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/delivery-service',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key',
  rabbitMQ: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost',
    exchange: process.env.RABBITMQ_EXCHANGE || 'food_delivery',
  },
  orderServiceUrl: process.env.ORDER_SERVICE_URL || 'http://localhost:3004/api',
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:3002/api',
  restaurantServiceUrl: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3003/api',
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  deliveryAssignment: {
    maxDistance: process.env.MAX_DELIVERY_DISTANCE || 10000, // meters
    maxWaitTime: process.env.MAX_WAIT_TIME || 300, // seconds
    autoAssignmentEnabled: process.env.AUTO_ASSIGNMENT_ENABLED !== 'false'
  },
  autoAssignmentEnabled: process.env.AUTO_ASSIGNMENT_ENABLED !== 'false',
}; 