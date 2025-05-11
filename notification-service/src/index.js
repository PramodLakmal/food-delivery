const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const notificationRoutes = require('./routes/notificationRoutes');

// Import services and utilities
const emailService = require('./services/emailService');
const templateService = require('./services/templateService');
const { connectToRabbitMQ, subscribeToEvents } = require('./utils/messageBroker');
const { processEvent } = require('./handlers/eventHandlers');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'notification-service' });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Notification service running on port ${PORT}`);
      
      // Verify email connection
      emailService.verifyConnection();
      
      // Seed default templates
      templateService.seedDefaultTemplates();
      
      // Connect to RabbitMQ and subscribe to events
      connectToRabbitMQ().then((channel) => {
        if (channel) {
          // Subscribe to user events
          subscribeToEvents('user_events', '#', processEvent);
          
          // Subscribe to order events
          subscribeToEvents('order_events', '#', processEvent);
        }
      });
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
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
 
 