import { useState, useEffect } from 'react';
import { FiPackage, FiClock, FiCheck, FiUser, FiMapPin, FiSettings, FiCheckCircle, FiActivity, FiToggleLeft, FiToggleRight, FiNavigation, FiInfo } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import * as deliveryService from '../../services/deliveryService';
import { toast } from 'react-hot-toast';

const StatCard = ({ title, value, icon }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );
};

const DeliveryDashboard = () => {
  const [activeTab, setActiveTab] = useState('current');
  const [profile, setProfile] = useState(null);
  const [currentDelivery, setCurrentDelivery] = useState(null);
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0 });
  const [stats, setStats] = useState({ 
    currentDeliveries: 0, 
    completedToday: 0, 
    totalCompleted: 0 
  });
  const { user } = useAuth();

  // Load delivery person profile and current delivery
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Get profile
        const profileData = await deliveryService.getDeliveryPersonProfile();
        
        console.log("Profile data received:", profileData); // Debug log
        
        // Check if profile needs to be completed
        if (profileData.needsCompletion || 
            (profileData.message && profileData.message.includes('Please complete your profile'))) {
          // Redirect to complete profile page
          toast.success('Please complete your delivery profile');
          window.location.href = '/delivery/complete-profile';
          return;
        }
        
        setProfile(profileData.data);
        setIsAvailable(profileData.data.isAvailable || false);
        
        // Get current delivery
        try {
          const currentDeliveryData = await deliveryService.getCurrentDelivery();
          setCurrentDelivery(currentDeliveryData.data);
          
          // Calculate stats
          if (currentDeliveryData.data) {
            setStats(prev => ({ ...prev, currentDeliveries: 1 }));
          }
        } catch (deliveryError) {
          console.error("Error fetching current delivery:", deliveryError);
          // Continue with other data loading even if current delivery fails
        }
        
        // Get delivery history
        try {
          const historyData = await deliveryService.getDeliveryHistory();
          setDeliveryHistory(historyData.data || []);
          
          // Calculate completed today
          const today = new Date();
          const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const completedToday = (historyData.data || []).filter(delivery => {
            const deliveredAt = new Date(delivery.deliveredAt);
            return deliveredAt >= todayStart && delivery.status === 'delivered';
          }).length;
          
          setStats(prev => ({ 
            ...prev, 
            completedToday,
            totalCompleted: historyData.pagination?.total || historyData.data?.length || 0
          }));
          
          // Calculate earnings (this would be replaced with actual earnings data)
          // For now, we'll use a simple calculation based on completed deliveries
          const baseDeliveryFee = 5.00; // Base fee per delivery
          setEarnings({
            today: completedToday * baseDeliveryFee,
            week: (historyData.data || []).filter(delivery => {
              const deliveredAt = new Date(delivery.deliveredAt);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return deliveredAt >= weekAgo && delivery.status === 'delivered';
            }).length * baseDeliveryFee,
            month: (historyData.data || []).filter(delivery => {
              const deliveredAt = new Date(delivery.deliveredAt);
              const monthAgo = new Date();
              monthAgo.setMonth(monthAgo.getMonth() - 1);
              return deliveredAt >= monthAgo && delivery.status === 'delivered';
            }).length * baseDeliveryFee
          });
        } catch (historyError) {
          console.error("Error fetching delivery history:", historyError);
          // Continue even if history fails to load
        }
      } catch (error) {
        console.error('Error loading delivery data:', error);
        
        // Check if it's a 404 error (profile not found) or 500 error
        if (error.response && (error.response.status === 404 || error.response.status === 500)) {
          toast.success('Please complete your delivery profile');
          window.location.href = '/delivery/complete-profile';
          return;
        }
        
        toast.error('Failed to load delivery data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, []);
  
  // Handle toggle availability
  const handleToggleAvailability = async () => {
    try {
      const newStatus = !isAvailable;
      await deliveryService.toggleAvailability(newStatus);
      setIsAvailable(newStatus);
      toast.success(`You are now ${newStatus ? 'available' : 'unavailable'} for deliveries`);
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to update availability');
    }
  };
  
  // Handle update status
  const handleUpdateStatus = async (deliveryId, status) => {
    try {
      // Get current location
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          
          // Update delivery status with location
          await deliveryService.updateDeliveryStatus(deliveryId, status, location);
          toast.success(`Delivery status updated to ${status}`);
          
          // Refresh current delivery data
          const currentDeliveryData = await deliveryService.getCurrentDelivery();
          setCurrentDelivery(currentDeliveryData.data);
          
          // If delivery is completed, refresh history as well
          if (status === 'delivered' || status === 'failed') {
            const historyData = await deliveryService.getDeliveryHistory();
            setDeliveryHistory(historyData.data || []);
            setStats(prev => ({ 
              ...prev, 
              currentDeliveries: 0,
              completedToday: prev.completedToday + 1
            }));
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location. Please enable location services.');
        },
        { enableHighAccuracy: true }
      );
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast.error('Failed to update delivery status');
    }
  };
  
  // Handle navigate to delivery
  const handleNavigate = (delivery) => {
    // Check if we have the required coordinates
    if (!delivery.pickupLocation?.coordinates || !delivery.dropoffLocation?.coordinates) {
      toast.error('Navigation coordinates not available');
      return;
    }

    // Check if the browser supports geolocation
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    // Get current location for navigation
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let destination;

        // If delivery is not picked up yet, navigate to restaurant
        if (delivery.status === 'assigned') {
          destination = `${delivery.pickupLocation.coordinates.latitude},${delivery.pickupLocation.coordinates.longitude}`;
          toast.success('Navigating to restaurant for pickup');
        }
        // If delivery is picked up or in transit, navigate to customer
        else if (delivery.status === 'picked_up' || delivery.status === 'in_transit') {
          destination = `${delivery.dropoffLocation.coordinates.latitude},${delivery.dropoffLocation.coordinates.longitude}`;
          toast.success('Navigating to delivery address');
        }
        else {
          toast.error('Navigation not available for current delivery status');
          return;
        }

        // Open Google Maps with turn-by-turn navigation
        const mapsUrl = `https://www.google.com/maps/dir/${latitude},${longitude}/${destination}`;
        window.open(mapsUrl, '_blank');
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Unable to get your location. Please enable location services.');
      },
      { enableHighAccuracy: true }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading delivery dashboard...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'current':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Delivery Dashboard</h2>
              <div className="flex items-center">
                <span className="mr-2 text-sm text-gray-600">
                  {isAvailable ? 'Available for Deliveries' : 'Not Available'}
                </span>
                <button 
                  onClick={handleToggleAvailability}
                  className={`flex items-center px-3 py-1 rounded-full text-white ${isAvailable ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'}`}
                >
                  {isAvailable ? <FiToggleRight className="mr-1" /> : <FiToggleLeft className="mr-1" />}
                  {isAvailable ? 'Online' : 'Offline'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Current Deliveries" 
                value={stats.currentDeliveries} 
                icon={<FiPackage className="text-blue-500" />} 
              />
              <StatCard 
                title="Completed Today" 
                value={stats.completedToday} 
                icon={<FiCheck className="text-green-500" />} 
              />
              <StatCard 
                title="Today's Earnings" 
                value={`$${earnings.today.toFixed(2)}`} 
                icon={<FiActivity className="text-purple-500" />} 
              />
              <StatCard 
                title="Total Completed" 
                value={stats.totalCompleted} 
                icon={<FiCheckCircle className="text-indigo-500" />} 
              />
            </div>

            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Current Delivery</h3>
              
              {currentDelivery ? (
                <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                        <span className="text-lg font-semibold text-gray-900">
                          {currentDelivery.order?.restaurant?.name || 'Restaurant'}
                        </span>
                        <span className="ml-3 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {currentDelivery.status}
                        </span>
                          </div>
                      
                          <div className="mt-3">
                            <div className="flex items-start">
                              <FiUser className="mt-1 mr-2 text-gray-400" />
                              <div>
                            <p className="font-medium text-gray-900">
                              {currentDelivery.order?.customer?.name || 'Customer'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {currentDelivery.order?.customer?.phone || 'No phone available'}
                            </p>
                              </div>
                            </div>
                        
                            <div className="flex items-start mt-2">
                              <FiMapPin className="mt-1 mr-2 text-gray-400" />
                              <div>
                            <p className="text-gray-900 font-medium">Delivery Address:</p>
                            <p className="text-gray-600">
                              {currentDelivery.order?.deliveryAddress ? (
                                <>
                                  {currentDelivery.order.deliveryAddress.street}<br />
                                  {currentDelivery.order.deliveryAddress.city}, {currentDelivery.order.deliveryAddress.state} {currentDelivery.order.deliveryAddress.zipCode}
                                </>
                              ) : (
                                'Address not available'
                              )}
                            </p>
                          </div>
                              </div>
                        
                        {currentDelivery.order?.specialInstructions && (
                          <div className="flex items-start mt-2">
                            <FiInfo className="mt-1 mr-2 text-gray-400" />
                            <div>
                              <p className="text-gray-900 font-medium">Special Instructions:</p>
                              <p className="text-gray-600">{currentDelivery.order.specialInstructions}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-col space-y-2">
                    <button 
                      onClick={() => handleNavigate(currentDelivery)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center justify-center"
                    >
                      <FiNavigation className="mr-2" /> 
                      {currentDelivery.status === 'assigned' 
                        ? 'Navigate to Restaurant' 
                        : currentDelivery.status === 'picked_up' || currentDelivery.status === 'in_transit'
                        ? 'Navigate to Delivery Address'
                        : 'Navigate'}
                    </button>
                    
                    {currentDelivery.status === 'assigned' && (
                      <button 
                        onClick={() => handleUpdateStatus(currentDelivery._id, 'picked_up')}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md text-sm"
                      >
                        Mark as Picked Up
                      </button>
                    )}
                    
                    {currentDelivery.status === 'picked_up' && (
                      <button 
                        onClick={() => handleUpdateStatus(currentDelivery._id, 'in_transit')}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm"
                      >
                        Start Delivery
                      </button>
                    )}
                    
                    {(currentDelivery.status === 'in_transit' || currentDelivery.status === 'picked_up') && (
                      <button 
                        onClick={() => handleUpdateStatus(currentDelivery._id, 'delivered')}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm"
                      >
                        Mark as Delivered
                      </button>
                    )}
                    
                    {(currentDelivery.status === 'in_transit' || currentDelivery.status === 'picked_up') && (
                      <button 
                        onClick={() => handleUpdateStatus(currentDelivery._id, 'failed')}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm"
                      >
                        Mark as Failed
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No active deliveries at the moment.
                  {isAvailable ? 
                    <p className="mt-2 text-sm text-gray-500">You're online and will be assigned deliveries when available.</p> :
                    <p className="mt-2 text-sm text-gray-500">You're currently offline. Go online to receive deliveries.</p>
                  }
                </div>
              )}
            </div>
          </div>
        );
      case 'history':
        return (
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery History</h3>
            
            {deliveryHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No delivery history found.
              </div>
            ) : (
            <div className="mt-4 border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deliveryHistory.map((delivery) => (
                      <tr key={delivery._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{delivery._id?.substring(0, 8) || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {delivery.order?.restaurant?.name || 'Restaurant'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {delivery.order?.customer?.name || 'Customer'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            delivery.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                            delivery.status === 'failed' ? 'bg-red-100 text-red-800' : 
                            delivery.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : 
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {delivery.status}
                          </span>
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <nav className="flex space-x-4">
              <button 
                onClick={() => setActiveTab('current')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              activeTab === 'current'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
              >
                Current Deliveries
              </button>
              <button 
                onClick={() => setActiveTab('history')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              activeTab === 'history'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
              >
            History
              </button>
              <button 
                onClick={() => setActiveTab('earnings')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              activeTab === 'earnings'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
              >
                Earnings
              </button>
              <button 
                onClick={() => setActiveTab('profile')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              activeTab === 'profile'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
              >
            Profile
              </button>
            </nav>
        </div>

          {renderContent()}
    </div>
  );
};

export default DeliveryDashboard; 