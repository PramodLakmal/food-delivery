const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const amqp = require('amqplib');
const { validateMenuItem } = require('../utils/validation');
const { publishEvent } = require('../utils/messageBroker');

let channel;

// Connect to RabbitMQ
const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue('menu_item_events');
    console.log('Connected to RabbitMQ for menu items');
  } catch (error) {
    console.error('RabbitMQ connection error:', error);
    setTimeout(connectRabbitMQ, 5000); // Retry after 5 seconds
  }
};

connectRabbitMQ();

// Get all menu items with pagination and filtering
exports.getAllMenuItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category, isAvailable } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add category filter if provided
    if (category) {
      query.category = category;
    }
    
    // Add availability filter if provided
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }
    
    // Execute query with pagination
    const menuItems = await MenuItem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await MenuItem.countDocuments(query);
    
    res.status(200).json({
      menuItems,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get menu item by ID
exports.getMenuItemById = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.status(200).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get menu items by restaurant ID
exports.getMenuItemsByRestaurant = async (req, res) => {
  try {
    console.log('Getting menu items for restaurant:', req.params.restaurantId);
    
    // Query using $or to match either restaurant or restaurantId
    const menuItems = await MenuItem.find({
      $or: [
        { restaurant: req.params.restaurantId },
        { restaurantId: req.params.restaurantId }
      ]
    });
    
    console.log(`Found ${menuItems.length} menu items for restaurant ${req.params.restaurantId}`);
    res.status(200).json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items by restaurant:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create new menu item
exports.createMenuItem = async (req, res) => {
  try {
    // Validate request body
    const { error } = validateMenuItem(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    // Create new menu item
    const menuItem = new MenuItem(req.body);
    const savedMenuItem = await menuItem.save();
    
    // Publish menu item created event
    await publishEvent('menu_item.created', {
      menuItemId: savedMenuItem._id,
      name: savedMenuItem.name,
      restaurantId: savedMenuItem.restaurantId,
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json(savedMenuItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update menu item
exports.updateMenuItem = async (req, res) => {
  try {
    // Validate request body
    const { error } = validateMenuItem(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    // Make sure restaurantId is not changed
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    // Update menu item with preserving the original restaurantId if not provided
    const updateData = {
      ...req.body,
      restaurantId: req.body.restaurantId || menuItem.restaurantId
    };
    
    // Find and update menu item
    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Publish menu item updated event
    await publishEvent('menu_item.updated', {
      menuItemId: updatedMenuItem._id,
      name: updatedMenuItem.name,
      restaurantId: updatedMenuItem.restaurantId,
      changes: Object.keys(req.body),
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json(updatedMenuItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    // Store menu item info before deletion
    const menuItemInfo = {
      menuItemId: menuItem._id,
      name: menuItem.name,
      restaurantId: menuItem.restaurantId,
      timestamp: new Date().toISOString()
    };
    
    await MenuItem.findByIdAndDelete(req.params.id);
    
    // Publish menu item deleted event
    await publishEvent('menu_item.deleted', menuItemInfo);
    
    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle menu item availability
exports.toggleMenuItemAvailability = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    // Toggle availability
    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();
    
    // Publish menu item availability changed event
    await publishEvent('menu_item.availability_changed', {
      menuItemId: menuItem._id,
      name: menuItem.name,
      restaurantId: menuItem.restaurantId,
      isAvailable: menuItem.isAvailable,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json(menuItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 
 
 
 
 