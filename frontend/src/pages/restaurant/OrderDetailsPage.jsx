import DeliveryAssignment from '../../components/restaurant/DeliveryAssignment';

// Inside the OrderDetailsPage component, add this section where appropriate
{/* Delivery Assignment Section - Only show for pending orders that need delivery */}
{order.status === 'confirmed' && order.deliveryMethod === 'delivery' && !order.deliveryId && (
  <div className="mt-6">
    <DeliveryAssignment 
      delivery={{ 
        _id: order.deliveryId || 'temp-id', // Will be replaced with actual ID once created
        pickupLocation: {
          coordinates: {
            latitude: restaurant?.location?.coordinates?.latitude || 0,
            longitude: restaurant?.location?.coordinates?.longitude || 0
          }
        }
      }}
      onAssignmentComplete={(assignmentData) => {
        // Update the order with delivery information
        setOrder(prevOrder => ({
          ...prevOrder,
          deliveryId: assignmentData.deliveryId,
          deliveryPersonId: assignmentData.deliveryPersonId,
          deliveryPersonName: assignmentData.deliveryPersonName
        }));
        toast.success(`Delivery assigned to ${assignmentData.deliveryPersonName}`);
      }}
    />
  </div>
)}

// If there's already a delivery assigned, show delivery details
{order.deliveryId && (
  <div className="mt-6 bg-white shadow rounded-lg p-4">
    <h3 className="text-lg font-semibold mb-2 flex items-center">
      <FiTruck className="mr-2" /> Delivery Information
    </h3>
    <p className="text-sm text-gray-600">
      <span className="font-medium">Delivery ID:</span> {order.deliveryId}
    </p>
    {order.deliveryPersonName && (
      <p className="text-sm text-gray-600">
        <span className="font-medium">Driver:</span> {order.deliveryPersonName}
      </p>
    )}
    <div className="mt-2">
      <Link 
        to={`/restaurant/deliveries/${order.deliveryId}`} 
        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        View Delivery Details
      </Link>
    </div>
  </div>
)} 