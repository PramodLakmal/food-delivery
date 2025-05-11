import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiClock, FiPackage, FiCheck, FiX, FiEye } from 'react-icons/fi';
import * as orderService from '../services/orderService';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  
  useEffect(() => {
    fetchOrders();
  }, [activeTab]);
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Filter orders based on active tab
      const status = activeTab === 'active' 
        ? ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery']
        : activeTab === 'completed'
          ? ['delivered']
          : ['cancelled'];
      
      const response = await orderService.getUserOrders({ status });
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }
    
    try {
      await orderService.cancelOrder(orderId, 'Customer cancelled the order');
      toast.success('Order cancelled successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
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
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('active')}
            className={`${
              activeTab === 'active'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Active Orders
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`${
              activeTab === 'completed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Completed Orders
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`${
              activeTab === 'cancelled'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Cancelled Orders
          </button>
        </nav>
      </div>
      
      {orders.length === 0 ? (
        <div className="bg-white p-10 rounded-lg shadow-sm text-center">
          <p className="text-gray-500 text-lg">No {activeTab} orders found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Order #{order.orderNumber}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {getStatusBadge(order.status)}
                  <Link
                    to={`/orders/${order._id}`}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FiEye className="mr-1" /> Details
                  </Link>
                  {(order.status === 'pending' || order.status === 'confirmed') && (
                    <button
                      onClick={() => handleCancelOrder(order._id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                    >
                      <FiX className="mr-1" /> Cancel
                    </button>
                  )}
                </div>
              </div>
              
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Restaurant</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.restaurantName}</dd>
                  </div>
                  
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900">${order.totalAmount.toFixed(2)}</dd>
                  </div>
                  
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Items</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                        {order.items.map((item) => (
                          <li key={item._id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <span className="ml-2 flex-1 w-0 truncate">
                                {item.quantity}x {item.name}
                              </span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  
                  {order.estimatedDeliveryTime && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Estimated Delivery Time</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <div className="flex items-center">
                          <FiClock className="mr-1 text-gray-400" />
                          {formatDate(order.estimatedDeliveryTime)}
                        </div>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage; 
 
 
 
 