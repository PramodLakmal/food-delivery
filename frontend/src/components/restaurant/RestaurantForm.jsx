import { useState, useEffect, useRef } from 'react';
import { FiX, FiUpload, FiMapPin } from 'react-icons/fi';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const RestaurantForm = ({ restaurant, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    longitude: -73.935242,
    latitude: 40.730610, // Default to NYC
    phone: '',
    image: '',
    cuisineType: '',
    openingHours: {
      monday: { open: '', close: '' },
      tuesday: { open: '', close: '' },
      wednesday: { open: '', close: '' },
      thursday: { open: '', close: '' },
      friday: { open: '', close: '' },
      saturday: { open: '', close: '' },
      sunday: { open: '', close: '' }
    }
  });
  
  const [imagePreview, setImagePreview] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 40.730610, lng: -73.935242 });
  const fileInputRef = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  // Load restaurant data if editing
  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        longitude: restaurant.location?.coordinates[0] || -73.935242,
        latitude: restaurant.location?.coordinates[1] || 40.730610,
        phone: restaurant.phone || '',
        image: restaurant.image || '',
        cuisineType: restaurant.cuisineType || '',
        openingHours: restaurant.openingHours || {
          monday: { open: '', close: '' },
          tuesday: { open: '', close: '' },
          wednesday: { open: '', close: '' },
          thursday: { open: '', close: '' },
          friday: { open: '', close: '' },
          saturday: { open: '', close: '' },
          sunday: { open: '', close: '' }
        }
      });
      
      setImagePreview(restaurant.image || '');
      setMapCenter({ 
        lat: restaurant.location?.coordinates[1] || 40.730610, 
        lng: restaurant.location?.coordinates[0] || -73.935242 
      });
    }
  }, [restaurant]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Validate phone number format
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[0-9+\-\s()]{8,20}$/;
    return phoneRegex.test(phone);
  };
  
  const handleOpeningHoursChange = (day, type, value) => {
    setFormData({
      ...formData,
      openingHours: {
        ...formData.openingHours,
        [day]: {
          ...formData.openingHours[day],
          [type]: value
        }
      }
    });
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setFormData({ ...formData, image: base64String });
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };
  
  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    
    setFormData({
      ...formData,
      latitude: lat,
      longitude: lng
    });
    
    setMapCenter({ lat, lng });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate description length
    if (formData.description.length < 10) {
      alert('Description must be at least 10 characters long.');
      return;
    }
    
    // Validate phone number
    if (!validatePhoneNumber(formData.phone)) {
      alert('Phone number must be 8-20 characters and can only contain digits, +, -, spaces, or parentheses.');
      return;
    }
    
    // Get the current user from localStorage
    const userString = localStorage.getItem('user');
    let userId = null;
    
    if (userString) {
      try {
        const user = JSON.parse(userString);
        userId = user.id || user._id;
        console.log('Using user ID for restaurant:', userId);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }
    
    // Prepare the restaurant data with proper formatting
    const restaurantDataWithOwner = {
      ...formData,
      ownerId: userId,
      location: {
        type: 'Point',
        coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
      }
    };
    
    // Remove the separate longitude and latitude fields as they're now in the location object
    delete restaurantDataWithOwner.longitude;
    delete restaurantDataWithOwner.latitude;
    
    console.log('Submitting restaurant with data:', restaurantDataWithOwner);
    onSubmit(restaurantDataWithOwner);
  };
  
  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-semibold">
            {restaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="4"
                  required
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Cuisine Type *
                </label>
                <select
                  name="cuisineType"
                  value={formData.cuisineType}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Cuisine Type</option>
                  <option value="Italian">Italian</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Indian">Indian</option>
                  <option value="Mexican">Mexican</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Thai">Thai</option>
                  <option value="American">American</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="French">French</option>
                  <option value="Greek">Greek</option>
                  <option value="Spanish">Spanish</option>
                  <option value="Lebanese">Lebanese</option>
                  <option value="Turkish">Turkish</option>
                  <option value="Korean">Korean</option>
                  <option value="Vietnamese">Vietnamese</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Restaurant Image
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md flex items-center"
                  >
                    <FiUpload className="mr-2" /> Upload Image
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                {imagePreview && (
                  <div className="mt-2 relative">
                    <img
                      src={imagePreview}
                      alt="Restaurant preview"
                      className="w-full h-48 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, image: '' });
                        setImagePreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Location *
                </label>
                <p className="text-sm text-gray-600 mb-2">
                  <FiMapPin className="inline mr-1" /> Click on the map to set the restaurant location
                </p>
                <LoadScript
                  googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                  onLoad={() => setMapLoaded(true)}
                >
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={14}
                    onClick={handleMapClick}
                    onLoad={map => {
                      mapRef.current = map;
                    }}
                  >
                    <Marker position={mapCenter} />
                  </GoogleMap>
                </LoadScript>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1">
                      Latitude
                    </label>
                    <input
                      type="text"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1">
                      Longitude
                    </label>
                    <input
                      type="text"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      readOnly
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Opening Hours
                </label>
                <div className="space-y-2">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="grid grid-cols-3 gap-2 items-center">
                      <span className="text-sm capitalize">{day}</span>
                      <input
                        type="time"
                        value={formData.openingHours[day].open}
                        onChange={(e) => handleOpeningHoursChange(day, 'open', e.target.value)}
                        className="shadow appearance-none border rounded py-1 px-2 text-gray-700 text-sm leading-tight focus:outline-none focus:shadow-outline"
                      />
                      <input
                        type="time"
                        value={formData.openingHours[day].close}
                        onChange={(e) => handleOpeningHoursChange(day, 'close', e.target.value)}
                        className="shadow appearance-none border rounded py-1 px-2 text-gray-700 text-sm leading-tight focus:outline-none focus:shadow-outline"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6 space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : restaurant ? 'Update Restaurant' : 'Create Restaurant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestaurantForm; 
 
 
 
 