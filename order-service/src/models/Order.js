const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  },
  menuItemId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  image: {
    type: String
  },
  notes: {
    type: String
  }
}, { _id: true });

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
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
  items: [OrderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number }
  },
  deliveryInstructions: {
    type: String
  },
  contactPhone: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'cash_on_delivery', 'wallet'],
    default: 'cash_on_delivery'
  },
  estimatedDeliveryTime: {
    type: Date
  },
  specialInstructions: {
    type: String
  },
  // Delivery related fields
  deliveryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery'
  },
  deliveryPersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPerson'
  },
  deliveryPersonName: {
    type: String
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

// Generate order number
OrderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    // Generate a unique order number (current date + random number)
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }
  next();
});

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order; 