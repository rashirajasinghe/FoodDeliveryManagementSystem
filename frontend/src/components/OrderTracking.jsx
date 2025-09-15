import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  Circle, 
  Truck, 
  Utensils, 
  User,
  Phone,
  Navigation
} from 'lucide-react';
import { useFoodDelivery } from '../contexts/FoodDeliveryContext';

const OrderTracking = ({ orderId, isOpen, onClose }) => {
  const { getOrder } = useFoodDelivery();
  const [order, setOrder] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    setSocket(newSocket);

    // Join order tracking room
    if (orderId) {
      newSocket.emit('join-order-room', orderId);
    }

    // Listen for order updates
    newSocket.on('order-updated', (data) => {
      if (data.orderId === orderId) {
        fetchOrder(); // Refresh order data
      }
    });

    // Listen for driver location updates
    newSocket.on('driver-location-updated', (data) => {
      if (data.orderId === orderId) {
        setDriverLocation(data.location);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await getOrder(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status, currentStatus) => {
    const isCompleted = getStatusOrder(currentStatus) >= getStatusOrder(status);
    const isCurrent = status === currentStatus;

    if (isCompleted) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    } else if (isCurrent) {
      return <Circle className="h-6 w-6 text-blue-500 fill-current" />;
    } else {
      return <Circle className="h-6 w-6 text-gray-300" />;
    }
  };

  const getStatusOrder = (status) => {
    const order = {
      pending: 1,
      confirmed: 2,
      preparing: 3,
      ready: 4,
      out_for_delivery: 5,
      delivered: 6,
      cancelled: 0
    };
    return order[status] || 0;
  };

  const getStatusText = (status) => {
    const statusTexts = {
      pending: 'Order Received',
      confirmed: 'Order Confirmed',
      preparing: 'Preparing Food',
      ready: 'Ready for Pickup',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return statusTexts[status] || status;
  };

  const getEstimatedTime = () => {
    if (!order) return null;
    
    const now = new Date();
    const estimatedTime = new Date(order.estimatedDeliveryTime);
    const diffMinutes = Math.ceil((estimatedTime - now) / (1000 * 60));
    
    if (diffMinutes <= 0) return 'Any moment now';
    if (diffMinutes < 60) return `${diffMinutes} minutes`;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Order Tracking
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {order && (
              <p className="text-sm text-gray-600 mt-1">
                Order #{order.orderNumber}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : order ? (
              <div className="space-y-6">
                {/* Order Status Timeline */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Order Progress</h3>
                  
                  <div className="space-y-3">
                    {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].map((status, index) => (
                      <motion.div
                        key={status}
                        className="flex items-center space-x-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {getStatusIcon(status, order.status)}
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            getStatusOrder(order.status) >= getStatusOrder(status)
                              ? 'text-gray-900'
                              : 'text-gray-500'
                          }`}>
                            {getStatusText(status)}
                          </p>
                          {status === order.status && (
                            <p className="text-xs text-blue-600">
                              {getEstimatedTime()}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Restaurant Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Restaurant</h4>
                  <div className="flex items-center space-x-3">
                    <Utensils className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{order.restaurant?.name}</p>
                      <p className="text-sm text-gray-600">{order.restaurant?.cuisine}</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Driver Info */}
                {order.deliveryDriver && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Delivery Driver</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{order.deliveryDriver.name}</p>
                          <p className="text-sm text-gray-600">
                            {order.deliveryDriver.driverInfo?.vehicleType || 'Vehicle'}
                          </p>
                        </div>
                      </div>
                      {order.deliveryDriver.phone && (
                        <a
                          href={`tel:${order.deliveryDriver.phone}`}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                        >
                          <Phone className="h-4 w-4" />
                          <span className="text-sm">Call</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery Address */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm">{order.deliveryAddress.street}</p>
                      <p className="text-sm text-gray-600">
                        {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                      </p>
                      {order.deliveryAddress.instructions && (
                        <p className="text-sm text-gray-500 mt-1">
                          Note: {order.deliveryAddress.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">
                          {item.quantity}x {item.menuItem.name}
                        </span>
                        <span className="font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 mt-3 pt-3">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Driver Location (if available) */}
                {driverLocation && order.status === 'out_for_delivery' && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Driver Location</h4>
                    <div className="flex items-center space-x-2 text-sm text-green-700">
                      <Navigation className="h-4 w-4" />
                      <span>Driver is on the way</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Last updated: {formatTime(driverLocation.timestamp)}
                    </p>
                  </div>
                )}

                {/* Estimated Delivery Time */}
                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-800">Estimated Delivery</p>
                        <p className="text-sm text-yellow-700">
                          {getEstimatedTime()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Order not found</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OrderTracking;
