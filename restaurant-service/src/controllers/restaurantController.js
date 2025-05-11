const Restaurant = require('../models/Restaurant');
const { validateRestaurant } = require('../utils/validation');
const { publishEvent } = require('../utils/messageBroker');

// Get all restaurants with pagination and filtering
exports.getAllRestaurants = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', isActive } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { cuisineType: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add active filter if provided
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Execute query with pagination
    const restaurants = await Restaurant.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Restaurant.countDocuments(query);
    
    res.status(200).json({
      restaurants,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get restaurant by ID
exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    res.status(200).json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get restaurants by owner ID
exports.getRestaurantsByOwner = async (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    console.log(`Fetching restaurants for owner ID: ${ownerId}`);
    
    // Query for restaurants with either owner or ownerId matching
    const restaurants = await Restaurant.find({
      $or: [
        { owner: ownerId },
        { ownerId: ownerId }
      ]
    });
    
    console.log(`Found ${restaurants.length} restaurants for owner ${ownerId}`);
    res.status(200).json(restaurants);
  } catch (error) {
    console.error(`Error fetching restaurants by owner: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// Create new restaurant
exports.createRestaurant = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = validateRestaurant(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    // Create new restaurant with validated data
    const restaurant = new Restaurant(value);
    const savedRestaurant = await restaurant.save();
    
    // Publish restaurant created event
    await publishEvent('restaurant.created', {
      restaurantId: savedRestaurant._id,
      name: savedRestaurant.name,
      ownerId: savedRestaurant.ownerId || savedRestaurant.owner,
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json(savedRestaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update restaurant
exports.updateRestaurant = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = validateRestaurant(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    // Find and update restaurant with validated data
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true, runValidators: true }
    );
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Publish restaurant updated event
    await publishEvent('restaurant.updated', {
      restaurantId: restaurant._id,
      name: restaurant.name,
      ownerId: restaurant.ownerId || restaurant.owner,
      changes: Object.keys(req.body),
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json(restaurant);
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete restaurant
exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Store restaurant info before deletion
    const restaurantInfo = {
      restaurantId: restaurant._id,
      name: restaurant.name,
      ownerId: restaurant.ownerId,
      timestamp: new Date().toISOString()
    };
    
    await Restaurant.findByIdAndDelete(req.params.id);
    
    // Publish restaurant deleted event
    await publishEvent('restaurant.deleted', restaurantInfo);
    
    res.status(200).json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle restaurant active status
exports.toggleRestaurantStatus = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Toggle status
    restaurant.isActive = !restaurant.isActive;
    await restaurant.save();
    
    // Publish restaurant status changed event
    await publishEvent('restaurant.status_changed', {
      restaurantId: restaurant._id,
      name: restaurant.name,
      ownerId: restaurant.ownerId,
      isActive: restaurant.isActive,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json(restaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 
 
 
 
 