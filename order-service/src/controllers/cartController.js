const Cart = require('../models/Cart');
const { StatusCodes } = require('http-status-codes');
const { publishEvent } = require('../utils/messageBroker');

// Get user's cart
const getUserCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: cart,
      total: cart.calculateTotal()
    });
  } catch (error) {
    console.error('Error getting user cart:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get cart',
      error: error.message
    });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      menuItem, 
      menuItemId, 
      name, 
      price, 
      quantity, 
      image, 
      notes,
      restaurantId,
      restaurantName
    } = req.body;
    
    if (!menuItemId || !name || !price || !quantity || !restaurantId || !restaurantName) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Find user's cart or create a new one
    let cart = await Cart.findOne({ user: userId });
    
    // If cart exists but has items from a different restaurant, clear it
    if (cart && cart.restaurantId && cart.restaurantId !== restaurantId) {
      await cart.clearCart();
      cart.restaurant = restaurantId;
      cart.restaurantId = restaurantId;
      cart.restaurantName = restaurantName;
    }
    
    // If no cart exists, create a new one
    if (!cart) {
      cart = new Cart({
        user: userId,
        restaurant: restaurantId,
        restaurantId: restaurantId,
        restaurantName: restaurantName,
        items: []
      });
    }
    
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => item.menuItemId === menuItemId);
    
    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].notes = notes || cart.items[existingItemIndex].notes;
    } else {
      // Add new item to cart
      cart.items.push({
        menuItem,
        menuItemId,
        name,
        price,
        quantity,
        image,
        notes
      });
    }
    
    cart.updatedAt = Date.now();
    await cart.save();
    
    // Publish cart updated event
    publishEvent('cart.updated', {
      userId,
      cartId: cart._id,
      restaurantId,
      itemCount: cart.items.length,
      total: cart.calculateTotal()
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Item added to cart',
      data: cart,
      total: cart.calculateTotal()
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
};

// Update cart item
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity, notes } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }
    
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    
    if (itemIndex === -1) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Item not found in cart'
      });
    }
    
    cart.items[itemIndex].quantity = quantity;
    
    if (notes !== undefined) {
      cart.items[itemIndex].notes = notes;
    }
    
    cart.updatedAt = Date.now();
    await cart.save();
    
    // Publish cart updated event
    publishEvent('cart.updated', {
      userId,
      cartId: cart._id,
      restaurantId: cart.restaurantId,
      itemCount: cart.items.length,
      total: cart.calculateTotal()
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Cart item updated',
      data: cart,
      total: cart.calculateTotal()
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    
    if (itemIndex === -1) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Item not found in cart'
      });
    }
    
    cart.items.splice(itemIndex, 1);
    cart.updatedAt = Date.now();
    await cart.save();
    
    // Publish cart updated event
    publishEvent('cart.updated', {
      userId,
      cartId: cart._id,
      restaurantId: cart.restaurantId,
      itemCount: cart.items.length,
      total: cart.calculateTotal()
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Item removed from cart',
      data: cart,
      total: cart.calculateTotal()
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    await cart.clearCart();
    
    // Publish cart cleared event
    publishEvent('cart.cleared', {
      userId,
      cartId: cart._id
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};

module.exports = {
  getUserCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
}; 
 
 
 
 