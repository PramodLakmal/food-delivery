const mongoose = require('mongoose');

const DeliveryPersonSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  currentLocation: {
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  vehicle: {
    type: {
      type: String,
      enum: ['bicycle', 'motorcycle', 'car', 'scooter'],
      required: function() { return this.isProfileComplete === true; }
    },
    model: {
      type: String,
      required: function() { return this.isProfileComplete === true; }
    },
    color: {
      type: String,
      required: function() { return this.isProfileComplete === true; }
    },
    licensePlate: {
      type: String,
      required: function() { return this.isProfileComplete === true; }
    }
  },
  license: {
    number: {
      type: String,
      required: function() { return this.isProfileComplete === true; }
    },
    expiryDate: {
      type: Date,
      required: function() { return this.isProfileComplete === true; }
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  currentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create index for geospatial queries
DeliveryPersonSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });

const DeliveryPerson = mongoose.model('DeliveryPerson', DeliveryPersonSchema);

module.exports = DeliveryPerson; 