import React, { useState, useEffect } from 'react';
import { useFoodDelivery } from '../contexts/FoodDeliveryContext';
import OrderTracking from '../components/OrderTracking';
import NotificationCenter from '../components/NotificationCenter';
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Utensils,
  Bell,
  MapPin,
  Phone,
  Eye
} from 'lucide-react';

const OrdersPage = () => {
  const { 
    orders, 
    loading, 
    getUserOrders, 
    cancelOrder,
    user 
  } = useFoodDelivery();
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTracking, setShowTracking] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filter, setFilter] = useState('all');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    getUserOrders();
  }, []);

  useEffect(() => {
    // Initialize socket connection for real-time updates
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    setSocket(newSocket);

    // Join user room
    if (user?.id) {
      newSocket.emit('join-user-room', user.id);
    }

    // Listen for order updates
    newSocket.on('order-updated', (data) => {
      // Refresh orders when status changes
      getUserOrders();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'preparing':
        return <Utensils className="h-5 w-5 text-orange-500" />;
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'out_for_delivery':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const canCancelOrder = (status) => {
    return ['pending', 'confirmed'].includes(status);
  };

  const handleCancelOrder = async (orderId, reason) => {
    try {
      await cancelOrder(orderId, reason);
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-600">Track your food delivery orders</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <Bell className="h-6 w-6" />
                {/* Notification badge would go here */}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status === 'all' ? 'All Orders' : getStatusText(status)}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Utensils className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? "You haven't placed any orders yet"
                : `No orders with status: ${getStatusText(filter)}`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <motion.div
                key={order._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Order Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>

                    {/* Restaurant Info */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                        {order.restaurant?.images && order.restaurant.images.length > 0 ? (
                          <img
                            src={order.restaurant.images[0].url}
                            alt={order.restaurant.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Utensils className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{order.restaurant?.name}</h4>
                        <p className="text-sm text-gray-600">{order.restaurant?.cuisine}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">Items:</p>
                      <div className="space-y-1">
                        {order.items.slice(0, 2).map((item, index) => (
                          <div key={index} className="text-sm text-gray-700">
                            {item.quantity}x {item.menuItem.name}
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-sm text-gray-500">
                            +{order.items.length - 2} more items
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Total */}
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold text-gray-900">
                        Total: {formatPrice(order.total)}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowTracking(true);
                          }}
                          className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Track</span>
                        </button>
                        
                        {canCancelOrder(order.status) && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to cancel this order?')) {
                                handleCancelOrder(order._id, 'Customer requested cancellation');
                              }
                            }}
                            className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Delivery Info */}
                    {order.deliveryDriver && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Truck className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">
                              Driver: {order.deliveryDriver.name}
                            </span>
                          </div>
                          {order.deliveryDriver.phone && (
                            <a
                              href={`tel:${order.deliveryDriver.phone}`}
                              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                            >
                              <Phone className="h-4 w-4" />
                              <span>Call</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Delivery Address */}
                    <div className="mt-3 flex items-start space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <div>
                        <p>{order.deliveryAddress.street}</p>
                        <p>
                          {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Order Tracking Modal */}
      <OrderTracking
        orderId={selectedOrder?._id}
        isOpen={showTracking}
        onClose={() => setShowTracking(false)}
      />

      {/* Notifications Modal */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
};

export default OrdersPage;
