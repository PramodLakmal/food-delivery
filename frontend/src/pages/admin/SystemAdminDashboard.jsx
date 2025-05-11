import { useState, useEffect } from 'react';
import { FiUsers, FiShoppingBag, FiSettings, FiBarChart2, FiDollarSign, FiEdit, FiTrash2, FiCheck, FiX, FiInfo } from 'react-icons/fi';
import { toast } from 'react-toastify';
import RestaurantForm from '../../components/restaurant/RestaurantForm';
import RestaurantDetails from '../../components/restaurant/RestaurantDetails';
import * as adminService from '../../services/adminService';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';

const SystemAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for data
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    pendingOrders: 0,
    newUsers: 0,
    monthlyRevenue: 0
  });
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const stats = await adminService.getDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      toast.error('Failed to load dashboard statistics');
    }
  };
  
  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getAllUsers(currentPage, 10, searchQuery);
      setUsers(response.users);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch restaurants
  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getAllRestaurants(currentPage, 10, searchQuery);
      setRestaurants(response.restaurants);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Failed to fetch restaurants:', err);
      toast.error('Failed to load restaurants');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Effect for initial data loading and tab changes
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchDashboardStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'restaurants') {
      fetchRestaurants();
    }
  }, [activeTab, currentPage, searchQuery]);
  
  // Handle restaurant creation/update
  const handleRestaurantSubmit = async (restaurantData) => {
    setIsLoading(true);
    try {
      if (selectedRestaurant) {
        await adminService.updateRestaurant(selectedRestaurant._id, restaurantData);
        toast.success('Restaurant updated successfully');
      } else {
        await adminService.createRestaurant(restaurantData);
        toast.success('Restaurant created successfully');
      }
      
      setIsRestaurantModalOpen(false);
      setSelectedRestaurant(null);
      fetchRestaurants();
    } catch (err) {
      console.error('Failed to save restaurant:', err);
      toast.error('Failed to save restaurant');
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
    try {
      await adminService.deleteRestaurant(restaurantId);
      toast.success('Restaurant deleted successfully');
      fetchRestaurants();
    } catch (err) {
      console.error('Failed to delete restaurant:', err);
      toast.error('Failed to delete restaurant');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle restaurant status
  const handleToggleRestaurantStatus = async (restaurantId) => {
    setIsLoading(true);
    try {
      await adminService.toggleRestaurantStatus(restaurantId);
      toast.success('Restaurant status updated successfully');
      fetchRestaurants();
    } catch (err) {
      console.error('Failed to update restaurant status:', err);
      toast.error('Failed to update restaurant status');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await adminService.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      toast.error('Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle user status
  const handleToggleUserStatus = async (userId) => {
    setIsLoading(true);
    try {
      await adminService.toggleUserStatus(userId);
      toast.success('User status updated successfully');
      fetchUsers();
    } catch (err) {
      console.error('Failed to update user status:', err);
      toast.error('Failed to update user status');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle user role change
  const handleUserRoleChange = async (userId, newRole) => {
    setIsLoading(true);
    try {
      await adminService.changeUserRole(userId, newRole);
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (err) {
      console.error('Failed to update user role:', err);
      toast.error('Failed to update user role');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Search handler
  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };
  
  // Pagination handler
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard 
              title="Total Users" 
              value={dashboardStats.totalUsers} 
              icon={<FiUsers className="text-blue-500" />} 
            />
            <StatCard 
              title="Total Restaurants" 
              value={dashboardStats.totalRestaurants} 
              icon={<FiShoppingBag className="text-orange-500" />} 
            />
            <StatCard 
              title="Total Orders" 
              value={dashboardStats.totalOrders} 
              icon={<FiBarChart2 className="text-purple-500" />} 
            />
            <StatCard 
              title="Pending Orders" 
              value={dashboardStats.pendingOrders} 
              icon={<FiBarChart2 className="text-yellow-500" />} 
            />
            <StatCard 
              title="New Users (Last 30 days)" 
              value={dashboardStats.newUsers} 
              icon={<FiUsers className="text-green-500" />} 
            />
            <StatCard 
              title="Monthly Revenue" 
              value={`$${dashboardStats.monthlyRevenue.toFixed(2)}`} 
              icon={<FiDollarSign className="text-indigo-500" />} 
            />
          </div>
        );
      case 'users':
        return (
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">User Management</h3>
              <div className="flex items-center space-x-4">
                <div className="w-64">
                  <SearchBar
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="Search users..."
                  />
                </div>
                <button 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                  onClick={() => {/* TODO: Implement add user */}}
                >
                Add New User
              </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
            <div className="mt-4 border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <select
                              value={user.role}
                              onChange={(e) => handleUserRoleChange(user._id, e.target.value)}
                              className="block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                              <option value="customer">Customer</option>
                              <option value="restaurant_admin">Restaurant Admin</option>
                              <option value="delivery_person">Delivery Person</option>
                              <option value="system_admin">System Admin</option>
                            </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleUserStatus(user._id)}
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button 
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                              onClick={() => {/* TODO: Implement edit user */}}
                            >
                          <FiEdit />
                        </button>
                            <button 
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDeleteUser(user._id)}
                            >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        );
      case 'restaurants':
        return (
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Restaurant Management</h3>
              <div className="flex items-center space-x-4">
                <div className="w-64">
                  <SearchBar
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="Search restaurants..."
                  />
                </div>
                <button 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                  onClick={() => {
                    setSelectedRestaurant(null);
                    setIsRestaurantModalOpen(true);
                  }}
                >
                Add New Restaurant
              </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
            <div className="mt-4 border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuisine</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                      {restaurants.map((restaurant) => (
                        <tr key={restaurant._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{restaurant.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{restaurant.owner.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{restaurant.address}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{restaurant.cuisineType}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleRestaurantStatus(restaurant._id)}
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                restaurant.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {restaurant.isActive ? 'Active' : 'Inactive'}
                            </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              onClick={() => {
                                setSelectedRestaurant(restaurant);
                                setIsViewModalOpen(true);
                              }}
                            >
                              <FiInfo />
                            </button>
                            <button
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                              onClick={() => {
                                setSelectedRestaurant(restaurant);
                                setIsRestaurantModalOpen(true);
                              }}
                            >
                              <FiEdit />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDeleteRestaurant(restaurant._id)}
                            >
                            <FiTrash2 />
                          </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
            
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
            
            {isViewModalOpen && selectedRestaurant && (
              <RestaurantDetails
                restaurant={selectedRestaurant}
                onClose={() => {
                  setIsViewModalOpen(false);
                  setSelectedRestaurant(null);
                }}
              />
            )}
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Settings</h3>
            <form className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">General Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Application Name</label>
                    <input 
                      type="text" 
                      defaultValue="Food Delivery System"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Enable User Registration</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Enable Restaurant Registration</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">Email Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SMTP Server</label>
                    <input 
                      type="text" 
                      defaultValue="smtp.example.com"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
                    <input 
                      type="number" 
                      defaultValue="587"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email From</label>
                    <input 
                      type="email" 
                      defaultValue="noreply@fooddelivery.com"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">Payment Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                      <option>GBP (£)</option>
                      <option>JPY (¥)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Enable Credit Card Payments</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Enable PayPal</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button type="button" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
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

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage users, restaurants and system settings</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-64 flex-shrink-0">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <nav className="mt-2">
              <button 
                className={`w-full flex items-center px-4 py-3 text-left ${activeTab === 'overview' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('overview')}
              >
                <FiBarChart2 className="mr-3" /> 
                Overview
              </button>
              <button 
                className={`w-full flex items-center px-4 py-3 text-left ${activeTab === 'users' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('users')}
              >
                <FiUsers className="mr-3" />
                User Management
              </button>
              <button 
                className={`w-full flex items-center px-4 py-3 text-left ${activeTab === 'restaurants' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('restaurants')}
              >
                <FiShoppingBag className="mr-3" />
                Restaurant Management
              </button>
              <button 
                className={`w-full flex items-center px-4 py-3 text-left ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('settings')}
              >
                <FiSettings className="mr-3" />
                System Settings
              </button>
            </nav>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon }) => {
  return (
    <div className="bg-white shadow rounded-lg p-4 flex items-center">
      <div className="p-3 rounded-full bg-gray-100 mr-4">
        {icon}
      </div>
      <div>
        <p className="text-gray-600 text-sm">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

export default SystemAdminDashboard; 