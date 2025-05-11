const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const restaurantRoutes = require('./routes/restaurantRoutes');
const menuItemRoutes = require('./routes/menuItemRoutes');
const { connectToRabbitMQ, subscribeToEvents } = require('./utils/messageBroker');
const { processEvent } = require('./handlers/eventHandlers');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-service')
  .then(() => console.log('MongoDB connected...'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu-items', menuItemRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'restaurant-service' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Restaurant service running on port ${PORT}`);
  
  // Connect to RabbitMQ and subscribe to events
  connectToRabbitMQ().then(channel => {
    if (channel) {
      // Subscribe to user events
      subscribeToEvents('user_events', '#', processEvent);
      
      // Subscribe to order events
      subscribeToEvents('order_events', '#', processEvent);
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
 
 
 
 