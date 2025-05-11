const express = require('express');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// Notification routes
router.get('/', notificationController.getAllNotifications);
router.get('/:id', notificationController.getNotificationById);
router.post('/send', notificationController.sendNotification);

// Template routes
router.get('/templates', notificationController.getAllTemplates);
router.get('/templates/:id', notificationController.getTemplateById);
router.post('/templates', notificationController.createTemplate);
router.put('/templates/:id', notificationController.updateTemplate);

module.exports = router; 
 
 