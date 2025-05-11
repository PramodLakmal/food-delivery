import { FiX, FiPhone, FiMapPin, FiClock } from 'react-icons/fi';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const RestaurantDetails = ({ restaurant, onClose }) => {
  const formatTime = (timeString) => {
    if (!timeString) return 'Closed';
    return timeString;
  };

  const mapContainerStyle = {
    width: '100%',
    height: '300px'
  };

  const center = {
    lat: restaurant.location?.coordinates[1] || 40.730610,
    lng: restaurant.location?.coordinates[0] || -73.935242
  };

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-semibold">{restaurant.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {restaurant.image ? (
                <img 
                  src={restaurant.image} 
                  alt={restaurant.name} 
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg mb-4">
                  <span className="text-gray-400">No Image Available</span>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">About</h3>
                <p className="text-gray-600">{restaurant.description}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Contact Information</h3>
                <div className="flex items-start mb-2">
                  <FiMapPin className="text-gray-500 mt-1 mr-2" />
                  <span className="text-gray-600">{restaurant.address}</span>
                </div>
                <div className="flex items-center">
                  <FiPhone className="text-gray-500 mr-2" />
                  <span className="text-gray-600">{restaurant.phone}</span>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cuisine</p>
                    <p className="text-gray-700">{restaurant.cuisineType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className={`${restaurant.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {restaurant.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Location</h3>
                <LoadScript
                  googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                >
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={14}
                  >
                    <Marker position={center} />
                  </GoogleMap>
                </LoadScript>
                <div className="text-sm text-gray-500 mt-2">
                  Coordinates: {restaurant.location?.coordinates[1]}, {restaurant.location?.coordinates[0]}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <FiClock className="mr-2" /> Opening Hours
                </h3>
                <div className="space-y-2">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="flex justify-between">
                      <span className="text-gray-700 capitalize">{day}</span>
                      <span className="text-gray-600">
                        {restaurant.openingHours && restaurant.openingHours[day]?.open && restaurant.openingHours[day]?.close 
                          ? `${formatTime(restaurant.openingHours[day].open)} - ${formatTime(restaurant.openingHours[day].close)}`
                          : 'Closed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails; 
 
 
 
 