const Notification = require('../models/Notification');
const Template = require('../models/Template');
const emailService = require('../services/emailService');
const templateService = require('../services/templateService');

// Get all notifications
exports.getAllNotifications = async (req, res) => {
  try {
    const { userId, status, type, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (type) query.type = type;
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Find notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Count total
    const total = await Notification.countDocuments(query);
    
    res.status(200).json({
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get notifications', error: error.message });
  }
};

// Get notification by ID
exports.getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.status(200).json({ notification });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get notification', error: error.message });
  }
};

// Send a notification using a template
exports.sendNotification = async (req, res) => {
  try {
    const { templateName, to, data, userId } = req.body;
    
    if (!templateName || !to || !data) {
      return res.status(400).json({ message: 'Template name, recipient and data are required' });
    }
    
    // Render template
    const rendered = await templateService.renderTemplate(templateName, data);
    
    // Send based on template type
    let result;
    if (rendered.type === 'email') {
      result = await emailService.sendEmail(to, rendered.subject, rendered.content, {
        userId,
        template: templateName,
        data
      });
    } else {
      return res.status(400).json({ message: `Notification type ${rendered.type} not implemented` });
    }
    
    if (!result.success) {
      return res.status(500).json({ message: 'Failed to send notification', error: result.error });
    }
    
    res.status(200).json({
      message: 'Notification sent successfully',
      result
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send notification', error: error.message });
  }
};

// Get all templates
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await Template.find();
    res.status(200).json({ templates });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get templates', error: error.message });
  }
};

// Get template by ID
exports.getTemplateById = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.status(200).json({ template });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get template', error: error.message });
  }
};

// Create a new template
exports.createTemplate = async (req, res) => {
  try {
    const templateData = req.body;
    
    const template = await templateService.createTemplate(templateData);
    
    res.status(201).json({
      message: 'Template created successfully',
      template
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create template', error: error.message });
  }
};

// Update a template
exports.updateTemplate = async (req, res) => {
  try {
    const templateData = req.body;
    
    const template = await templateService.updateTemplate(req.params.id, templateData);
    
    res.status(200).json({
      message: 'Template updated successfully',
      template
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update template', error: error.message });
  }
}; 
 
 