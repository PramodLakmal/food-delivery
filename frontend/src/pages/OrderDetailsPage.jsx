import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiClock, FiMapPin, FiPhone, FiX, FiEdit, FiSave, FiNavigation } from 'react-icons/fi';
import * as orderService from '../services/orderService';
import * as deliveryService from '../services/deliveryService';
import { LoadScript, GoogleMap, Marker } from '@react-google-maps/api';

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const mapRef = useRef(null);
  const [markerPosition, setMarkerPosition] = useState(null);
  
  const [editForm, setEditForm] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    contactPhone: '',
    specialInstructions: ''
  });
  
  const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '0.375rem'
  };
  
  useEffect(() => {
    fetchOrder();
    fetchDelivery();
  }, [orderId]);
  
  useEffect(() => {
    if (order && order.deliveryAddress) {
      // Initialize the edit form with current order data
      setEditForm({
        street: order.deliveryAddress.street || '',
        city: order.deliveryAddress.city || '',
        state: order.deliveryAddress.state || '',
        zipCode: order.deliveryAddress.zipCode || '',
        contactPhone: order.contactPhone || '',
        specialInstructions: order.specialInstructions || ''
      });
      
      // Try to geocode the address to get coordinates for the map
      if (googleMapsLoaded) {
        geocodeAddress(order.deliveryAddress);
      }
    }
  }, [order, googleMapsLoaded]);
  
  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrderById(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDelivery = async () => {
    try {
      const response = await deliveryService.getDeliveryByOrderId(orderId);
      setDelivery(response);
    } catch (error) {
      console.error('Error fetching delivery:', error);
      // Don't show an error toast here as not all orders have deliveries yet
    }
  };
  
  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }
    
    try {
      await orderService.cancelOrder(orderId, 'Customer cancelled the order');
      toast.success('Order cancelled successfully');
      fetchOrder();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };
  
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleMapClick = (e) => {
    const clickedPosition = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setMarkerPosition(clickedPosition);
    reverseGeocode(clickedPosition);
  };
  
  const handleMarkerDragEnd = (e) => {
    const newPosition = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setMarkerPosition(newPosition);
    reverseGeocode(newPosition);
  };
  
  const geocodeAddress = (address) => {
    if (!googleMapsLoaded || !window.google) return;
    
    // If we already have coordinates in the address, use them
    if (address.latitude && address.longitude) {
      const position = {
        lat: address.latitude,
        lng: address.longitude
      };
      setMarkerPosition(position);
      return;
    }
    
    // Otherwise, geocode the address
    const geocoder = new window.google.maps.Geocoder();
    const addressString = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
    
    geocoder.geocode({ address: addressString }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        const position = { 
          lat: location.lat(), 
          lng: location.lng() 
        };
        setMarkerPosition(position);
      } else {
        console.error('Geocoding failed:', status);
      }
    });
  };
  
  const reverseGeocode = (position) => {
    if (!googleMapsLoaded || !window.google) return;
    
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ location: position }, (results, status) => {
      if (status === 'OK' && results[0]) {
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
        
        setEditForm(prev => ({
          ...prev,
          street: street || prev.street,
          city: city || prev.city,
          state: state || prev.state,
          zipCode: zipCode || prev.zipCode
        }));
      }
    });
  };
  
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    
    if (!editForm.street || !editForm.city || !editForm.state || !editForm.zipCode || !editForm.contactPhone) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const updatedOrderData = {
        deliveryAddress: {
          street: editForm.street,
          city: editForm.city,
          state: editForm.state,
          zipCode: editForm.zipCode,
          ...(markerPosition && {
            latitude: markerPosition.lat,
            longitude: markerPosition.lng
          })
        },
        contactPhone: editForm.contactPhone,
        specialInstructions: editForm.specialInstructions
      };
      
      await orderService.updateOrderDetails(orderId, updatedOrderData);
      
      toast.success('Order updated successfully');
      setIsEditing(false);
      
      // Fetch the updated order data without navigating away
      try {
        const response = await orderService.getOrderById(orderId);
        setOrder(response.data);
      } catch (fetchError) {
        console.error('Error fetching updated order:', fetchError);
        // If we can't fetch the updated order, at least stay on the page
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };
  
  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800', text: 'Confirmed' },
      preparing: { color: 'bg-blue-100 text-blue-800', text: 'Preparing' },
      ready: { color: 'bg-green-100 text-green-800', text: 'Ready' },
      out_for_delivery: { color: 'bg-purple-100 text-purple-800', text: 'Out for Delivery' },
      delivered: { color: 'bg-green-100 text-green-800', text: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled' }
    };
    
    const { color, text } = statusMap[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    
    return (
      <span className={`${color} px-2 py-1 rounded-full text-xs font-medium`}>
        {text}
      </span>
    );
  };
  
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const canEdit = order && order.status === 'pending';
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white p-10 rounded-lg shadow-sm text-center">
          <p className="text-gray-500 text-lg">Order not found.</p>
          <Link
            to="/orders"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <FiArrowLeft className="mr-2" /> Back to Orders
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      onLoad={() => setGoogleMapsLoaded(true)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link
            to="/orders"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <FiArrowLeft className="mr-2" /> Back to Orders
          </Link>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{order.orderNumber}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge(order.status)}
              {delivery && delivery._id && (
                <Link 
                  to={`/delivery-tracking/${delivery._id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiNavigation className="mr-2" /> Track Delivery
                </Link>
              )}
              {canEdit && !isEditing && (
                <button
                  onClick={handleEditToggle}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FiEdit className="mr-1" /> Edit Order
                </button>
              )}
              {(order.status === 'pending' || order.status === 'confirmed') && (
                <button
                  onClick={handleCancelOrder}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <FiX className="mr-1" /> Cancel Order
                </button>
              )}
            </div>
          </div>
          
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Restaurant</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {order.restaurantName}
                </dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {getStatusBadge(order.status)}
                </dd>
              </div>
              
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  ${order.totalAmount.toFixed(2)}
                </dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : order.paymentMethod}
                </dd>
              </div>
              
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Payment Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {order.paymentStatus === 'pending' ? 'Pending' : 
                   order.paymentStatus === 'completed' ? 'Completed' : 
                   order.paymentStatus === 'failed' ? 'Failed' : 
                   order.paymentStatus === 'refunded' ? 'Refunded' : 
                   order.paymentStatus}
                </dd>
              </div>
              
              {/* Delivery Address Section */}
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Delivery Address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {isEditing ? (
                    <form onSubmit={handleSaveChanges} className="space-y-4">
                      <div>
                        <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          name="street"
                          id="street"
                          value={editForm.street}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                            City *
                          </label>
                          <input
                            type="text"
                            name="city"
                            id="city"
                            value={editForm.city}
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
                            value={editForm.state}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                            ZIP Code *
                          </label>
                          <input
                            type="text"
                            name="zipCode"
                            id="zipCode"
                            value={editForm.zipCode}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                          Contact Phone *
                        </label>
                        <input
                          type="tel"
                          name="contactPhone"
                          id="contactPhone"
                          value={editForm.contactPhone}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700">
                          Special Instructions
                        </label>
                        <textarea
                          name="specialInstructions"
                          id="specialInstructions"
                          rows="3"
                          value={editForm.specialInstructions}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        ></textarea>
                      </div>
                      
                      {/* Map for selecting location */}
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          <FiMapPin className="inline mr-1" /> Click on the map or drag the marker to adjust delivery location
                        </p>
                        <GoogleMap
                          mapContainerStyle={mapContainerStyle}
                          center={markerPosition || { lat: 40.730610, lng: -73.935242 }}
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
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FiSave className="mr-2" /> Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={handleEditToggle}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center mb-2">
                        <FiMapPin className="mr-1 text-gray-400" />
                        <span>
                          {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                        </span>
                      </div>
                      
                      {/* Display map with the delivery location */}
                      {markerPosition && (
                        <div className="mt-4">
                          <GoogleMap
                            mapContainerStyle={{ ...mapContainerStyle, height: '200px' }}
                            center={markerPosition}
                            zoom={16}
                            options={{
                              zoomControl: true,
                              streetViewControl: false,
                              mapTypeControl: false,
                              fullscreenControl: true,
                              draggable: false,
                            }}
                          >
                            <Marker position={markerPosition} />
                          </GoogleMap>
                        </div>
                      )}
                    </>
                  )}
                </dd>
              </div>
              
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Contact Phone</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex items-center">
                    <FiPhone className="mr-1 text-gray-400" />
                    <span>{order.contactPhone}</span>
                  </div>
                </dd>
              </div>
              
              {order.estimatedDeliveryTime && (
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Estimated Delivery Time</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex items-center">
                      <FiClock className="mr-1 text-gray-400" />
                      <span>{formatDate(order.estimatedDeliveryTime)}</span>
                    </div>
                  </dd>
                </div>
              )}
              
              {(order.specialInstructions || isEditing) && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Special Instructions</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {order.specialInstructions || "None"}
                  </dd>
                </div>
              )}
              
              <div className="bg-white px-4 py-5 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 mb-4">Order Items</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {order.items.map((item) => (
                          <tr key={item._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {item.image && (
                                  <div className="flex-shrink-0 h-10 w-10 mr-4">
                                    <img 
                                      className="h-10 w-10 rounded-full object-cover" 
                                      src={item.image} 
                                      alt={item.name} 
                                    />
                                  </div>
                                )}
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                  {item.notes && (
                                    <div className="text-xs text-gray-500">{item.notes}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${item.price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="3" className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                            Total:
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${order.totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </LoadScript>
  );
};

export default OrderDetailsPage; 