const Template = require('../models/Template');

// Get a template by name
const getTemplate = async (name) => {
  try {
    const template = await Template.findOne({ name, isActive: true });
    
    if (!template) {
      throw new Error(`Template '${name}' not found or inactive`);
    }
    
    return template;
  } catch (error) {
    console.error('Error fetching template:', error.message);
    throw error;
  }
};

// Render a template with dynamic data
const renderTemplate = async (templateName, data) => {
  try {
    const template = await getTemplate(templateName);
    
    let renderedContent = template.content;
    let renderedSubject = template.subject || '';
    
    // Replace variables in content
    for (const key in data) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      renderedContent = renderedContent.replace(regex, data[key]);
      
      if (renderedSubject) {
        renderedSubject = renderedSubject.replace(regex, data[key]);
      }
    }
    
    return {
      type: template.type,
      subject: renderedSubject,
      content: renderedContent
    };
  } catch (error) {
    console.error('Error rendering template:', error.message);
    throw error;
  }
};

// Create a new template
const createTemplate = async (templateData) => {
  try {
    const template = new Template(templateData);
    await template.save();
    return template;
  } catch (error) {
    console.error('Error creating template:', error.message);
    throw error;
  }
};

// Update an existing template
const updateTemplate = async (id, templateData) => {
  try {
    const template = await Template.findByIdAndUpdate(
      id,
      { ...templateData, updatedAt: new Date() },
      { new: true }
    );
    
    if (!template) {
      throw new Error(`Template with ID '${id}' not found`);
    }
    
    return template;
  } catch (error) {
    console.error('Error updating template:', error.message);
    throw error;
  }
};

// Create or update a template by name
const createOrUpdateTemplate = async (templateData) => {
  try {
    // Check if template exists
    const existingTemplate = await Template.findOne({ name: templateData.name });
    
    if (existingTemplate) {
      // Update existing template
      await Template.updateOne(
        { name: templateData.name },
        { ...templateData, updatedAt: new Date() }
      );
      console.log(`Updated template: ${templateData.name}`);
    } else {
      // Create new template
      await createTemplate(templateData);
      console.log(`Created template: ${templateData.name}`);
    }
  } catch (error) {
    console.error(`Error creating/updating template ${templateData.name}:`, error.message);
    throw error;
  }
};

// Seed default templates
const seedDefaultTemplates = async () => {
  try {
    // Define welcome email template
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
    
    // Define order confirmation email template
    const orderConfirmationTemplate = {
      name: 'order_confirmation',
      type: 'email',
      subject: 'Your Order #{{orderId}} Confirmation',
      content: `
        <h1>Order Confirmation</h1>
        <p>Hi {{name}},</p>
        <p>Your order #{{orderId}} has been received and is being processed.</p>
        <p>Order Details:</p>
        <ul>
          <li>Order ID: {{orderId}}</li>
          <li>Restaurant: {{restaurant}}</li>
          <li>Total Amount: ${{amount}}</li>
          <li>Estimated Delivery Time: {{deliveryTime}}</li>
        </ul>
        <p>Thank you for your order!</p>
        <p>Best regards,<br>The Food Ordering Team</p>
      `,
      variables: ['name', 'orderId', 'restaurant', 'amount', 'deliveryTime'],
      isActive: true
    };
    
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
    
    // Ensure welcome email template exists and is up to date
    await createOrUpdateTemplate(welcomeEmailTemplate);
    
    // Ensure order confirmation template exists and is up to date
    await createOrUpdateTemplate(orderConfirmationTemplate);
    
    // Ensure password reset template exists and is up to date
    await createOrUpdateTemplate(passwordResetTemplate);
    
    console.log('Default templates seeded successfully');
  } catch (error) {
    console.error('Error seeding default templates:', error.message);
  }
};

module.exports = {
  getTemplate,
  renderTemplate,
  createTemplate,
  updateTemplate,
  seedDefaultTemplates
}; 
 
 