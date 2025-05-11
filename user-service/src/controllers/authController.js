const User = require('../models/User');
const { generateToken } = require('../utils/auth');
const { publishMessage } = require('../utils/messageBroker');
const crypto = require('crypto');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;
    
    // Check if user already exists with the email
    const existingUserEmail = await User.findOne({ email });
    if (existingUserEmail) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Check if user already exists with the phone number
    const existingUserPhone = await User.findOne({ phone });
    if (existingUserPhone) {
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }
    
    // Create a new user
    const user = new User({
      name,
      email,
      password,
      phone,
      address,
      role: role || 'customer' // Default to customer if no role provided
    });
    
    await user.save();
    
    // Notify about new user registration
    publishMessage('user.registered', {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    
    // Generate token
    const token = generateToken(user);
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// User login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is inactive. Please contact support.' });
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Log login activity
    publishMessage('user.login', {
      userId: user._id,
      email: user.email,
      timestamp: new Date()
    });
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user
    const user = await User.findById(req.user.id);
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Notify password change
    publishMessage('user.password_changed', {
      userId: user._id,
      email: user.email,
      timestamp: new Date()
    });
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update password', error: error.message });
  }
};

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  try {
    console.log('Password reset requested for:', req.body.email);
    const { email } = req.body;
    
    if (!email) {
      console.log('No email provided');
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(404).json({ message: 'User with this email does not exist' });
    }
    
    console.log('User found:', user._id);
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    console.log('Generated reset token');
    
    // Set token expiration (1 hour from now)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
    await user.save();
    console.log('User updated with reset token');
    
    // Check if frontend URL is properly configured
    if (!process.env.FRONTEND_URL) {
      console.error('FRONTEND_URL environment variable is not set');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    console.log('Reset URL created');
    
    // Send reset password email through message queue
    const messageData = {
      userId: user._id,
      name: user.name,
      email: user.email,
      resetToken,
      resetUrl
    };
    
    console.log('Publishing message to user.password_reset_requested');
    const published = publishMessage('user.password_reset_requested', messageData);
    
    if (!published) {
      console.error('Failed to publish message to queue');
      return res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
    }
    
    console.log('Reset email message published successfully');
    res.status(200).json({ message: 'Password reset email sent. Please check your inbox.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Failed to process reset request', error: error.message });
  }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Find user by token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }
    
    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    
    await user.save();
    
    // Notify password reset
    publishMessage('user.password_reset_completed', {
      userId: user._id,
      email: user.email,
      timestamp: new Date()
    });
    
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
};

// Verify password reset token
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find user by token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ valid: false, message: 'Password reset token is invalid or has expired' });
    }
    
    res.status(200).json({ valid: true, message: 'Token is valid' });
  } catch (error) {
    res.status(500).json({ valid: false, message: 'Failed to verify token', error: error.message });
  }
}; 