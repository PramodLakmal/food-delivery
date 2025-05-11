const User = require('../models/User');
const { publishMessage } = require('../utils/messageBroker');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get users', error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user', error: error.message });
  }
};

// Update user profile
exports.updateUser = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    
    // Find user by ID
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has permission to update this profile
    if (req.user.id !== req.params.id && req.user.role !== 'system_admin') {
      return res.status(403).json({ message: 'Access denied: You can only update your own profile' });
    }
    
    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    
    await user.save();
    
    // Notify about user update
    publishMessage('user.updated', {
      userId: user._id,
      name: user.name,
      email: user.email
    });
    
    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

// Change user role (admin only)
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    // Validate role
    const validRoles = ['customer', 'restaurant_admin', 'delivery_person', 'system_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Find user by ID
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update role
    user.role = role;
    await user.save();
    
    // Notify about role change
    publishMessage('user.role_changed', {
      userId: user._id,
      email: user.email,
      oldRole: user.role,
      newRole: role
    });
    
    res.status(200).json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
};

// Deactivate/activate user (admin only)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    // Find user by ID
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Toggle status
    user.isActive = isActive;
    await user.save();
    
    // Notify about status change
    publishMessage('user.status_changed', {
      userId: user._id,
      email: user.email,
      isActive: user.isActive
    });
    
    res.status(200).json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user status', error: error.message });
  }
}; 
 
 