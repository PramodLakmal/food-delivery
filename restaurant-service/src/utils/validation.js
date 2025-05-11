const Joi = require('joi');
const mongoose = require('mongoose');

// Validate restaurant data
exports.validateRestaurant = (data) => {
  // Create a schema that supports both coordinate formats
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).max(1000).required(),
    address: Joi.string().min(5).max(200).required(),
    // Support both direct coordinates and location object
    longitude: Joi.number().min(-180).max(180).optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    location: Joi.object({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: Joi.array().items(Joi.number()).length(2).optional()
    }).optional(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]{8,20}$/).required(),
    image: Joi.string().allow('').optional(),
    cuisineType: Joi.string().required(),
    // Support both owner fields for backward compatibility
    owner: Joi.alternatives().try(
      Joi.string(),
      Joi.object().instance(mongoose.Types.ObjectId)
    ).optional(),
    ownerId: Joi.string().optional(),
    openingHours: Joi.object({
      monday: Joi.object({
        open: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow('').optional(),
        close: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow('').optional()
      }).optional(),
      tuesday: Joi.object({
        open: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow('').optional(),
        close: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow('').optional()
      }).optional(),
      wednesday: Joi.object({
        open: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow('').optional(),
        close: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow('').optional()
      }).optional(),
      thursday: Joi.object({
        open: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow('').optional(),
        close: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow('').optional()
      }).optional(),
      friday: Joi.object({
        open: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow('').optional(),
        close: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow('').optional()
      }).optional(),
      saturday: Joi.object({
        open: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow('').optional(),
        close: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow('').optional()
      }).optional(),
      sunday: Joi.object({
        open: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow('').optional(),
        close: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow('').optional()
      }).optional()
    }).optional(),
    isActive: Joi.boolean().optional(),
    deactivationReason: Joi.string().allow(null, '').optional()
  });

  // Custom validation to ensure either direct coordinates or location object is provided
  const { error, value } = schema.validate(data);
  
  if (!error) {
    // If we have longitude and latitude but no location, add it
    if ((data.longitude !== undefined && data.latitude !== undefined) && 
        (!data.location || !data.location.coordinates)) {
      value.location = {
        type: 'Point',
        coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)]
      };
    }
  }

  return { error, value };
};

// Validate menu item data
exports.validateMenuItem = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().min(5).max(500).required(),
    price: Joi.number().min(0).required(),
    image: Joi.string().allow('').optional(),
    category: Joi.string().required(),
    restaurantId: Joi.string().required(),
    preparationTime: Joi.number().min(1).max(180).optional(),
    isVegetarian: Joi.boolean().optional(),
    isVegan: Joi.boolean().optional(),
    isGlutenFree: Joi.boolean().optional(),
    spicyLevel: Joi.number().min(0).max(5).optional(),
    isAvailable: Joi.boolean().optional()
  });

  return schema.validate(data);
}; 
 
 
 
 