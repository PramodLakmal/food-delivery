const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { connectMessageBroker } = require('./utils/messageBroker');
const config = require('./config');

// Import routes
const deliveryRoutes = require('./routes/deliveryRoutes');
const deliveryPersonRoutes = require('./routes/deliveryPersonRoutes');

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/delivery-persons', deliveryPersonRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'delivery-service' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Connect to MongoDB
mongoose.connect(config.mongoURI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start the server
    const PORT = config.port || 5003;
    app.listen(PORT, () => {
      console.log(`Delivery service running on port ${PORT}`);
      
      // Connect to message broker
      connectMessageBroker()
        .then(() => {
          console.log('Connected to message broker');
          
          // Initialize message listeners
          require('./listeners/orderListeners');
          require('./listeners/deliveryListeners');
        })
        .catch(err => {
          console.error('Failed to connect to message broker:', err);
        });
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app; 