const emailService = require('../services/emailService');
const templateService = require('../services/templateService');

// Handler for user registration
const handleUserRegistered = async (data) => {
  try {
    console.log('Processing user.registered event:', data);
    
    const { name, email, userId } = data;
    
    // First make sure the template exists by recreating it if necessary
    const welcomeEmailTemplate = {
      name: 'welcome_email',
      type: 'email',
      subject: 'Welcome to Food Ordering System',
      content: `
        <h1>Welcome, {{name}}!</h1>
        <p>Thank you for joining our Food Ordering System. We're excited to have you onboard!</p>
        <p>Your account has been successfully created with the email: {{email}}</p>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The Food Ordering Team</p>
      `,
      variables: ['name', 'email'],
      isActive: true
    };
    
    // Try to directly use the template from the database, but if that fails, recreate it
    try {
      // Render welcome email template
      const rendered = await templateService.renderTemplate('welcome_email', {
        name: name,
        email: email
      });
      
      // Send email
      await emailService.sendEmail(email, rendered.subject, rendered.content, {
        userId,
        template: 'welcome_email',
        event: 'user.registered'
      });
      
      console.log('Welcome email sent to:', email);
    } catch (error) {
      console.log('Failed to use existing template, attempting to recreate it...');
      
      // Create or update the template
      await templateService.createTemplate(welcomeEmailTemplate);
      
      // Try again with fresh template
      try {
        const rendered = await templateService.renderTemplate('welcome_email', {
          name: name,
          email: email
        });
        
        // Send email
        await emailService.sendEmail(email, rendered.subject, rendered.content, {
          userId,
          template: 'welcome_email',
          event: 'user.registered'
        });
        
        console.log('Welcome email sent to:', email);
      } catch (retryError) {
        console.error('Failed to send welcome email after recreation:', retryError.message);
      }
    }
  } catch (error) {
    console.error('Error handling user.registered event:', error.message);
  }
};

// Handler for password changed
const handlePasswordChanged = async (data) => {
  try {
    console.log('Processing user.password_changed event:', data);
    
    const { email, userId } = data;
    
    // Simple email without template for now
    const subject = 'Password Changed - Food Ordering System';
    const html = `
      <h1>Password Changed</h1>
      <p>Your password was recently changed on your Food Ordering System account.</p>
      <p>If you did not make this change, please contact our support team immediately.</p>
    `;
    
    // Send email
    await emailService.sendEmail(email, subject, html, {
      userId,
      event: 'user.password_changed'
    });
    
    console.log('Password changed email sent to:', email);
  } catch (error) {
    console.error('Error handling user.password_changed event:', error.message);
  }
};

// Handler for password reset request
const handlePasswordResetRequested = async (data) => {
  try {
    console.log('Processing user.password_reset_requested event:', data);
    
    const { name, email, userId, resetToken, resetUrl } = data;
    
    // Define password reset email template
    const passwordResetTemplate = {
      name: 'password_reset_email',
      type: 'email',
      subject: 'Password Reset Request',
      content: `
        <h1>Password Reset Request</h1>
        <p>Hello {{name}},</p>
        <p>We received a request to reset your password. To reset your password, click on the link below:</p>
        <p><a href="{{resetUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Your Password</a></p>
        <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>The Food Ordering Team</p>
      `,
      variables: ['name', 'email', 'resetUrl'],
      isActive: true
    };
    
    // Try to directly use the template from the database, but if that fails, recreate it
    try {
      // Render password reset email template
      const rendered = await templateService.renderTemplate('password_reset_email', {
        name: name || 'Valued Customer',
        email: email,
        resetUrl: resetUrl
      });
      
      // Send email
      await emailService.sendEmail(email, rendered.subject, rendered.content, {
        userId,
        template: 'password_reset_email',
        event: 'user.password_reset_requested'
      });
      
      console.log('Password reset email sent to:', email);
    } catch (error) {
      console.log('Failed to use existing template, attempting to recreate it...', error.message);
      
      // Create or update the template
      await templateService.createTemplate(passwordResetTemplate);
      
      // Try again with fresh template
      try {
        const rendered = await templateService.renderTemplate('password_reset_email', {
          name: name || 'Valued Customer',
          email: email,
          resetUrl: resetUrl
        });
        
        // Send email
        await emailService.sendEmail(email, rendered.subject, rendered.content, {
          userId,
          template: 'password_reset_email',
          event: 'user.password_reset_requested'
        });
        
        console.log('Password reset email sent to:', email);
      } catch (retryError) {
        console.error('Failed to send password reset email after recreation:', retryError.message);
      }
    }
  } catch (error) {
    console.error('Error handling user.password_reset_requested event:', error.message);
  }
};

// Handler for password reset completion
const handlePasswordResetCompleted = async (data) => {
  try {
    console.log('Processing user.password_reset_completed event:', data);
    
    const { email, userId } = data;
    
    // Send a simple notification email
    const subject = 'Your Password Has Been Reset';
    const html = `
      <h1>Password Reset Successful</h1>
      <p>Hello,</p>
      <p>Your password has been successfully reset.</p>
      <p>If you did not initiate this password reset, please contact our support team immediately.</p>
      <p>Best regards,<br>The Food Ordering Team</p>
    `;
    
    await emailService.sendEmail(email, subject, html, {
      userId,
      template: 'password_reset_completed',
      event: 'user.password_reset_completed'
    });
    
    console.log('Password reset confirmation email sent to:', email);
  } catch (error) {
    console.error('Error handling user.password_reset_completed event:', error.message);
  }
};

// Handler for new order
const handleOrderCreated = async (data) => {
  try {
    console.log('Processing order.created event:', data);
    
    const { order, customer } = data;
    
    // Render order confirmation email template
    const rendered = await templateService.renderTemplate('order_confirmation', {
      name: customer.name,
      orderId: order.id,
      restaurant: order.restaurant.name,
      amount: order.totalAmount.toFixed(2),
      deliveryTime: order.estimatedDeliveryTime
    });
    
    // Send email
    await emailService.sendEmail(customer.email, rendered.subject, rendered.content, {
      userId: customer.id,
      template: 'order_confirmation',
      event: 'order.created',
      orderId: order.id
    });
    
    console.log('Order confirmation email sent to:', customer.email);
  } catch (error) {
    console.error('Error handling order.created event:', error.message);
  }
};

// Handler for user login
const handleUserLogin = async (data) => {
  try {
    console.log('Processing user.login event:', data);
    // Currently just logging the login - could implement login notification in the future
    // No need to send an email for each login
  } catch (error) {
    console.error('Error handling user.login event:', error.message);
  }
};

// Map of event handlers
const eventHandlers = {
  'user.registered': handleUserRegistered,
  'user.password_changed': handlePasswordChanged,
  'user.password_reset_requested': handlePasswordResetRequested,
  'user.password_reset_completed': handlePasswordResetCompleted,
  'user.login': handleUserLogin,
  'order.created': handleOrderCreated
};

// Process events
const processEvent = (routingKey, data) => {
  const handler = eventHandlers[routingKey];
  
  if (handler) {
    handler(data);
  } else {
    console.log(`No handler for event: ${routingKey}`);
  }
};

module.exports = {
  processEvent,
  eventHandlers
}; 
 
 