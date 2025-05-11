import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { FiArrowLeft, FiTruck, FiUser, FiPhone, FiMapPin, FiClock } from 'react-icons/fi';
import api, { deliveryApi } from '../../services/api';

const RestaurantDeliveryDetailsPage = () => {
  const { deliveryId } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchDeliveryDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching delivery details for ID:', deliveryId);
        const response = await deliveryApi.get(`/deliveries/${deliveryId}`);
        console.log('Delivery data:', response.data);
        setDelivery(response.data);
        
        // If we have an orderId, fetch the order details
        if (response.data.orderId) {
          console.log('Fetching order details for ID:', response.data.orderId);
          const orderResponse = await api.get(`/orders/${response.data.orderId}`);
          console.log('Order data:', orderResponse.data);
          // Check if the data is nested in a data property
          const orderData = orderResponse.data.data || orderResponse.data;
          setOrder(orderData);
        }
      } catch (error) {
        console.error('Error fetching delivery details:', error);
        console.error('Error details:', error.response?.data || error.message);
        toast.error('Failed to load delivery details');
      } finally {
        setLoading(false);
      }
    };

    if (deliveryId) {
      fetchDeliveryDetails();
    }
  }, [deliveryId]);

  useEffect(() => {
    // Debug logs
    if (delivery) {
      console.log('Current delivery state:', {
        id: delivery._id,
        status: delivery.status,
        deliveryPerson: {
          id: delivery.deliveryPersonId,
          name: delivery.deliveryPersonName,
          phone: delivery.deliveryPersonPhone
        },
        times: {
          created: delivery.createdAt,
          assigned: delivery.assignedAt,
          pickedUp: delivery.pickedUpAt,
          delivered: delivery.deliveredAt,
          estimated: delivery.estimatedDeliveryTime
        },
        address: delivery.dropoffLocation
      });
    }
    if (order) {
      console.log('Current order state:', {
        id: order._id,
        status: order.status,
        total: order.totalAmount
      });
    }
  }, [delivery, order]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="p-3">
        <div className="text-red-600 text-xl font-medium">
          Delivery not found
        </div>
        <Link 
          to="/restaurant-admin/orders" 
          className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FiArrowLeft className="mr-2" /> Back to Orders
        </Link>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      return format(new Date(dateString), 'PPp');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_assignment':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'picked_up':
        return 'bg-purple-100 text-purple-800';
      case 'in_transit':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-3">
      <Link 
        to={order ? `/restaurant-admin/orders/${delivery.orderId}` : "/restaurant-admin/orders"}
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-3"
      >
        <FiArrowLeft className="mr-2" /> {order ? 'Back to Order Details' : 'Back to Orders'}
      </Link>
      
      <h1 className="text-2xl font-bold mb-4">
        Delivery Details
      </h1>
      
      <div className="grid gap-3">
        {/* Delivery Status Card */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center mb-2">
              <FiTruck className="mr-2" />
              <h2 className="text-lg font-medium">Delivery Status</h2>
            </div>
            <div className="flex items-center">
              <span className="mr-2">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                {delivery.status?.toUpperCase() || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Person Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white shadow rounded-lg h-full">
            <div className="p-4">
              <div className="flex items-center mb-2">
                <FiUser className="mr-2" />
                <h2 className="text-lg font-medium">Delivery Person</h2>
              </div>
              
              {delivery.deliveryPersonId ? (
                <>
                  <div className="flex items-center mb-2">
                    <FiUser className="mr-2 text-sm" />
                    <span>{delivery.deliveryPersonId.name || 'Name not available'}</span>
                  </div>
                  
                  <div className="flex items-center mb-2">
                    <FiPhone className="mr-2 text-sm" />
                    <span>{delivery.deliveryPersonId.phone || 'Phone not available'}</span>
                  </div>
                </>
              ) : (
                <p>No delivery person assigned yet</p>
              )}
            </div>
          </div>

          {/* Delivery Times */}
          <div className="bg-white shadow rounded-lg h-full">
            <div className="p-4">
              <div className="flex items-center mb-2">
                <FiClock className="mr-2" />
                <h2 className="text-lg font-medium">Delivery Timeline</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-gray-500">Created:</p>
                  <p>{formatDate(delivery.createdAt)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Assigned:</p>
                  <p>{formatDate(delivery.assignedAt)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Picked Up:</p>
                  <p>{formatDate(delivery.pickedUpAt)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Delivered:</p>
                  <p>{formatDate(delivery.deliveredAt)}</p>
                </div>
                
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Estimated Delivery:</p>
                  <p>{formatDate(delivery.estimatedDeliveryTime)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center mb-2">
              <FiMapPin className="mr-2" />
              <h2 className="text-lg font-medium">Delivery Address</h2>
            </div>
            
            <p>
              {delivery.dropoffLocation?.address || 'Address not available'}
            </p>
            
            {delivery.specialInstructions && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">Delivery Instructions:</p>
                <p>{delivery.specialInstructions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Details Link */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-4">
            <h2 className="text-lg font-medium mb-2">Order Information</h2>
            <p className="mb-1">
              Order ID: {delivery.orderId || 'N/A'}
            </p>
            <p className="mb-1">
              Status: {order?.status || 'N/A'}
            </p>
            <p className="mb-3">
              Total: ${order?.totalAmount ? order.totalAmount.toFixed(2) : 'N/A'}
            </p>
            <Link 
              to={`/restaurant-admin/orders/${delivery.orderId}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Complete Order Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDeliveryDetailsPage; 