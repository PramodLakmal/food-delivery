const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
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

const CartSchema = new mongoose.Schema({
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
  items: [CartItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Calculate total price of cart
CartSchema.methods.calculateTotal = function() {
  return this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

// Clear cart items
CartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

const Cart = mongoose.model('Cart', CartSchema);

module.exports = Cart; 
 
 
 
 