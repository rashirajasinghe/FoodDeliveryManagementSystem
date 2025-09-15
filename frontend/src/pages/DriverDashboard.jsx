import React, { useState, useEffect } from 'react';
import { useFoodDelivery } from '../contexts/FoodDeliveryContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  Navigation, 
  Phone, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Star,
  Truck,
  User,
  Utensils,
  Bell
} from 'lucide-react';

const DriverDashboard = () => {
  const { user, api } = useFoodDelivery();
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [earnings, setEarnings] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user?.userType === 'delivery_driver') {
      fetchDriverData();
      initializeSocket();
      getCurrentLocation();
    }
  }, [user]);

  const fetchDriverData = async () => {
    try {
      setLoading(true);
      // Fetch assigned orders
      const ordersResponse = await api.get('/orders/driver-orders');
      setAssignedOrders(ordersResponse.data.data || []);

      // Fetch earnings
      const earningsResponse = await api.get('/driver/earnings');
      setEarnings(earningsResponse.data.data || earnings);

      // Fetch completed orders
      const completedResponse = await api.get('/orders/driver-completed');
      setCompletedOrders(completedResponse.data.data || []);

    } catch (error) {
      console.error('Error fetching driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = () => {
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    setSocket(newSocket);

    // Join driver room
    if (user?.id) {
      newSocket.emit('join-driver-room', user.id);
    }

    // Listen for new order assignments
    newSocket.on('delivery-assigned', (data) => {
      setNotifications(prev => [data, ...prev]);
      fetchDriverData(); // Refresh orders
    });

    // Listen for order updates
    newSocket.on('order-updated', (data) => {
      fetchDriverData(); // Refresh orders
    });

    return () => {
      newSocket.disconnect();
    };
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date()
          };
          setCurrentLocation(location);
          
          // Send location update to server
          if (socket && isOnline) {
            socket.emit('driver-location-update', {
              driverId: user.id,
              location
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
      await api.put('/driver/toggle-status', { isAvailable: newStatus });
      setIsOnline(newStatus);
      
      if (newStatus) {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      fetchDriverData();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'picked_up': return 'bg-yellow-100 text-yellow-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    const statusTexts = {
      assigned: 'Assigned',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      failed: 'Failed'
    };
    return statusTexts[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Driver Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="h-6 w-6" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Online/Offline Toggle */}
              <button
                onClick={toggleOnlineStatus}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isOnline
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {isOnline ? 'Online' : 'Offline'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Earnings Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Earnings</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatPrice(earnings.today)}</p>
              <p className="text-sm text-gray-600">Today</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{formatPrice(earnings.thisWeek)}</p>
              <p className="text-sm text-gray-600">This Week</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{formatPrice(earnings.thisMonth)}</p>
              <p className="text-sm text-gray-600">This Month</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{formatPrice(earnings.total)}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </div>

        {/* Current Location */}
        {currentLocation && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Location</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>
                {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </span>
              <span className="text-gray-400">•</span>
              <span>Updated {formatTime(currentLocation.timestamp)}</span>
            </div>
          </div>
        )}

        {/* Assigned Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned Orders</h2>
          
          {assignedOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No assigned orders</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignedOrders.map((order) => (
                <motion.div
                  key={order._id}
                  className="border border-gray-200 rounded-lg p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600">{order.restaurant?.name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{order.customer?.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{order.deliveryAddress.street}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Est. delivery: {formatTime(order.estimatedDeliveryTime)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Earnings: {formatPrice(order.deliveryFee * 0.8)}</span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Items:</p>
                    <div className="space-y-1">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          {item.quantity}x {item.menuItem.name}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="text-sm text-gray-500">
                          +{order.items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {order.status === 'assigned' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'picked_up')}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Mark as Picked Up
                      </button>
                    )}
                    
                    {order.status === 'picked_up' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'in_transit')}
                        className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-purple-700"
                      >
                        Start Delivery
                      </button>
                    )}
                    
                    {order.status === 'in_transit' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'delivered')}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700"
                      >
                        Mark as Delivered
                      </button>
                    )}

                    {order.customer?.phone && (
                      <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                        <Phone className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Completed Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Deliveries</h2>
          
          {completedOrders.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p>No completed deliveries yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedOrders.slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Order #{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">{order.restaurant?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{formatPrice(order.deliveryFee * 0.8)}</p>
                    <p className="text-sm text-gray-500">{formatTime(order.deliveredAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
