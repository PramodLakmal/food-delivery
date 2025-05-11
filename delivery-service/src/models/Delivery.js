const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  restaurantId: {
    type: String,
    required: true
  },
  restaurantName: {
    type: String,
    required: true
  },
  pickupLocation: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    }
  },
  dropoffLocation: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    }
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  deliveryPersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPerson',
    default: null
  },
  deliveryPersonName: {
    type: String
  },
  deliveryPersonPhone: {
    type: String
  },
  status: {
    type: String,
    enum: [
      'pending_assignment', // Waiting for delivery person assignment
      'assigned',           // Delivery person assigned
      'picked_up',          // Food picked up from restaurant
      'in_transit',         // On the way to customer
      'delivered',          // Successfully delivered
      'failed',             // Delivery failed
      'cancelled'           // Delivery cancelled
    ],
    default: 'pending_assignment'
  },
  assignedAt: {
    type: Date
  },
  pickedUpAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  distance: {
    type: Number  // in kilometers
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  specialInstructions: {
    type: String
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    }
  }],
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String
    },
    createdAt: {
      type: Date
    }
  },
  trackingHistory: [{
    status: {
      type: String,
      required: true
    },
    location: {
      latitude: Number,
      longitude: Number
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create index for geospatial queries on pickup and dropoff locations
DeliverySchema.index({ 'pickupLocation.coordinates.latitude': 1, 'pickupLocation.coordinates.longitude': 1 });
DeliverySchema.index({ 'dropoffLocation.coordinates.latitude': 1, 'dropoffLocation.coordinates.longitude': 1 });

const Delivery = mongoose.model('Delivery', DeliverySchema);

module.exports = Delivery; 