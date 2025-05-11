const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String, // Base64 encoded image
    required: false
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: false // Changed to false to support restaurantId
  },
  restaurantId: {
    type: String,
    required: false // Added for backward compatibility
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  isGlutenFree: {
    type: Boolean,
    default: false
  },
  spicyLevel: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware to ensure either restaurant or restaurantId is provided
menuItemSchema.pre('save', function(next) {
  if (!this.restaurant && !this.restaurantId) {
    return next(new Error('Either restaurant or restaurantId must be provided'));
  }
  
  // If restaurantId is provided but not restaurant, try to convert it
  if (this.restaurantId && !this.restaurant) {
    try {
      this.restaurant = mongoose.Types.ObjectId(this.restaurantId);
    } catch (err) {
      // If conversion fails, that's okay, we'll use restaurantId
      console.log('Could not convert restaurantId to ObjectId:', err.message);
    }
  }
  
  next();
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem; 
 
 
 
 