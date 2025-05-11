import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiTruck, FiMapPin, FiRefreshCw, FiCheck } from 'react-icons/fi';
import axios from 'axios';
import { deliveryApi } from '../../services/api';
import * as orderService from '../../services/orderService';

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(point1, point2) {
  const toRad = (value) => (value * Math.PI) / 180;
  
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) * Math.cos(toRad(point2.latitude)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return distance;
}

const DeliveryAssignment = ({ delivery, onAssignmentComplete, createDeliveryIfNeeded }) => {
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [loading, setLoading] = useState({
    drivers: false,
    manualAssign: false,
    autoAssign: false,
    createDelivery: false
  });
  const [deliveryRecord, setDeliveryRecord] = useState(delivery);

  // Ensure we have a valid delivery record
  const ensureDeliveryRecord = async () => {
    if (!deliveryRecord.orderId) {
      console.error('No orderId provided in deliveryRecord:', deliveryRecord);
      toast.error('Missing order ID for delivery creation');
      return deliveryRecord;
    }
    
    console.log('Checking delivery record:', { 
      deliveryId: deliveryRecord._id, 
      orderId: deliveryRecord.orderId,
      isOrderIdSameAsId: deliveryRecord._id === deliveryRecord.orderId 
    });
    
    if (!createDeliveryIfNeeded) {
      console.log('No createDeliveryIfNeeded function provided');
      return deliveryRecord;
    }
    
    // If we don't have a valid delivery ID (just using order ID as fallback)
    if (!deliveryRecord._id || deliveryRecord._id === deliveryRecord.orderId) {
      setLoading(prev => ({ ...prev, createDelivery: true }));
      try {
        console.log('Creating delivery record for order:', deliveryRecord.orderId);
        const createdDelivery = await createDeliveryIfNeeded();
        if (createdDelivery) {
          console.log('Delivery record created:', createdDelivery);
          // Make sure the orderId is still available in the updated record
          const updatedDelivery = {
            ...createdDelivery,
            orderId: deliveryRecord.orderId
          };
          setDeliveryRecord(updatedDelivery);
          return updatedDelivery;
        } else {
          console.error('Failed to create delivery record');
          toast.error('Failed to create delivery record');
          return null;
        }
      } catch (error) {
        console.error('Error creating delivery record:', error);
        toast.error('Failed to create delivery record');
        return null;
      } finally {
        setLoading(prev => ({ ...prev, createDelivery: false }));
      }
    }
    return deliveryRecord;
  };

  // Fetch available drivers
  const fetchAvailableDrivers = async () => {
    setLoading(prev => ({ ...prev, drivers: true }));
    try {
      const response = await deliveryApi.get('/deliveries/available-drivers');
      if (response.data.success) {
        setAvailableDrivers(response.data.data);
      } else {
        toast.error('Failed to fetch available drivers');
      }
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      toast.error('Error fetching available drivers');
    } finally {
      setLoading(prev => ({ ...prev, drivers: false }));
    }
  };

  // Load available drivers on component mount
  useEffect(() => {
    fetchAvailableDrivers();
  }, []);

  // Manually assign a specific driver
  const handleManualAssign = async () => {
    if (!selectedDriverId) {
      toast.error('Please select a driver');
      return;
    }

    setLoading(prev => ({ ...prev, manualAssign: true }));
    try {
      // Ensure we have a valid delivery record
      const currentDelivery = await ensureDeliveryRecord();
      if (!currentDelivery || !currentDelivery._id) {
        toast.error('Could not create or find a valid delivery record');
        return;
      }

      console.log('Assigning driver to delivery:', currentDelivery._id);
      const response = await deliveryApi.post(`/deliveries/${currentDelivery._id}/assign-specific`, {
        deliveryPersonId: selectedDriverId
      });

      if (response.data.success) {
        console.log('Driver assignment successful:', response.data);
        
        // Update the order with delivery information
        try {
          const orderUpdateResponse = await orderService.updateOrderDeliveryInfo(currentDelivery.orderId, {
            deliveryId: currentDelivery._id,
            deliveryPersonId: response.data.data.deliveryPersonId,
            deliveryPersonName: response.data.data.deliveryPersonName
          });
          
          console.log('Order updated with delivery info:', orderUpdateResponse);
        } catch (error) {
          console.error('Error updating order with delivery info:', error);
          // Continue even if this fails - the delivery is still assigned
        }
        
        toast.success(`Delivery assigned to ${response.data.data.deliveryPersonName}`);
        if (onAssignmentComplete) {
          onAssignmentComplete({
            ...response.data.data,
            deliveryId: currentDelivery._id
          });
        }
      } else {
        toast.error(response.data.message || 'Failed to assign delivery');
      }
    } catch (error) {
      console.error('Error assigning delivery:', error);
      toast.error(error.response?.data?.message || 'Error assigning delivery');
    } finally {
      setLoading(prev => ({ ...prev, manualAssign: false }));
    }
  };

  // Auto-assign to nearest driver
  const handleAutoAssign = async () => {
    setLoading(prev => ({ ...prev, autoAssign: true }));
    try {
      // Ensure we have a valid delivery record
      const currentDelivery = await ensureDeliveryRecord();
      if (!currentDelivery || !currentDelivery._id) {
        toast.error('Could not create or find a valid delivery record');
        return;
      }

      console.log('Auto-assigning driver to delivery:', currentDelivery._id);
      const response = await deliveryApi.post(`/deliveries/${currentDelivery._id}/assign-auto`);

      if (response.data.success) {
        console.log('Auto-assignment successful:', response.data);
        
        // Update the order with delivery information
        try {
          const orderUpdateResponse = await orderService.updateOrderDeliveryInfo(currentDelivery.orderId, {
            deliveryId: currentDelivery._id,
            deliveryPersonId: response.data.data.deliveryPersonId,
            deliveryPersonName: response.data.data.deliveryPersonName
          });
          
          console.log('Order updated with delivery info:', orderUpdateResponse);
        } catch (error) {
          console.error('Error updating order with delivery info:', error);
          // Continue even if this fails - the delivery is still assigned
        }
        
        toast.success(`Delivery auto-assigned to ${response.data.data.deliveryPersonName}`);
        if (onAssignmentComplete) {
          onAssignmentComplete({
            ...response.data.data,
            deliveryId: currentDelivery._id
          });
        }
      } else {
        toast.error(response.data.message || 'Failed to auto-assign delivery');
      }
    } catch (error) {
      console.error('Error auto-assigning delivery:', error);
      toast.error(error.response?.data?.message || 'Error auto-assigning delivery');
    } finally {
      setLoading(prev => ({ ...prev, autoAssign: false }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <FiTruck className="mr-2" /> Delivery Assignment
      </h3>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Available Drivers ({availableDrivers.length})
          </label>
          <button 
            onClick={fetchAvailableDrivers} 
            className="text-blue-500 hover:text-blue-700"
            disabled={loading.drivers}
          >
            <FiRefreshCw className={`${loading.drivers ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {availableDrivers.length > 0 ? (
          <select
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">Select a driver</option>
            {availableDrivers.map(driver => (
              <option key={driver._id} value={driver._id}>
                {driver.name} - {driver.vehicle?.type || 'Unknown vehicle'}
                {driver.currentLocation ? ` (${calculateDistance(
                  { latitude: delivery.pickupLocation.coordinates.latitude, longitude: delivery.pickupLocation.coordinates.longitude },
                  { latitude: driver.currentLocation.latitude, longitude: driver.currentLocation.longitude }
                ).toFixed(1)} km away)` : ''}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-gray-500 italic">No available drivers found</div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleManualAssign}
          disabled={loading.manualAssign || !selectedDriverId}
          className={`flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            loading.manualAssign || !selectedDriverId ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading.manualAssign ? (
            <>
              <span className="animate-spin mr-2">⏳</span> Assigning...
            </>
          ) : (
            <>
              <FiCheck className="mr-2" /> Assign Selected Driver
            </>
          )}
        </button>
        
        <button
          onClick={handleAutoAssign}
          disabled={loading.autoAssign || availableDrivers.length === 0}
          className={`flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
            loading.autoAssign || availableDrivers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading.autoAssign ? (
            <>
              <span className="animate-spin mr-2">⏳</span> Assigning...
            </>
          ) : (
            <>
              <FiMapPin className="mr-2" /> Auto-Assign Nearest Driver
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DeliveryAssignment; 