import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { FiClock, FiPackage, FiCheck, FiX, FiEye, FiAlertCircle, FiFilter } from 'react-icons/fi';
import * as orderService from '../../services/orderService';
import * as restaurantService from '../../services/restaurantService';
import { Link } from 'react-router-dom';

const RestaurantOrdersPage = () => {
  const { user } = useAuth();
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const fetchingData = useRef(false);
  
  // Fetch restaurant and orders on initial load
  useEffect(() => {
    const fetchData = async () => {
      if (fetchingData.current) return;
      
      try {
        fetchingData.current = true;
        
        // First check if user has restaurantId
        if (user.restaurantId) {
          console.log("User has restaurantId:", user.restaurantId);
          await fetchOrders(user.restaurantId);
        } else {
          console.log("No restaurantId in user object, fetching restaurant");
          const fetchedRestaurant = await fetchRestaurant();
          if (fetchedRestaurant) {
            await fetchOrders(fetchedRestaurant._id);
          }
        }
      } finally {
        fetchingData.current = false;
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [user]);
  
  // Apply filter when statusFilter or allOrders changes
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredOrders(allOrders);
    } else {
      setFilteredOrders(allOrders.filter(order => order.status === statusFilter));
    }
  }, [statusFilter, allOrders]);
  
  const fetchRestaurant = async () => {
    try {
      console.log("Fetching restaurant for user:", user.id);
      const response = await restaurantService.getRestaurantsByOwner(user.id);
      console.log("Restaurant API response:", response);
      
      if (response && response.length > 0) {
        // Find restaurant where either owner or ownerId matches user.id
        const userRestaurants = response.filter(r => 
          r.owner === user.id || r.owner === user._id || 
          r.ownerId === user.id || r.ownerId === user._id
        );
        
        console.log("Filtered restaurants for this user:", userRestaurants);
        
        if (userRestaurants.length > 0) {
          const selectedRestaurant = userRestaurants[0];
          console.log("Selected restaurant:", selectedRestaurant);
          setRestaurant(selectedRestaurant);
          return selectedRestaurant;
        } else {
          console.error("No matching restaurants found for this user ID");
          toast.error("No restaurants found for your account. Please create a restaurant first.");
          return null;
        }
      } else {
        console.error("No restaurants found in API response");
        toast.error("No restaurants found. Please create a restaurant first.");
        return null;
      }
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      toast.error("Failed to fetch restaurant information");
      return null;
    }
  };
  
  const fetchOrders = async (restaurantId) => {
    if (!restaurantId) {
      console.error("No restaurant ID provided to fetchOrders");
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Fetching all orders for restaurant ${restaurantId}`);
      
      // Fetch all orders without status filter
      const response = await orderService.getRestaurantOrders(restaurantId, { 
        page: 1,
        limit: 100
      });
      
      console.log("Orders API response:", response);
      
      if (response && response.data) {
        setAllOrders(response.data);
        setFilteredOrders(response.data);
        console.log(`Found ${response.data.length} orders for restaurant ${restaurantId}`);
      } else {
        setAllOrders([]);
        setFilteredOrders([]);
        console.log(`No orders found for restaurant ${restaurantId}`);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error('Failed to load orders');
      setAllOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, { 
        status: newStatus,
        estimatedDeliveryTime: newStatus === 'out_for_delivery' ? new Date(Date.now() + 30 * 60000).toISOString() : undefined
      });
      
      toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`);
      
      // Update the order in the local state
      const updatedOrders = allOrders.map(order => {
        if (order._id === orderId) {
          return { ...order, status: newStatus };
        }
        return order;
      });
      
      setAllOrders(updatedOrders);
      
      // Refetch all orders to ensure data consistency
      const restaurantId = user?.restaurantId || (restaurant && restaurant._id);
      if (restaurantId) {
        fetchOrders(restaurantId);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
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
  
  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'out_for_delivery',
      out_for_delivery: 'delivered'
    };
    
    return statusFlow[currentStatus] || null;
  };
  
  if (!user || (!user.restaurantId && !restaurant)) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No restaurant found. Please make sure you're logged in as a restaurant admin and have a restaurant assigned to your account.
              </p>
              <div className="mt-4">
                <Link 
                  to="/restaurant-admin/dashboard" 
                  className="text-sm font-medium text-yellow-700 underline hover:text-yellow-600"
                >
                  Go to dashboard to create a restaurant
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Restaurant Orders</h1>
        {restaurant && (
          <p className="text-sm text-gray-500 mt-2 sm:mt-0">
            Restaurant: {restaurant.name}
          </p>
        )}
      </div>
      
      {/* Filter dropdown */}
      <div className="mt-6 mb-4">
        <div className="flex items-center">
          <FiFilter className="mr-2 text-gray-500" />
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mr-2">
            Filter by status:
          </label>
          <select
            id="status-filter"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-10 rounded-lg shadow-sm text-center mt-6">
          <p className="text-gray-500 text-lg">
            {statusFilter === 'all' ? 'No orders found.' : `No ${statusFilter.replace('_', ' ')} orders found.`}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Order #</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Customer</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Items</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredOrders.map((order) => {
                const nextStatus = getNextStatus(order.status);
                
                return (
                  <tr key={order._id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {order.orderNumber}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {order.contactPhone}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex space-x-2 justify-end">
                        <Link
                          to={`/restaurant-admin/orders/${order._id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FiEye className="h-5 w-5" />
                        </Link>
                        
                        {nextStatus && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, nextStatus)}
                            className="text-green-600 hover:text-green-900"
                            title={`Mark as ${nextStatus.replace('_', ' ')}`}
                          >
                            <FiCheck className="h-5 w-5" />
                          </button>
                        )}
                        
                        {(order.status === 'pending' || order.status === 'confirmed') && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel order"
                          >
                            <FiX className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RestaurantOrdersPage; 
 
 
 
 