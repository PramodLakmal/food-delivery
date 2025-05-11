const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { StatusCodes } = require('http-status-codes');

// Load environment variables
dotenv.config();

// Import middlewares
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const { globalLimiter } = require('./middlewares/rateLimit');

// Import routes
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
// Increase payload size limit for JSON and URL-encoded data (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(globalLimiter);

// Base route
app.get('/', (req, res) => {
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Food ordering system API gateway',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(StatusCodes.OK).json({
    status: 'UP',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', restaurantRoutes);
app.use('/api', orderRoutes);
app.use('/api', deliveryRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
}); 
 
 