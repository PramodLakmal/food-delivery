const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['email', 'sms', 'push'],
    required: true
  },
  template: {
    type: String,
    required: true
  },
  content: {
    subject: String,
    body: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  sentAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema); 
 
 