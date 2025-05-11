import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiPackage, FiClock, FiMapPin, FiPhone, FiUser, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import * as deliveryService from '../services/deliveryService';

const DeliveryTrackingPage = () => {
  const { deliveryId } = useParams();
  const [tracking, setTracking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [directions, setDirections] = useState(null);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Status steps for the progress bar
  const statusSteps = ['pending_assignment', 'assigned', 'picked_up', 'in_transit', 'delivered'];
  
  // Google Maps API key - replace with your actual key from environment variables
  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY';
  
  // Map container style
  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '0.5rem'
  };
  
  // Default center (will be updated with actual delivery location)
  const defaultCenter = {
    lat: 37.7749,
    lng: -122.4194
  };

  // Function to fetch tracking data
  const fetchTrackingData = useCallback(async () => {
    try {
      const data = await deliveryService.getDeliveryTracking(deliveryId);
      setTracking(data);
      
      // Calculate directions if we have both restaurant and delivery person locations
      if (data.deliveryPerson?.currentLocation && data.deliveryAddress) {
        const deliveryPersonLocation = {
          lat: data.deliveryPerson.currentLocation.coordinates[1],
          lng: data.deliveryPerson.currentLocation.coordinates[0]
        };
        
        const deliveryAddressLocation = {
          lat: data.deliveryAddress.latitude,
          lng: data.deliveryAddress.longitude
        };
        
        // Get directions using Google Maps Directions Service
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin: deliveryPersonLocation,
            destination: deliveryAddressLocation,
            travelMode: window.google.maps.TravelMode.DRIVING
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              setDirections(result);
            } else {
              console.error(`Error fetching directions: ${status}`);
            }
          }
        );
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      setError('Failed to load delivery tracking information');
      toast.error('Failed to load tracking information');
    } finally {
      setIsLoading(false);
    }
  }, [deliveryId]);

  // Fetch tracking data on component mount
  useEffect(() => {
    fetchTrackingData();
    
    // Set up interval to refresh tracking data every 30 seconds
    const interval = setInterval(() => {
      fetchTrackingData();
    }, 30000);
    
    setRefreshInterval(interval);
    
    // Clean up interval on component unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [fetchTrackingData]);

  // Function to get status index for progress bar
  const getStatusIndex = (status) => {
    return statusSteps.indexOf(status);
  };

  // Function to format time
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading delivery tracking information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
          <FiAlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Tracking</h3>
          <p className="mt-2 text-gray-600">{error}</p>
          <div className="mt-6">
            <Link
              to="/orders"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Delivery Tracking</h1>
                <p className="text-gray-600 mt-1">Order #{tracking?.orderId?.substring(0, 8) || deliveryId.substring(0, 8)}</p>
              </div>
              <div className="mt-4 md:mt-0">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                  ${tracking?.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                    tracking?.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                    'bg-blue-100 text-blue-800'}`}
                >
                  {tracking?.status === 'pending_assignment' ? 'Waiting for driver' :
                   tracking?.status === 'assigned' ? 'Driver assigned' :
                   tracking?.status === 'picked_up' ? 'Order picked up' :
                   tracking?.status === 'in_transit' ? 'On the way' :
                   tracking?.status === 'delivered' ? 'Delivered' :
                   tracking?.status === 'cancelled' ? 'Cancelled' :
                   tracking?.status || 'Unknown status'}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Tracker */}
          {tracking?.status !== 'cancelled' && (
            <div className="px-6 py-4 bg-gray-50">
              <div className="relative">
                <div className="overflow-hidden h-2 text-xs flex bg-gray-200 rounded">
                  <div 
                    className="bg-blue-500 rounded" 
                    style={{ 
                      width: `${(getStatusIndex(tracking?.status) + 1) * 100 / statusSteps.length}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <div className="text-center">
                    <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center ${getStatusIndex(tracking?.status) >= 0 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>
                      <FiPackage className="w-3 h-3" />
                    </div>
                    <p className="mt-1">Confirmed</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center ${getStatusIndex(tracking?.status) >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>
                      <FiUser className="w-3 h-3" />
                    </div>
                    <p className="mt-1">Assigned</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center ${getStatusIndex(tracking?.status) >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>
                      <FiPackage className="w-3 h-3" />
                    </div>
                    <p className="mt-1">Picked Up</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center ${getStatusIndex(tracking?.status) >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>
                      <FiMapPin className="w-3 h-3" />
                    </div>
                    <p className="mt-1">On the Way</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center ${getStatusIndex(tracking?.status) >= 4 ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                      <FiCheck className="w-3 h-3" />
                    </div>
                    <p className="mt-1">Delivered</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Map */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Live Tracking</h2>
            {tracking?.deliveryPerson?.currentLocation ? (
              <LoadScript googleMapsApiKey={googleMapsApiKey}>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={tracking?.deliveryPerson?.currentLocation ? {
                    lat: tracking.deliveryPerson.currentLocation.coordinates[1],
                    lng: tracking.deliveryPerson.currentLocation.coordinates[0]
                  } : defaultCenter}
                  zoom={14}
                >
                  {/* Delivery Person Marker */}
                  {tracking?.deliveryPerson?.currentLocation && (
                    <Marker
                      position={{
                        lat: tracking.deliveryPerson.currentLocation.coordinates[1],
                        lng: tracking.deliveryPerson.currentLocation.coordinates[0]
                      }}
                      icon={{
                        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                        scaledSize: new window.google.maps.Size(40, 40)
                      }}
                    />
                  )}
                  
                  {/* Delivery Address Marker */}
                  {tracking?.deliveryAddress && (
                    <Marker
                      position={{
                        lat: tracking.deliveryAddress.latitude,
                        lng: tracking.deliveryAddress.longitude
                      }}
                      icon={{
                        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                        scaledSize: new window.google.maps.Size(40, 40)
                      }}
                    />
                  )}
                  
                  {/* Directions */}
                  {directions && (
                    <DirectionsRenderer
                      directions={directions}
                      options={{
                        suppressMarkers: true,
                        polylineOptions: {
                          strokeColor: '#4285F4',
                          strokeWeight: 5
                        }
                      }}
                    />
                  )}
                </GoogleMap>
              </LoadScript>
            ) : (
              <div className="bg-gray-100 rounded-lg p-6 text-center">
                <p className="text-gray-600">
                  {tracking?.status === 'pending_assignment' ? 
                    'Waiting for a delivery driver to be assigned.' : 
                    tracking?.status === 'delivered' ?
                    'Delivery completed successfully.' :
                    'Live tracking will be available once a delivery driver is assigned and starts the delivery.'}
                </p>
              </div>
            )}
          </div>

          {/* Delivery Details */}
          <div className="p-6 border-t">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Delivery Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Delivery Address */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <FiMapPin className="mr-2 text-gray-400" /> Delivery Address
                </h3>
                <p className="mt-2 text-gray-600">
                  {tracking?.deliveryAddress ? (
                    <>
                      {tracking.deliveryAddress.street}<br />
                      {tracking.deliveryAddress.city}, {tracking.deliveryAddress.state} {tracking.deliveryAddress.zipCode}
                    </>
                  ) : (
                    'Address not available'
                  )}
                </p>
              </div>
              
              {/* Estimated Delivery Time */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <FiClock className="mr-2 text-gray-400" /> Estimated Delivery
                </h3>
                <p className="mt-2 text-gray-600">
                  {tracking?.estimatedDeliveryTime ? (
                    <>
                      {formatTime(tracking.estimatedDeliveryTime)}<br />
                      {formatDate(tracking.estimatedDeliveryTime)}
                    </>
                  ) : (
                    'Estimated time not available'
                  )}
                </p>
              </div>
              
              {/* Delivery Person */}
              {tracking?.deliveryPerson && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <FiUser className="mr-2 text-gray-400" /> Delivery Person
                  </h3>
                  <div className="mt-2">
                    <p className="text-gray-900 font-medium">{tracking.deliveryPerson.name}</p>
                    {tracking.deliveryPerson.phoneNumber && (
                      <p className="text-gray-600 flex items-center mt-1">
                        <FiPhone className="mr-2 text-gray-400" />
                        <a href={`tel:${tracking.deliveryPerson.phoneNumber}`} className="text-blue-600 hover:underline">
                          {tracking.deliveryPerson.phoneNumber}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status History */}
          <div className="p-6 border-t">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Status Updates</h2>
            {tracking?.statusHistory && tracking.statusHistory.length > 0 ? (
              <div className="flow-root">
                <ul className="-mb-8">
                  {tracking.statusHistory.map((status, index) => (
                    <li key={index}>
                      <div className="relative pb-8">
                        {index !== tracking.statusHistory.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white
                              ${status.status === 'delivered' ? 'bg-green-500' : 
                                status.status === 'cancelled' ? 'bg-red-500' : 
                                'bg-blue-500'}`}
                            >
                              {status.status === 'delivered' ? (
                                <FiCheck className="h-5 w-5 text-white" />
                              ) : status.status === 'picked_up' ? (
                                <FiPackage className="h-5 w-5 text-white" />
                              ) : status.status === 'in_transit' ? (
                                <FiMapPin className="h-5 w-5 text-white" />
                              ) : (
                                <FiClock className="h-5 w-5 text-white" />
                              )}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5">
                            <p className="text-sm font-medium text-gray-900">
                              {status.status === 'pending_assignment' ? 'Waiting for driver' :
                               status.status === 'assigned' ? 'Driver assigned' :
                               status.status === 'picked_up' ? 'Order picked up' :
                               status.status === 'in_transit' ? 'On the way' :
                               status.status === 'delivered' ? 'Delivered' :
                               status.status === 'cancelled' ? 'Cancelled' :
                               status.status}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {new Date(status.timestamp).toLocaleString()}
                            </p>
                            {status.note && (
                              <p className="mt-1 text-sm text-gray-600">{status.note}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-600">No status updates available.</p>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <Link
                to="/orders"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Back to Orders
              </Link>
              <button
                onClick={fetchTrackingData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Refresh Tracking
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTrackingPage; 