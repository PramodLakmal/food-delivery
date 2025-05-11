const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const { connectToRabbitMQ, subscribeToEvents } = require('./utils/messageBroker');
const { processEvent } = require('./handlers/eventHandlers');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/order-service')
  .then(() => console.log('MongoDB connected...'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'order-service' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
  
  // Connect to RabbitMQ and subscribe to events
  connectToRabbitMQ().then(channel => {
    if (channel) {
      // Subscribe to user events
      subscribeToEvents('user_events', '#', processEvent);
      
      // Subscribe to restaurant events
      subscribeToEvents('restaurant_events', '#', processEvent);
      
      // Subscribe to payment events (future implementation)
      subscribeToEvents('payment_events', '#', processEvent);
    }
  });
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
 
 
 
 