const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
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
  address: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String, // Base64 encoded image
    required: false
  },
  cuisineType: {
    type: String,
    required: true,
    trim: true
  },
  // Support both field names for backward compatibility
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Changed to false for compatibility
  },
  ownerId: {
    type: String,
    required: false // One of owner or ownerId must be present
  },
  openingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deactivationReason: {
    type: String,
    default: null
  },
  orderCount: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  canceledOrderCount: {
    type: Number,
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

// Create a geospatial index on the location field
restaurantSchema.index({ location: '2dsphere' });

// Pre-save middleware to ensure either owner or ownerId is present
restaurantSchema.pre('save', function(next) {
  if (!this.owner && !this.ownerId) {
    return next(new Error('Either owner or ownerId must be provided'));
  }
  next();
});

// Virtual to get consistent owner ID regardless of which field is used
restaurantSchema.virtual('effectiveOwnerId').get(function() {
  return this.ownerId || (this.owner ? this.owner.toString() : null);
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant; 
 
 
 
 