import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { FiPlus, FiMinus, FiTrash2, FiShoppingBag, FiMapPin } from 'react-icons/fi';
import { LoadScript, GoogleMap, Marker } from '@react-google-maps/api';

const CartPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, loading, cartTotal, updateCartItem, removeFromCart, clearCart, createOrder } = useCart();
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const mapRef = useRef(null);
  
  const [mapCenter, setMapCenter] = useState({ lat: 40.730610, lng: -73.935242 }); // Default to NYC
  const [markerPosition, setMarkerPosition] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  
  const [checkoutForm, setCheckoutForm] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    contactPhone: user?.phone || '',
    paymentMethod: 'cash_on_delivery',
    specialInstructions: ''
  });
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  
  const mapContainerStyle = {
    width: '100%',
    height: '300px',
    marginBottom: '16px',
    borderRadius: '0.375rem'
  };
  
  // Load user's address as default delivery location
  useEffect(() => {
    if (user && user.address) {
      console.log('Loading user address as default:', user.address);
      setCheckoutForm(prev => ({
        ...prev,
        street: user.address.street || '',
        city: user.address.city || '',
        state: user.address.state || '',
        zipCode: user.address.zipCode || '',
        contactPhone: user.phone || prev.contactPhone
      }));
    }
  }, [user]);
  
  // Automatically get user's location when checking out and maps API is loaded
  useEffect(() => {
    if (isCheckingOut && googleMapsLoaded && !markerPosition) {
      getCurrentLocation();
    }
  }, [isCheckingOut, googleMapsLoaded]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCheckoutForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Function to get the user's current location with improved accuracy
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    
    setIsLoadingLocation(true);
    setLocationError(null);
    toast.loading('Getting your current location...');
    
    // High accuracy options
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!googleMapsLoaded) {
          setLocationError('Google Maps API is not loaded yet');
          toast.error('Google Maps API is not loaded yet. Please try again.');
          toast.dismiss();
          setIsLoadingLocation(false);
          return;
        }
        
        const { latitude, longitude, accuracy } = position.coords;
        console.log('Current position:', latitude, longitude);
        console.log('Position accuracy:', accuracy, 'meters');
        
        // Show debug toast with coordinates
        toast.dismiss();
        toast.success(`Location found: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        
        const newPosition = { lat: latitude, lng: longitude };
        setMapCenter(newPosition);
        setMarkerPosition(newPosition);
        
        // Use Google Maps Geocoding API
        geocodePosition(newPosition);
        
        setIsLoadingLocation(false);
      },
      (error) => {
        toast.dismiss();
        console.error('Geolocation error:', error);
        
        let errorMessage = 'Unknown error getting your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        
        setLocationError(errorMessage);
        toast.error(errorMessage);
        setIsLoadingLocation(false);
      },
      options
    );
  };
  
  // Function to geocode a position to an address
  const geocodePosition = (position) => {
    if (!googleMapsLoaded) return;
    
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ location: position }, (results, status) => {
      if (status === 'OK' && results[0]) {
        console.log('Geocoding results:', results);
        
        // Parse the address components
        let street = '';
        let city = '';
        let state = '';
        let zipCode = '';
        
        results[0].address_components.forEach(component => {
          const types = component.types;
          
          if (types.includes('street_number')) {
            street = component.long_name;
          }
          
          if (types.includes('route')) {
            street = street ? `${street} ${component.long_name}` : component.long_name;
          }
          
          if (types.includes('locality') || types.includes('sublocality')) {
            city = component.long_name;
          }
          
          if (types.includes('administrative_area_level_1')) {
            state = component.short_name;
          }
          
          if (types.includes('postal_code')) {
            zipCode = component.long_name;
          }
        });
        
        // Update form with location data
        setCheckoutForm(prev => ({
          ...prev,
          street: street || prev.street,
          city: city || prev.city,
          state: state || prev.state,
          zipCode: zipCode || prev.zipCode
        }));
        
        console.log('Address found:', { street, city, state, zipCode });
      } else {
        console.error('Geocoder failed:', status);
        toast.error('Failed to get address from your location. Please enter it manually.');
      }
    });
  };
  
  // Handle marker drag end
  const handleMarkerDragEnd = (e) => {
    const newPosition = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    console.log('Marker moved to:', newPosition);
    setMarkerPosition(newPosition);
    geocodePosition(newPosition);
  };
  
  // Handle map click
  const handleMapClick = (e) => {
    const clickedPosition = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    console.log('Map clicked at:', clickedPosition);
    setMarkerPosition(clickedPosition);
    geocodePosition(clickedPosition);
  };
  
  const handleQuantityChange = async (itemId, currentQuantity, change) => {
    const newQuantity = Math.max(1, currentQuantity + change);
    await updateCartItem(itemId, newQuantity);
  };
  
  const handleRemoveItem = async (itemId) => {
      await removeFromCart(itemId);
  };
  
  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };
  
  const handleCheckout = async (e) => {
    e.preventDefault();
    
    // Validate form
    const { street, city, state, zipCode, contactPhone } = checkoutForm;
    if (!street || !city || !state || !zipCode || !contactPhone) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setProcessingOrder(true);
    
    try {
      const orderData = {
        deliveryAddress: {
          street,
          city,
          state,
          zipCode,
          // Include latitude and longitude if marker position is available
          ...(markerPosition && {
            latitude: markerPosition.lat,
            longitude: markerPosition.lng
          })
        },
        contactPhone,
        paymentMethod: checkoutForm.paymentMethod,
        specialInstructions: checkoutForm.specialInstructions
      };
      
      const result = await createOrder(orderData);
      
      if (result) {
        toast.success('Order placed successfully!');
        navigate(`/orders/${result._id}`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setProcessingOrder(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-2 text-lg font-medium text-gray-900">Your cart is empty</h2>
          <p className="mt-1 text-sm text-gray-500">Start adding items to your cart!</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/menu')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <LoadScript
        googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        onLoad={() => setGoogleMapsLoaded(true)}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>
          
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-7">
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {cart.items.map((item) => (
                    <li key={item._id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center">
                        <div className="flex-shrink-0 h-20 w-20 bg-gray-100 rounded-md overflow-hidden">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1160&q=80'}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            />
                          </div>
                        <div className="ml-4 flex-1">
                          <div className="flex justify-between">
                            <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                            <p className="text-lg font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                          {item.notes && (
                            <p className="mt-1 text-xs text-gray-500">Note: {item.notes}</p>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center border rounded-md">
                          <button
                                onClick={() => handleQuantityChange(item._id, item.quantity, -1)}
                                className="p-2 hover:bg-gray-100"
                                disabled={item.quantity <= 1}
                          >
                            <FiMinus className="h-4 w-4" />
                          </button>
                              <span className="px-4">{item.quantity}</span>
                          <button
                                onClick={() => handleQuantityChange(item._id, item.quantity, 1)}
                                className="p-2 hover:bg-gray-100"
                          >
                            <FiPlus className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item._id)}
                              className="text-red-600 hover:text-red-800"
                        >
                            <FiTrash2 className="h-5 w-5" />
                        </button>
                          </div>
                        </div>
                    </div>
                    </li>
                  ))}
                </ul>
                
                <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
                  <button
                    onClick={handleClearCart}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => navigate('/menu')}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <span>Continue Shopping</span>
                </button>
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="mt-8 lg:mt-0 lg:col-span-5">
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
                  
                  <dl className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-gray-600">Restaurant</dt>
                      <dd className="text-sm font-medium text-gray-900">{cart.restaurantName}</dd>
          </div>
          
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-gray-600">Items ({cart.items.length})</dt>
                      <dd className="text-sm font-medium text-gray-900">${cartTotal.toFixed(2)}</dd>
                  </div>
                  
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-gray-600">Delivery Fee</dt>
                      <dd className="text-sm font-medium text-gray-900">$0.00</dd>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                      <dt className="text-base font-medium text-gray-900">Order Total</dt>
                      <dd className="text-base font-medium text-gray-900">${cartTotal.toFixed(2)}</dd>
                  </div>
                  </dl>
                  
                  {!isCheckingOut ? (
                    <div className="mt-6">
                      <button
                        onClick={() => setIsCheckingOut(true)}
                        className="w-full bg-blue-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Proceed to Checkout
                      </button>
                    </div>
                  ) : (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Information</h3>
                      
                      {/* Map for selecting location */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">
                          <FiMapPin className="inline mr-1" /> Click on the map or drag the marker to adjust delivery location
                        </p>
                        
                        {isLoadingLocation ? (
                          <div className="flex justify-center items-center h-[300px] bg-gray-100 rounded-md">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                          </div>
                        ) : (
                          <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={mapCenter}
                            zoom={16}
                            onClick={handleMapClick}
                            onLoad={map => {
                              mapRef.current = map;
                            }}
                            options={{
                              zoomControl: true,
                              streetViewControl: false,
                              mapTypeControl: false,
                              fullscreenControl: true,
                            }}
                          >
                            {markerPosition && (
                              <Marker
                                position={markerPosition}
                                draggable={true}
                                onDragEnd={handleMarkerDragEnd}
                                animation={window.google.maps.Animation.DROP}
                              />
                            )}
                          </GoogleMap>
                        )}
                        
                        {locationError && (
                          <p className="mt-2 text-sm text-red-600">{locationError}</p>
                        )}
                        
                        {/* Manual location refresh button */}
                        <button
                          type="button"
                          onClick={getCurrentLocation}
                          disabled={!googleMapsLoaded || isLoadingLocation}
                          className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <FiMapPin className="mr-1" /> Get Exact GPS Location
                        </button>
                      </div>
                      
                      <form onSubmit={handleCheckout}>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                              Street Address *
                            </label>
                            <input
                              type="text"
                              name="street"
                              id="street"
                              value={checkoutForm.street}
                              onChange={handleInputChange}
                              required
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                                City *
                              </label>
                              <input
                                type="text"
                                name="city"
                                id="city"
                                value={checkoutForm.city}
                                onChange={handleInputChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                            
                            <div>
                              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                                State *
                              </label>
                              <input
                                type="text"
                                name="state"
                                id="state"
                                value={checkoutForm.state}
                                onChange={handleInputChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                                ZIP Code *
                              </label>
                              <input
                                type="text"
                                name="zipCode"
                                id="zipCode"
                                value={checkoutForm.zipCode}
                                onChange={handleInputChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                            
                            <div>
                              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                                Phone *
                              </label>
                              <input
                                type="tel"
                                name="contactPhone"
                                id="contactPhone"
                                value={checkoutForm.contactPhone}
                                onChange={handleInputChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                              Payment Method
                            </label>
                            <select
                              name="paymentMethod"
                              id="paymentMethod"
                              value={checkoutForm.paymentMethod}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                              <option value="cash_on_delivery">Cash on Delivery</option>
                            </select>
                          </div>
                          
                          <div>
                            <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700">
                              Special Instructions
                            </label>
                            <textarea
                              name="specialInstructions"
                              id="specialInstructions"
                              rows="3"
                              value={checkoutForm.specialInstructions}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            ></textarea>
                          </div>
                        </div>
                        
                        <div className="mt-6 flex space-x-4">
                          <button
                            type="button"
                            onClick={() => setIsCheckingOut(false)}
                            className="flex-1 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            disabled={processingOrder}
                            className="flex-1 bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                          >
                            {processingOrder ? 'Processing...' : 'Place Order'}
                        </button>
                      </div>
                    </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </LoadScript>
    </>
  );
};

export default CartPage; 
 
 