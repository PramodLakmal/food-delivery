const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

// Create transporter with updated SMTP settings
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Test connection
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('Email service is connected');
    return true;
  } catch (error) {
    console.error('Email service connection error:', error.message);
    return false;
  }
};

// Send email
const sendEmail = async (to, subject, html, metadata = {}) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    });
    
    // Create notification record
    const notification = new Notification({
      userId: metadata.userId || 'system',
      type: 'email',
      template: metadata.template || 'custom',
      content: {
        subject,
        body: html
      },
      metadata,
      status: 'sent',
      sentAt: new Date()
    });
    
    await notification.save();
    
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error.message);
    
    // Create failed notification record
    const notification = new Notification({
      userId: metadata.userId || 'system',
      type: 'email',
      template: metadata.template || 'custom',
      content: {
        subject,
        body: html
      },
      metadata,
      status: 'failed'
    });
    
    await notification.save();
    
    return { success: false, error: error.message };
  }
};

module.exports = {
  verifyConnection,
  sendEmail
}; 
 
 