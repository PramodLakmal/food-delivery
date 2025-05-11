import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiUser, FiTruck, FiCreditCard, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import * as deliveryService from '../../services/deliveryService';

const CompleteProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize form data with user information if available
  const [formData, setFormData] = useState(() => {
    console.log("User data for initialization:", user);
    return {
      vehicle: {
        type: '',
        model: '',
        color: '',
        licensePlate: ''
      },
      license: {
        number: '',
        expiryDate: ''
      },
      // Make sure phone is initialized properly from user data
      phone: user?.phone || ''
    };
  });

  // Fetch profile data on mount to check if we have any existing data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const profileData = await deliveryService.getDeliveryPersonProfile();
        if (profileData && profileData.data) {
          // If we have a phone number from the profile, use it
          if (profileData.data.phone) {
            setFormData(prev => ({
              ...prev,
              phone: profileData.data.phone
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };
    
    fetchProfileData();
  }, []);

  // Log form data whenever it changes
  useEffect(() => {
    console.log("Current form data:", formData);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested objects
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate form
      const { vehicle, license, phone } = formData;
      
      // Validate phone number
      if (!phone || phone.trim() === '') {
        toast.error('Please provide your phone number');
        setIsLoading(false);
        return;
      }
      
      if (!vehicle.type || !vehicle.model || !vehicle.color || !vehicle.licensePlate) {
        toast.error('Please fill in all vehicle information');
        setIsLoading(false);
        return;
      }
      
      if (!license.number || !license.expiryDate) {
        toast.error('Please fill in all license information');
        setIsLoading(false);
        return;
      }
      
      // Make sure expiry date is in the future
      const expiryDate = new Date(license.expiryDate);
      const today = new Date();
      if (expiryDate <= today) {
        toast.error('License expiry date must be in the future');
        setIsLoading(false);
        return;
      }
      
      console.log("Submitting profile data:", formData);
      
      // Submit form - ensure phone is a string and at the top level
      const response = await deliveryService.completeProfile({
        vehicle: formData.vehicle,
        license: formData.license,
        phone: String(formData.phone).trim() // Ensure phone is a string
      });
      
      console.log("Profile completion response:", response);
      
      if (response.success) {
        toast.success('Profile completed successfully!');
        // Wait a moment before redirecting
        setTimeout(() => {
          navigate('/delivery/dashboard');
        }, 1000);
      } else {
        toast.error(response.message || 'Failed to complete profile');
      }
    } catch (error) {
      console.error('Error completing profile:', error);
      
      // Check for specific validation errors
      if (error.response && error.response.data) {
        console.error('Error response data:', error.response.data);
        
        const errorMsg = error.response?.data?.error || '';
        const errorMessage = error.response?.data?.message || '';
        
        if (errorMsg.includes('phone') || errorMessage.includes('phone')) {
          toast.error('Valid phone number is required');
        } else if (errorMsg.includes('license.expiryDate')) {
          toast.error('Valid license expiry date is required');
        } else if (error.response.data.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Failed to complete profile. Please check all fields.');
        }
      } else {
        toast.error('Failed to complete profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Delivery Profile</h1>
          <p className="text-gray-600 mt-2">
            Please provide your vehicle and license information to start accepting deliveries
          </p>
        </div>
        
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-md">
            <div className="relative">
              <div className="flex items-center justify-between w-full">
                <div className="w-1/3 text-center">
                  <div className="w-10 h-10 mx-auto rounded-full bg-blue-500 flex items-center justify-center">
                    <FiUser className="text-white" />
                  </div>
                  <p className="mt-2 text-xs text-blue-500 font-medium">Account</p>
                </div>
                <div className="w-1/3 text-center">
                  <div className="w-10 h-10 mx-auto rounded-full bg-blue-500 flex items-center justify-center">
                    <FiTruck className="text-white" />
                  </div>
                  <p className="mt-2 text-xs text-blue-500 font-medium">Vehicle</p>
                </div>
                <div className="w-1/3 text-center">
                  <div className="w-10 h-10 mx-auto rounded-full bg-gray-300 flex items-center justify-center">
                    <FiCheckCircle className="text-white" />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 font-medium">Verification</p>
                </div>
              </div>
              <div className="absolute top-5 w-full">
                <div className="h-1 bg-gray-200">
                  <div className="h-1 bg-blue-500 w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiUser className="mr-2" /> Contact Information
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., +1 (555) 123-4567"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter a valid phone number where you can be contacted
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiTruck className="mr-2" /> Vehicle Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="vehicle.type" className="block text-sm font-medium text-gray-700">
                  Vehicle Type
                </label>
                <select
                  id="vehicle.type"
                  name="vehicle.type"
                  value={formData.vehicle.type}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Select Vehicle Type</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="car">Car</option>
                  <option value="scooter">Scooter</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="vehicle.model" className="block text-sm font-medium text-gray-700">
                  Vehicle Model
                </label>
                <input
                  type="text"
                  id="vehicle.model"
                  name="vehicle.model"
                  value={formData.vehicle.model}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Honda CBR 250R"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="vehicle.color" className="block text-sm font-medium text-gray-700">
                  Vehicle Color
                </label>
                <input
                  type="text"
                  id="vehicle.color"
                  name="vehicle.color"
                  value={formData.vehicle.color}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Black"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="vehicle.licensePlate" className="block text-sm font-medium text-gray-700">
                  License Plate
                </label>
                <input
                  type="text"
                  id="vehicle.licensePlate"
                  name="vehicle.licensePlate"
                  value={formData.vehicle.licensePlate}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., ABC 123"
                  required
                />
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiCreditCard className="mr-2" /> License Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="license.number" className="block text-sm font-medium text-gray-700">
                  License Number
                </label>
                <input
                  type="text"
                  id="license.number"
                  name="license.number"
                  value={formData.license.number}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., DL12345678"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="license.expiryDate" className="block text-sm font-medium text-gray-700">
                  Expiry Date
                </label>
                <input
                  type="date"
                  id="license.expiryDate"
                  name="license.expiryDate"
                  value={formData.license.expiryDate}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Submit and Continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfilePage; 