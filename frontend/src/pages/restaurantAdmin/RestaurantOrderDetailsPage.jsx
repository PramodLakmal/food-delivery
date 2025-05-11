import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiCheck, FiX, FiClock, FiTruck, FiPackage } from 'react-icons/fi';
import * as orderService from '../../services/orderService';
import * as restaurantService from '../../services/restaurantService';
import { deliveryApi } from '../../services/api';
import DeliveryAssignment from '../../components/restaurant/DeliveryAssignment';
import axios from 'axios';

const RestaurantOrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRestaurants, setUserRestaurants] = useState([]);
  const initialLoadComplete = useRef(false);
  const fetchingData = useRef(false);
  
  // First, fetch the user's restaurants
  useEffect(() => {
    const loadData = async () => {
      if (user && !initialLoadComplete.current && !fetchingData.current) {
        try {
          console.log("Starting data load for order details page");
          fetchingData.current = true;
          setLoading(true);
          
          // First fetch restaurants
          const restaurants = await fetchUserRestaurants();
          console.log("Fetched user restaurants:", restaurants);
          
          // Then fetch order details
          if (restaurants && restaurants.length > 0) {
            await fetchOrder(restaurants);
          } else {
            console.error("No restaurants found for user");
            toast.error("You don't have any restaurants to manage orders for");
            navigate('/restaurant-admin/dashboard');
          }
          
          initialLoadComplete.current = true;
        } catch (error) {
          console.error("Error loading data:", error);
          toast.error("Failed to load order details");
        } finally {
          setLoading(false);
          fetchingData.current = false;
        }
      }
    };
    
    loadData();
  }, [user, orderId, navigate]);
  
  const fetchUserRestaurants = async () => {
    try {
      console.log("Fetching restaurants for user:", user.id);
      const response = await restaurantService.getRestaurantsByOwner(user.id);
      console.log("Restaurant API response:", response);
      
      if (response && response.length > 0) {
        // Find restaurant where either owner or ownerId matches user.id
        const restaurants = response;
        console.log("All user restaurants:", restaurants);
        
        setUserRestaurants(restaurants);
        return restaurants;
      }
      return [];
    } catch (error) {
      console.error("Error fetching user restaurants:", error);
      toast.error("Failed to fetch restaurant information");
      return [];
    }
  };
  
  const fetchOrder = async (restaurants) => {
    try {
      console.log("Fetching order details for ID:", orderId);
      const response = await orderService.getOrderById(orderId);
      console.log("Order details response:", response);
      
      if (!response || !response.data) {
        toast.error("Order not found");
        navigate('/restaurant-admin/orders');
        return;
      }
      
      const orderData = response.data;
      
      // Check if this order belongs to one of the user's restaurants
      const restaurantId = orderData.restaurantId;
      console.log("Order restaurant ID:", restaurantId);
      console.log("User restaurants:", restaurants.map(r => ({ id: r._id, name: r.name })));
      
      // Check if order's restaurantId matches any of user's restaurants
      // Need to handle different ID formats (with or without ObjectId wrapper)
      const hasAccess = restaurants.some(restaurant => {
        const restaurantMatches = 
          restaurant._id === restaurantId || 
          restaurant.id === restaurantId ||
          (restaurant._id && restaurant._id.toString() === restaurantId) ||
          (restaurantId && restaurantId.toString && restaurant._id === restaurantId.toString());
        
        console.log(`Checking restaurant ${restaurant.name} (${restaurant._id}): ${restaurantMatches}`);
        return restaurantMatches;
      });
      
      console.log("User has access to this order:", hasAccess);
      
      if (!hasAccess) {
        console.error("Permission denied - order restaurant ID doesn't match user's restaurants");
        toast.error("You don't have permission to view this order");
        navigate('/restaurant-admin/orders');
        return;
      }
      
      // Check if the order has delivery information
      if (orderData.deliveryId) {
        console.log("Order has delivery ID:", orderData.deliveryId);
      }
      
      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error('Failed to load order details');
      navigate('/restaurant-admin/orders');
    }
  };
  
  const handleUpdateStatus = async (newStatus) => {
    if (fetchingData.current) return;
    
    try {
      fetchingData.current = true;
      setLoading(true);
      const payload = { status: newStatus };
      
      // If status is out_for_delivery, set estimated delivery time to 30 minutes from now
      if (newStatus === 'out_for_delivery') {
        payload.estimatedDeliveryTime = new Date(Date.now() + 30 * 60000).toISOString();
      }
      
      console.log(`Updating order ${orderId} status to ${newStatus}`);
      await orderService.updateOrderStatus(orderId, payload);
      toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`);
      
      // Refresh order data
      await fetchOrder(userRestaurants);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setLoading(false);
      fetchingData.current = false;
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
    if (!dateString) return 'N/A';
    
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
  
  // Create a delivery for the order if it doesn't exist
  const createDeliveryForOrder = async (orderId) => {
    try {
      const response = await deliveryApi.post('/deliveries/create-for-order', { orderId });
      if (response.data.success) {
        console.log('Delivery created:', response.data.data);
        
        // Update the order with the delivery ID
        try {
          const orderUpdateResponse = await orderService.updateOrderDeliveryInfo(orderId, {
            deliveryId: response.data.data._id
          });
          
          console.log('Order updated with delivery ID:', orderUpdateResponse);
        } catch (error) {
          console.error('Error updating order with delivery ID:', error);
          // Continue even if this fails - the delivery is still created
        }
        
        // Update the order with delivery information
        setOrder(prevOrder => ({
          ...prevOrder,
          deliveryId: response.data.data._id
        }));
        return response.data.data;
      } else {
        toast.error(response.data.message || 'Failed to create delivery');
        return null;
      }
    } catch (error) {
      console.error('Error creating delivery:', error);
      toast.error(error.response?.data?.message || 'Error creating delivery');
      return null;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="bg-white p-10 rounded-lg shadow-sm text-center">
        <p className="text-gray-500 text-lg">Order not found.</p>
        <Link to="/restaurant-admin/orders" className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800">
          <FiArrowLeft className="mr-2" /> Back to orders
        </Link>
      </div>
    );
  }
  
  const nextStatus = getNextStatus(order.status);
  
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/restaurant-admin/orders" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <FiArrowLeft className="mr-2" /> Back to orders
        </Link>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Order #{order.orderNumber}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(order.status)}
            
            {nextStatus && (
              <button
                onClick={() => handleUpdateStatus(nextStatus)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiCheck className="mr-1" /> Mark as {nextStatus.replace('_', ' ')}
              </button>
            )}
            
            {(order.status === 'pending' || order.status === 'confirmed') && (
              <button
                onClick={() => handleUpdateStatus('cancelled')}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FiX className="mr-1" /> Cancel Order
              </button>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Customer</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.customerName || 'N/A'}
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Contact Phone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.contactPhone || 'N/A'}
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Delivery Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.deliveryAddress && typeof order.deliveryAddress === 'object' ? 
                  `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zipCode}` 
                  : 
                  (typeof order.deliveryAddress === 'string' ? order.deliveryAddress : 'N/A')
                }
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.paymentMethod || 'N/A'}
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                ${order.totalAmount.toFixed(2)}
              </dd>
            </div>
            
            {order.estimatedDeliveryTime && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Estimated Delivery</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(order.estimatedDeliveryTime)}
                </dd>
              </div>
            )}
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Special Instructions</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.specialInstructions || 'None'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {(order.status === 'confirmed' || order.status === 'out_for_delivery' || order.status === 'ready') && 
        order.deliveryAddress && !order.deliveryId && (
        <div className="mt-6 px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Delivery Assignment
          </h3>
          
          {(order.status === 'out_for_delivery' || order.status === 'ready') && (
            <div className="bg-yellow-50 p-4 rounded-md mb-4">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> This order is marked as {order.status.replace('_', ' ')}, but no delivery driver has been assigned yet.
                Please assign a driver to complete the delivery process.
              </p>
            </div>
          )}
          
          <DeliveryAssignment 
            delivery={{ 
              _id: order.deliveryId || order._id,
              orderId: order._id,
              pickupLocation: {
                coordinates: {
                  latitude: order.restaurant?.location?.coordinates?.latitude || 0,
                  longitude: order.restaurant?.location?.coordinates?.longitude || 0
                }
              }
            }}
            onAssignmentComplete={(assignmentData) => {
              // Update the order with delivery information
              console.log('Assignment complete, updating order data:', assignmentData);
              setOrder(prevOrder => ({
                ...prevOrder,
                deliveryId: assignmentData.deliveryId,
                deliveryPersonId: assignmentData.deliveryPersonId,
                deliveryPersonName: assignmentData.deliveryPersonName
              }));
              toast.success(`Delivery assigned to ${assignmentData.deliveryPersonName}`);
            }}
            createDeliveryIfNeeded={async () => {
              console.log('Creating delivery for order ID:', order._id);
              if (!order.deliveryId) {
                return await createDeliveryForOrder(order._id);
              }
              return null;
            }}
          />
        </div>
      )}
      
      {order.deliveryId && (
        <div className="mt-6 px-4 py-5 sm:px-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
            <FiTruck className="mr-2" /> Delivery Information
          </h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Delivery ID:</span> {order.deliveryId}
            </p>
            {order.deliveryPersonName && (
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Driver:</span> {order.deliveryPersonName}
              </p>
            )}
            <div className="mt-4">
              <Link 
                to={`/restaurant-admin/deliveries/${order.deliveryId}`} 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiTruck className="mr-2" /> View Delivery Details
              </Link>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Order Items</h4>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {order.items.map((item, index) => (
              <li key={index} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="h-16 w-16 object-cover rounded-md mr-4"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gray-200 rounded-md mr-4 flex items-center justify-center">
                        <FiPackage className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.quantity} x ${item.price.toFixed(2)}</div>
                      {item.options && item.options.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Options: {item.options.map(opt => opt.name).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
            <div className="flex justify-between text-base font-medium text-gray-900">
              <p>Subtotal</p>
              <p>${order.subtotal ? order.subtotal.toFixed(2) : order.totalAmount.toFixed(2)}</p>
            </div>
            
            {order.deliveryFee !== undefined && (
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <p>Delivery Fee</p>
                <p>${order.deliveryFee.toFixed(2)}</p>
              </div>
            )}
            
            {order.tax !== undefined && (
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <p>Tax</p>
                <p>${order.tax.toFixed(2)}</p>
              </div>
            )}
            
            <div className="flex justify-between text-base font-medium text-gray-900 mt-4 pt-4 border-t border-gray-200">
              <p>Total</p>
              <p>${order.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantOrderDetailsPage; 
 
 
 
 