const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { StatusCodes } = require('http-status-codes');
const { publishEvent } = require('../utils/messageBroker');

// Create a new order from cart
const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      deliveryAddress, 
      contactPhone, 
      paymentMethod, 
      specialInstructions 
    } = req.body;
    
    // Validate required fields
    if (!deliveryAddress || !contactPhone) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Get user's cart
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart || cart.items.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Cart is empty'
      });
    }
    
    // Calculate total amount
    const totalAmount = cart.calculateTotal();
    
    // Generate order number
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const orderNumber = `ORD-${year}${month}${day}-${random}`;
    
    // Create new order
    const order = new Order({
      orderNumber,
      user: userId,
      restaurant: cart.restaurant,
      restaurantId: cart.restaurantId,
      restaurantName: cart.restaurantName,
      items: cart.items.map(item => ({
        menuItem: item.menuItem,
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        notes: item.notes
      })),
      totalAmount,
      deliveryAddress,
      contactPhone,
      paymentMethod: paymentMethod || 'cash_on_delivery',
      specialInstructions: specialInstructions || ''
    });
    
    await order.save();
    
    // Clear the cart after order is created
    await cart.clearCart();
    
    // Publish order created event
    publishEvent('order.created', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId,
      restaurantId: order.restaurantId,
      totalAmount: order.totalAmount,
      status: order.status,
      items: order.items.length
    });
    
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Get user orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { user: userId };
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalOrders = await Order.countDocuments(query);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: orders,
      pagination: {
        total: totalOrders,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalOrders / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting user orders:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message
    });
  }
};

// Get restaurant orders
const getRestaurantOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    
    // Ensure user has permission to view restaurant orders
    if (req.user.role !== 'restaurant_admin' && req.user.role !== 'system_admin') {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Not authorized to view restaurant orders'
      });
    }
    
    // Note: We're not checking if restaurantId matches user.restaurantId anymore
    // This is now handled in the frontend by fetching the user's restaurants first
    
    const query = { restaurantId };
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalOrders = await Order.countDocuments(query);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: orders,
      pagination: {
        total: totalOrders,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalOrders / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting restaurant orders:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get restaurant orders',
      error: error.message
    });
  }
};

