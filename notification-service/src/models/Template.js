const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['email', 'sms', 'push'],
    required: true
  },
  subject: {
    type: String,
    required: function() {
      return this.type === 'email';
    }
  },
  content: {
    type: String,
    required: true
  },
  variables: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
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

module.exports = mongoose.model('Template', templateSchema); 
 
 