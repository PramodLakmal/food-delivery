import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserById, updateUser } from '../services/userService';
import { changePassword } from '../services/authService';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiSave, FiLoader } from 'react-icons/fi';

const ProfilePage = () => {
  const { user, updateUser: updateAuthUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await getUserById(user.id);
        const fetchedUser = response.user;
        setUserProfile(fetchedUser);
        
        // Initialize form data
        setFormData({
          name: fetchedUser.name || '',
          phone: fetchedUser.phone || '',
          address: {
            street: fetchedUser.address?.street || '',
            city: fetchedUser.address?.city || '',
            state: fetchedUser.address?.state || '',
            zipCode: fetchedUser.address?.zipCode || '',
            country: fetchedUser.address?.country || ''
          }
        });
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.id) {
      fetchUserProfile();
    }
  }, [user?.id]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };
  
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (saving) return;
    
    try {
      setSaving(true);
      const response = await updateUser(user.id, formData);
      
      // Update profile in state
      setUserProfile(response.user);
      
      // Update auth context
      updateAuthUser(response.user);
      
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (saving) return;
    
    // Validate password
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      setSaving(true);
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setShowChangePassword(false);
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and preferences</p>
            </div>
            {!editMode && (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit Profile
              </button>
            )}
          </div>
          
          {editMode ? (
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-10 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-700 flex items-center">
                    <FiMapPin className="mr-2" /> Address Information
                  </h4>
                  
                  <div>
                    <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                      Street
                    </label>
                    <input
                      type="text"
                      name="address.street"
                      id="street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <input
                        type="text"
                        name="address.city"
                        id="city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                        State
                      </label>
                      <input
                        type="text"
                        name="address.state"
                        id="state"
                        value={formData.address.state}
                        onChange={handleInputChange}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                        ZIP / Postal Code
                      </label>
                      <input
                        type="text"
                        name="address.zipCode"
                        id="zipCode"
                        value={formData.address.zipCode}
                        onChange={handleInputChange}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                        Country
                      </label>
                      <input
                        type="text"
                        name="address.country"
                        id="country"
                        value={formData.address.country}
                        onChange={handleInputChange}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                  >
                    {saving ? (
                      <>
                        <FiLoader className="animate-spin h-4 w-4 mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {userProfile?.name}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {userProfile?.email}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {userProfile?.phone}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {userProfile?.address?.street && (
                      <>
                        {userProfile.address.street}
                        <br />
                        {userProfile.address.city}{userProfile.address.state ? `, ${userProfile.address.state}` : ''}
                        {' '}
                        {userProfile.address.zipCode}
                        <br />
                        {userProfile.address.country}
                      </>
                    )}
                    {!userProfile?.address?.street && <span className="text-gray-500">No address provided</span>}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {userProfile?.role === 'customer' && 'Customer'}
                      {userProfile?.role === 'restaurant_admin' && 'Restaurant Admin'}
                      {userProfile?.role === 'delivery_person' && 'Delivery Person'}
                      {userProfile?.role === 'system_admin' && 'System Admin'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          )}
          
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FiLock className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg leading-6 font-medium text-gray-900">Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {showChangePassword ? 'Cancel' : 'Change Password'}
              </button>
            </div>
            
            {showChangePassword && (
              <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                  >
                    {saving ? (
                      <>
                        <FiLoader className="animate-spin h-4 w-4 mr-2" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 
 
 