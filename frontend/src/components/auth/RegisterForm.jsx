import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiMail, FiLock, FiUser, FiPhone, FiLoader, FiBriefcase } from 'react-icons/fi';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e) => {
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
    
    // Clear errors when user starts typing again
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.address.street.trim()) {
      newErrors['address.street'] = 'Street is required';
    }
    
    if (!formData.address.city.trim()) {
      newErrors['address.city'] = 'City is required';
    }
    
    if (!formData.address.zipCode.trim()) {
      newErrors['address.zipCode'] = 'Zip code is required';
    }
    
    if (!formData.address.country.trim()) {
      newErrors['address.country'] = 'Country is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNextStep = (e) => {
    e.preventDefault();
    
    if (validateStep1()) {
      setStep(2);
    }
  };
  
  const handlePreviousStep = () => {
    setStep(1);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateStep2()) {
      setIsSubmitting(true);
      
      try {
        await register(formData);
        navigate('/');
      } catch (error) {
        console.error('Registration error:', error);
        setErrors({
          form: error.message || 'Registration failed. Please try again.'
        });
        setStep(1);
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  return (
    <div className="min-h-full bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-5">
            <div className="flex items-center justify-between">
              <div className={`flex-1 border-t-2 ${step >= 1 ? 'border-blue-500' : 'border-gray-200'}`}></div>
              <div className={`w-8 h-8 flex items-center justify-center rounded-full font-medium ${
                step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`flex-1 border-t-2 ${step >= 2 ? 'border-blue-500' : 'border-gray-200'}`}></div>
              <div className={`w-8 h-8 flex items-center justify-center rounded-full font-medium ${
                step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <div className="flex-1 border-t-2 border-gray-200"></div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500">Account Details</span>
              <span className="text-xs text-gray-500">Address Information</span>
            </div>
          </div>
          
          {errors.form && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
              <p>{errors.form}</p>
            </div>
          )}
          
          {step === 1 && (
            <form className="space-y-6" onSubmit={handleNextStep}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`pl-10 py-2 block w-full border ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`pl-10 py-2 block w-full border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`pl-10 py-2 block w-full border ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`pl-10 py-2 block w-full border ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Register as
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiBriefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`pl-10 py-2 block w-full border ${
                      errors.role ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                  >
                    <option value="customer">Customer</option>
                    <option value="restaurant_admin">Restaurant Owner</option>
                    <option value="delivery_person">Delivery Person</option>
                  </select>
                </div>
                {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
              </div>
              
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next
                </button>
              </div>
            </form>
          )}
          
          {step === 2 && (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <input
                  id="street"
                  name="address.street"
                  type="text"
                  value={formData.address.street}
                  onChange={handleChange}
                  className={`mt-1 py-2 px-3 block w-full border ${
                    errors['address.street'] ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="123 Main St"
                />
                {errors['address.street'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['address.street']}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    id="city"
                    name="address.city"
                    type="text"
                    value={formData.address.city}
                    onChange={handleChange}
                    className={`mt-1 py-2 px-3 block w-full border ${
                      errors['address.city'] ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Anytown"
                  />
                  {errors['address.city'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['address.city']}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State / Province
                  </label>
                  <input
                    id="state"
                    name="address.state"
                    type="text"
                    value={formData.address.state}
                    onChange={handleChange}
                    className="mt-1 py-2 px-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="CA"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                    ZIP / Postal Code
                  </label>
                  <input
                    id="zipCode"
                    name="address.zipCode"
                    type="text"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    className={`mt-1 py-2 px-3 block w-full border ${
                      errors['address.zipCode'] ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="12345"
                  />
                  {errors['address.zipCode'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['address.zipCode']}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <input
                    id="country"
                    name="address.country"
                    type="text"
                    value={formData.address.country}
                    onChange={handleChange}
                    className={`mt-1 py-2 px-3 block w-full border ${
                      errors['address.country'] ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="United States"
                  />
                  {errors['address.country'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['address.country']}</p>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="animate-spin h-5 w-5 mr-2" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterForm; 
 
 