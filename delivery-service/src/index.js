require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { setupConsumer } = require('./utils/messageBroker');

// Import routes
const deliveryPersonRoutes = require('./routes/deliveryPersonRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/delivery-persons', deliveryPersonRoutes);
app.use('/api/deliveries', deliveryRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'delivery-service' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/food-delivery-delivery-service', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  
  // Set up message broker consumer
  setupConsumer().catch(err => {
    console.error('Failed to setup message broker consumer:', err);
  });
  
  // Start the server
  const PORT = process.env.PORT || 3005;
  app.listen(PORT, () => {
    console.log(`Delivery service running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
}); 