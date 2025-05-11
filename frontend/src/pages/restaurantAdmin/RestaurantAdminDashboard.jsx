import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiPlus, FiToggleLeft, FiToggleRight, FiMenu, FiInfo, FiPackage, FiClock, FiCheck, FiAlertCircle, FiDollarSign } from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import * as orderService from '../../services/orderService';
import RestaurantForm from '../../components/restaurant/RestaurantForm';
import MenuItemForm from '../../components/restaurant/MenuItemForm';
import RestaurantDetails from '../../components/restaurant/RestaurantDetails';
import MenuItemList from '../../components/restaurant/MenuItemList';
import { toast } from 'react-hot-toast';

const RestaurantAdminDashboard = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const fetchingStats = useRef(false);
  const [orderStats, setOrderStats] = useState({
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
    total: 0
  });

  // Debug logger
  const logDebug = (...args) => {
    console.log('[RestaurantDashboard]', ...args);
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      logDebug('Not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch restaurants owned by the logged-in user
  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!user?.id) {
        logDebug('No user ID available, skipping restaurant fetch');
        return;
      }
      
      logDebug('Fetching restaurants for user:', user.id);
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await api.get(`/restaurants/owner/${user.id}`);
        logDebug('Restaurants fetched:', response.data);
        setRestaurants(response.data);
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setError('Failed to load restaurants');
        logDebug('Error response:', err.response?.data);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have a user and we're authenticated and auth loading is complete
    if (user?.id && isAuthenticated && !authLoading) {
      logDebug('Auth ready, fetching restaurants');
      fetchRestaurants();
    } else {
      logDebug('Waiting for auth to complete before fetching restaurants', 
        { userId: user?.id, isAuthenticated, authLoading });
    }
  }, [user?.id, isAuthenticated, authLoading, fetchTrigger]);

  // Fetch menu items for selected restaurant
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!selectedRestaurant?._id) {
        logDebug('No restaurant selected, skipping menu items fetch');
        return;
      }
      
      logDebug('Fetching menu items for restaurant:', selectedRestaurant._id);
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await api.get(`/menu-items/restaurant/${selectedRestaurant._id}`);
        logDebug('Menu items fetched:', response.data);
        setMenuItems(response.data);
      } catch (err) {
        setError('Failed to load menu items');
        console.error('Error fetching menu items:', err);
        logDebug('Error response:', err.response?.data);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedRestaurant?._id) {
      fetchMenuItems();
    } else {
      setMenuItems([]);
    }
  }, [selectedRestaurant?._id]);

  // Fetch order statistics
  useEffect(() => {
    const fetchOrderStats = async () => {
      if (restaurants.length === 0) {
        logDebug('No restaurants available for order stats');
        return;
      }
      
      // Use the first restaurant's ID if user doesn't have restaurantId
      const restaurantId = user?.restaurantId || restaurants[0]?._id;
      
      if (!restaurantId) {
        logDebug('No restaurant ID available for order stats');
        return;
      }
      
      // Prevent concurrent fetches
      if (fetchingStats.current) {
        logDebug('Already fetching order stats, skipping duplicate request');
        return;
      }
      
      try {
        fetchingStats.current = true;
        logDebug('Fetching order stats for restaurant:', restaurantId);
        
        const response = await orderService.getRestaurantOrderStats(restaurantId);
        logDebug('Order stats response:', response);
        
        if (response.success) {
          setOrderStats({
            pending: response.data.pending || 0,
            confirmed: response.data.confirmed || 0,
            preparing: response.data.preparing || 0,
            ready: response.data.ready || 0,
            out_for_delivery: response.data.out_for_delivery || 0,
            delivered: response.data.delivered || 0,
            cancelled: response.data.cancelled || 0,
            total: response.data.total || 0,
            active: response.data.active || 0,
            total_revenue: response.data.total_revenue || 0,
            today_revenue: response.data.today_revenue || 0
          });
          logDebug('Order stats updated successfully');
        }
      } catch (error) {
        console.error('Error fetching order statistics:', error);
        toast.error('Failed to load order statistics');
      } finally {
        fetchingStats.current = false;
      }
    };
    
    // Only fetch stats when restaurants are loaded
    if (restaurants.length > 0) {
      fetchOrderStats();
    }
  }, [user, restaurants]);

  // Handle restaurant creation/update
  const handleRestaurantSubmit = async (restaurantData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (selectedRestaurant) {
        // Update existing restaurant
        logDebug('Updating restaurant:', selectedRestaurant._id, restaurantData);
        response = await api.put(`/restaurants/${selectedRestaurant._id}`, restaurantData);
        
        // Update restaurants list
        setRestaurants(restaurants.map(restaurant => 
          restaurant._id === selectedRestaurant._id ? response.data : restaurant
        ));
        
        logDebug('Restaurant updated successfully');
      } else {
        // Create new restaurant
        logDebug('Creating new restaurant with data:', restaurantData);
        response = await api.post('/restaurants', restaurantData);
        setRestaurants([...restaurants, response.data]);
        logDebug('Restaurant created successfully:', response.data);
      }
      
      setIsRestaurantModalOpen(false);
      setSelectedRestaurant(null);
      
      // Trigger a refresh of the restaurants list
      setFetchTrigger(prev => prev + 1);
    } catch (err) {
      setError('Failed to save restaurant');
      console.error('Restaurant creation/update error:', err);
      if (err.response) {
        logDebug('Error response data:', err.response.data);
        logDebug('Error status:', err.response.status);
        setError(`Failed to save restaurant: ${err.response.data.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle menu item creation/update
  const handleMenuItemSubmit = async (menuItemData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (selectedMenuItem) {
        // Update existing menu item
        logDebug('Updating menu item:', selectedMenuItem._id, menuItemData);
        
        // Make sure restaurantId is included in the update
        const updatedData = {
          ...menuItemData,
          restaurantId: selectedRestaurant._id
        };
        
        logDebug('Sending update with data:', updatedData);
        response = await api.put(`/menu-items/${selectedMenuItem._id}`, updatedData);
        
        // Update menu items list
        setMenuItems(menuItems.map(item => 
          item._id === selectedMenuItem._id ? response.data : item
        ));
        
        logDebug('Menu item updated successfully');
      } else {
        // Create new menu item
        logDebug('Creating new menu item for restaurant:', selectedRestaurant._id, menuItemData);
        response = await api.post('/menu-items', {
          ...menuItemData,
          restaurantId: selectedRestaurant._id
        });
        setMenuItems([...menuItems, response.data]);
        logDebug('Menu item created successfully:', response.data);
      }
      
      setIsMenuItemModalOpen(false);
      setSelectedMenuItem(null);
    } catch (err) {
      setError('Failed to save menu item');
      console.error('Menu item creation/update error:', err);
      logDebug('Error response:', err.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle restaurant deletion
  const handleDeleteRestaurant = async (restaurantId) => {
    if (!window.confirm('Are you sure you want to delete this restaurant? This action cannot be undone.')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      logDebug('Deleting restaurant:', restaurantId);
      await api.delete(`/restaurants/${restaurantId}`);
      setRestaurants(restaurants.filter(restaurant => restaurant._id !== restaurantId));
      
      if (selectedRestaurant?._id === restaurantId) {
        setSelectedRestaurant(null);
        setMenuItems([]);
      }
      
      logDebug('Restaurant deleted successfully');
    } catch (err) {
      setError('Failed to delete restaurant');
      console.error('Restaurant deletion error:', err);
      logDebug('Error response:', err.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle menu item deletion
  const handleDeleteMenuItem = async (menuItemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item? This action cannot be undone.')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      logDebug('Deleting menu item:', menuItemId);
      await api.delete(`/menu-items/${menuItemId}`);
      setMenuItems(menuItems.filter(item => item._id !== menuItemId));
      logDebug('Menu item deleted successfully');
    } catch (err) {
      setError('Failed to delete menu item');
      console.error('Menu item deletion error:', err);
      logDebug('Error response:', err.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle restaurant status (active/inactive)
  const handleToggleRestaurantStatus = async (restaurantId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      logDebug('Toggling restaurant status:', restaurantId);
      const response = await api.patch(`/restaurants/${restaurantId}/toggle-status`);
      setRestaurants(restaurants.map(restaurant => 
        restaurant._id === restaurantId ? response.data : restaurant
      ));
      logDebug('Restaurant status toggled successfully');
    } catch (err) {
      setError('Failed to update restaurant status');
      console.error('Restaurant status toggle error:', err);
      logDebug('Error response:', err.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle menu item availability
  const handleToggleMenuItemAvailability = async (menuItemId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      logDebug('Toggling menu item availability:', menuItemId);
      const response = await api.patch(`/menu-items/${menuItemId}/toggle-availability`);
      setMenuItems(menuItems.map(item => 
        item._id === menuItemId ? response.data : item
      ));
      logDebug('Menu item availability toggled successfully');
    } catch (err) {
      setError('Failed to update menu item availability');
      console.error('Menu item availability toggle error:', err);
      logDebug('Error response:', err.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  // If we're still loading auth, show a loading indicator
  if (authLoading) {
        return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading authentication...</p>
          </div>
            </div>
          </div>
        );
  }

        return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Restaurant Admin Dashboard</h1>
      
      {/* Order Statistics Cards */}
      <div className="mt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Order Statistics</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Pending Orders */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <FiClock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{orderStats.pending}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/restaurant-admin/orders?status=pending" className="font-medium text-blue-700 hover:text-blue-900">
                  View all
                </Link>
              </div>
            </div>
            </div>
            
          {/* In Progress Orders */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <FiPackage className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">In Progress Orders</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {orderStats.active || (orderStats.confirmed + orderStats.preparing + orderStats.ready + orderStats.out_for_delivery)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/restaurant-admin/orders" className="font-medium text-blue-700 hover:text-blue-900">
                  View all
                </Link>
                    </div>
                  </div>
                </div>

          {/* Completed Orders */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <FiCheck className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed Orders</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{orderStats.delivered}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/restaurant-admin/orders?status=delivered" className="font-medium text-blue-700 hover:text-blue-900">
                  View all
                </Link>
                  </div>
                </div>
              </div>
              
          {/* Total Orders */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                  <FiAlertCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{orderStats.total}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/restaurant-admin/orders" className="font-medium text-blue-700 hover:text-blue-900">
                  View all
                </Link>
              </div>
            </div>
          </div>
        </div>
                    </div>
      
      {/* Revenue Statistics */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue Statistics</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Today's Revenue */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <FiDollarSign className="h-6 w-6 text-green-600" />
                  </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Today's Revenue</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        ${orderStats.today_revenue ? orderStats.today_revenue.toFixed(2) : '0.00'}
                      </div>
                    </dd>
                  </dl>
                </div>
                  </div>
                </div>
              </div>
              
          {/* Total Revenue */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <FiDollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        ${orderStats.total_revenue ? orderStats.total_revenue.toFixed(2) : '0.00'}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <FiPackage className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-900">Manage Orders</h3>
                  <p className="mt-1 text-sm text-gray-500">View and update your restaurant's orders</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/restaurant-admin/orders" className="font-medium text-blue-700 hover:text-blue-900">
                  Go to Orders
                </Link>
              </div>
            </div>
              </div>
              
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <FiPlus className="h-6 w-6 text-green-600" />
                  </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-900">Add Restaurant</h3>
                  <p className="mt-1 text-sm text-gray-500">Create a new restaurant profile</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <button 
                  onClick={() => {
                    setSelectedRestaurant(null);
                    setIsRestaurantModalOpen(true);
                  }}
                  className="font-medium text-blue-700 hover:text-blue-900"
                >
                  Add Restaurant
                </button>
              </div>
            </div>
              </div>
              
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                  <FiPlus className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-900">Add Menu Item</h3>
                  <p className="mt-1 text-sm text-gray-500">Add new dishes to your menu</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <button 
                  onClick={() => {
                    setSelectedMenuItem(null);
                    setIsMenuItemModalOpen(true);
                  }}
                  className="font-medium text-blue-700 hover:text-blue-900"
                >
                  Add Menu Item
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
          <button 
            className="ml-2 text-red-700" 
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 ${activeTab === 'restaurants' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('restaurants')}
        >
          My Restaurants
        </button>
        {selectedRestaurant && (
          <button
            className={`py-2 px-4 ${activeTab === 'menu' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('menu')}
          >
            Menu Items
          </button>
        )}
      </div>

      {activeTab === 'restaurants' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">My Restaurants</h2>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center"
              onClick={() => {
                setSelectedRestaurant(null);
                setIsRestaurantModalOpen(true);
              }}
            >
              <FiPlus className="mr-2" /> Add Restaurant
            </button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading restaurants...</p>
              </div>
            </div>
          )}
          
          {!isLoading && restaurants.length === 0 && (
            <div className="bg-gray-100 p-8 text-center rounded-lg">
              <p className="text-gray-600 mb-4">You don't have any restaurants yet.</p>
              <button 
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
                onClick={() => {
                  setSelectedRestaurant(null);
                  setIsRestaurantModalOpen(true);
                }}
              >
                Add Your First Restaurant
              </button>
            </div>
          )}

          {!isLoading && restaurants.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <div 
                  key={restaurant._id} 
                  className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {restaurant.image ? (
                    <img 
                      src={restaurant.image} 
                      alt={restaurant.name} 
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                </div>
                  )}
                  
                <div className="p-4">
                  <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold mb-2">{restaurant.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        restaurant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {restaurant.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2 text-sm">{restaurant.cuisineType}</p>
                    <p className="text-gray-500 text-sm mb-4 truncate">{restaurant.address}</p>
                    
                    <div className="flex justify-between mt-4">
                      <div className="flex space-x-2">
                        <button
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                          onClick={() => {
                            setSelectedRestaurant(restaurant);
                            setIsViewModalOpen(true);
                          }}
                          title="View Details"
                        >
                          <FiInfo />
                        </button>
                        <button
                          className="p-2 text-gray-500 hover:bg-gray-50 rounded-full"
                          onClick={() => {
                            setSelectedRestaurant(restaurant);
                            setIsRestaurantModalOpen(true);
                          }}
                          title="Edit Restaurant"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                          onClick={() => handleDeleteRestaurant(restaurant._id)}
                          title="Delete Restaurant"
                        >
                          <FiTrash2 />
                        </button>
              </div>
              
                      <div className="flex space-x-2">
              <button 
                          className="p-2 text-gray-500 hover:bg-gray-50 rounded-full"
                          onClick={() => handleToggleRestaurantStatus(restaurant._id)}
                          title={restaurant.isActive ? 'Deactivate' : 'Activate'}
              >
                          {restaurant.isActive ? <FiToggleRight className="text-green-500" /> : <FiToggleLeft className="text-red-500" />}
              </button>
              <button 
                          className="p-2 text-gray-500 hover:bg-gray-50 rounded-full"
                          onClick={() => {
                            setSelectedRestaurant(restaurant);
                            setActiveTab('menu');
                          }}
                          title="Manage Menu"
                        >
                          <FiMenu />
                        </button>
                </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
      )}

      {activeTab === 'menu' && selectedRestaurant && (
              <div>
          <div className="flex justify-between items-center mb-6">
                  <div>
              <h2 className="text-xl font-semibold">Menu Items for {selectedRestaurant.name}</h2>
              <p className="text-gray-500 text-sm">Manage your restaurant's menu items</p>
                  </div>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center"
              onClick={() => {
                setSelectedMenuItem(null);
                setIsMenuItemModalOpen(true);
              }}
            >
              <FiPlus className="mr-2" /> Add Menu Item
              </button>
              </div>
              
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading menu items...</p>
              </div>
              </div>
          )}
          
          {!isLoading && menuItems.length === 0 && (
            <div className="bg-gray-100 p-8 text-center rounded-lg">
              <p className="text-gray-600 mb-4">This restaurant doesn't have any menu items yet.</p>
              <button 
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
                onClick={() => {
                  setSelectedMenuItem(null);
                  setIsMenuItemModalOpen(true);
                }}
              >
                Add Your First Menu Item
              </button>
          </div>
          )}

          {!isLoading && menuItems.length > 0 && (
            <MenuItemList 
              menuItems={menuItems}
              onEdit={(menuItem) => {
                setSelectedMenuItem(menuItem);
                setIsMenuItemModalOpen(true);
              }}
              onDelete={handleDeleteMenuItem}
              onToggleAvailability={handleToggleMenuItemAvailability}
            />
          )}
        </div>
      )}

      {/* Restaurant Form Modal */}
      {isRestaurantModalOpen && (
        <RestaurantForm
          restaurant={selectedRestaurant}
          onSubmit={handleRestaurantSubmit}
          onCancel={() => {
            setIsRestaurantModalOpen(false);
            setSelectedRestaurant(null);
          }}
          isLoading={isLoading}
        />
      )}

      {/* Menu Item Form Modal */}
      {isMenuItemModalOpen && (
        <MenuItemForm
          menuItem={selectedMenuItem}
          onSubmit={handleMenuItemSubmit}
          onCancel={() => {
            setIsMenuItemModalOpen(false);
            setSelectedMenuItem(null);
          }}
          isLoading={isLoading}
          restaurantId={selectedRestaurant?._id}
        />
      )}

      {/* Restaurant Details Modal */}
      {isViewModalOpen && selectedRestaurant && (
        <RestaurantDetails
          restaurant={selectedRestaurant}
          onClose={() => setIsViewModalOpen(false)}
        />
      )}
    </div>
  );
};

export default RestaurantAdminDashboard; 
 
 
 
 