// Get all orders (system admin only)
const getAllOrders = async (req, res) => {
  try {
    // Ensure user is system admin
    if (req.user.role !== 'system_admin') {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Not authorized to view all orders'
      });
    }
    
    const { status, restaurantId, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by restaurant if provided
    if (restaurantId) {
      query.restaurantId = restaurantId;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalOrders = await Order.countDocuments(query);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: orders,
      pagination: {
        total: totalOrders,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalOrders / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting all orders:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log(`Fetching order with ID: ${orderId}`);
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log(`Order with ID ${orderId} not found`);
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    console.log(`Order found: ${order._id}, deliveryId: ${order.deliveryId}, deliveryPersonName: ${order.deliveryPersonName}`);
    
    // Check if user has permission to view this order
    if (
      req.user.role === 'customer' && order.user.toString() !== req.user.id
      // Removed check for restaurant_admin since we're handling that in the frontend
    ) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error getting order by ID:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get order',
      error: error.message
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, estimatedDeliveryTime } = req.body;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if user has permission to update this order
    if (
      req.user.role === 'customer'
      // Removed check for restaurant_admin since we're handling that in the frontend
    ) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    // Update order
    order.status = status;
    
    if (estimatedDeliveryTime) {
      order.estimatedDeliveryTime = new Date(estimatedDeliveryTime);
    }
    
    await order.save();
    
    // Publish order status updated event
    publishEvent('order.status_updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: order.user,
      restaurantId: order.restaurantId,
      status: order.status,
      estimatedDeliveryTime: order.estimatedDeliveryTime
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Order status updated',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { cancellationReason } = req.body;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Customers can only cancel their own orders
    if (req.user.role === 'customer' && order.user.toString() !== req.user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }
    
    // Removed check for restaurant_admin since we're handling that in the frontend
    
    // Cannot cancel orders that are already delivered
    if (order.status === 'delivered') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Cannot cancel an order that has been delivered'
      });
    }
    
    // Update order status to cancelled
    order.status = 'cancelled';
    order.specialInstructions = order.specialInstructions + 
      `\n[CANCELLED] ${new Date().toISOString()} - ${cancellationReason || 'No reason provided'}`;
    
    await order.save();
    
    // Publish order cancelled event
    publishEvent('order.cancelled', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: order.user,
      restaurantId: order.restaurantId,
      cancellationReason: cancellationReason || 'No reason provided',
      cancelledBy: req.user.role
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

// Get restaurant order statistics
const getRestaurantOrderStats = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Ensure user has permission to view restaurant orders
    if (req.user.role !== 'restaurant_admin' && req.user.role !== 'system_admin') {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Not authorized to view restaurant order statistics'
      });
    }
    
    // Removed check for restaurant_admin since we're handling that in the frontend
    
    // Define all possible statuses
    const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    
    // Get counts for each status
    const stats = {};
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get counts for each status
    for (const status of statuses) {
      // Total count
      stats[status] = await Order.countDocuments({ 
        restaurantId, 
        status 
      });
      
      // Today's count
      stats[`${status}_today`] = await Order.countDocuments({
        restaurantId,
        status,
        createdAt: { $gte: today }
      });
    }
    
    // Calculate total orders
    stats.total = await Order.countDocuments({ restaurantId });
    stats.total_today = await Order.countDocuments({ 
      restaurantId,
      createdAt: { $gte: today }
    });
    
    // Calculate active orders (not delivered or cancelled)
    stats.active = await Order.countDocuments({ 
      restaurantId,
      status: { $nin: ['delivered', 'cancelled'] }
    });
    
    // Revenue statistics
    const revenue = await Order.aggregate([
      { $match: { restaurantId, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    stats.total_revenue = revenue.length > 0 ? revenue[0].total : 0;
    
    // Today's revenue
    const todayRevenue = await Order.aggregate([
      { 
        $match: { 
          restaurantId, 
          status: 'delivered',
          createdAt: { $gte: today }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    stats.today_revenue = todayRevenue.length > 0 ? todayRevenue[0].total : 0;
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting restaurant order statistics:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get order statistics',
      error: error.message
    });
  }
};

// Update order details (for customers - only pending orders)
const updateOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryAddress, contactPhone, specialInstructions } = req.body;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Customers can only update their own orders
    if (req.user.role === 'customer' && order.user.toString() !== req.user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }
    
    // Can only update pending orders
    if (order.status !== 'pending') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Only pending orders can be updated'
      });
    }
    
    // Update order details
    if (deliveryAddress) {
      // Validate delivery address
      if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.zipCode) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Delivery address must include street, city, state, and zipCode'
        });
      }
      
      order.deliveryAddress = deliveryAddress;
    }
    
    if (contactPhone) {
      order.contactPhone = contactPhone;
    }
    
    if (specialInstructions !== undefined) {
      order.specialInstructions = specialInstructions;
    }
    
    await order.save();
    
    // Publish order updated event
    publishEvent('order.details_updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: order.user,
      restaurantId: order.restaurantId
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Order details updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order details:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update order details',
      error: error.message
    });
  }
};

// Update order delivery information
const updateOrderDeliveryInfo = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryId, deliveryPersonId, deliveryPersonName } = req.body;
    
    console.log(`Updating order ${orderId} with delivery info:`, { deliveryId, deliveryPersonId, deliveryPersonName });
    
    if (!deliveryId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Delivery ID is required'
      });
    }
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log(`Order with ID ${orderId} not found when updating delivery info`);
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Update order with delivery information
    order.deliveryId = deliveryId;
    
    if (deliveryPersonId) {
      order.deliveryPersonId = deliveryPersonId;
    }
    
    if (deliveryPersonName) {
      order.deliveryPersonName = deliveryPersonName;
    }
    
    await order.save();
    console.log(`Order ${orderId} updated with delivery info. New values:`, {
      deliveryId: order.deliveryId,
      deliveryPersonId: order.deliveryPersonId,
      deliveryPersonName: order.deliveryPersonName
    });
    
    // Publish order delivery assigned event
    publishEvent('order.delivery_assigned', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: order.user,
      restaurantId: order.restaurantId,
      deliveryId,
      deliveryPersonId,
      deliveryPersonName
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Order delivery information updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order delivery information:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update order delivery information',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getRestaurantOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getRestaurantOrderStats,
  updateOrderDetails,
  updateOrderDeliveryInfo
}; 