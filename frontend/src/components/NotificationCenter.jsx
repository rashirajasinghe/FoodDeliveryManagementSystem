import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Truck,
  Utensils,
  Clock
} from 'lucide-react';
import { useFoodDelivery } from '../contexts/FoodDeliveryContext';

const NotificationCenter = ({ isOpen, onClose }) => {
  const { user } = useFoodDelivery();
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    setSocket(newSocket);

    // Join user room for notifications
    if (user?.id) {
      newSocket.emit('join-user-room', user.id);
    }

    // Listen for notifications
    newSocket.on('notification', (notification) => {
      addNotification(notification);
    });

    newSocket.on('order-updated', (data) => {
      addNotification({
        type: 'order-update',
        title: 'Order Update',
        message: data.message || 'Your order status has been updated',
        data: data,
        timestamp: new Date()
      });
    });

    newSocket.on('new-order', (data) => {
      addNotification({
        type: 'new-order',
        title: 'New Order',
        message: data.message || 'You have a new order',
        data: data,
        timestamp: new Date()
      });
    });

    newSocket.on('delivery-assigned', (data) => {
      addNotification({
        type: 'delivery-assigned',
        title: 'Delivery Assigned',
        message: data.message || 'Your order has been assigned to a driver',
        data: data,
        timestamp: new Date()
      });
    });

    newSocket.on('order-cancelled', (data) => {
      addNotification({
        type: 'order-cancelled',
        title: 'Order Cancelled',
        message: data.message || 'Your order has been cancelled',
        data: data,
        timestamp: new Date()
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      ...notification,
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50 notifications
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order-update':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'new-order':
        return <Utensils className="h-5 w-5 text-green-500" />;
      case 'delivery-assigned':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'order-cancelled':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'order-update':
        return 'border-l-blue-500 bg-blue-50';
      case 'new-order':
        return 'border-l-green-500 bg-green-50';
      case 'delivery-assigned':
        return 'border-l-purple-500 bg-purple-50';
      case 'order-cancelled':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                <AnimatePresence>
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      className={`p-4 border-l-4 ${getNotificationColor(notification.type)} ${
                        !notification.read ? 'bg-opacity-100' : 'bg-opacity-50'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatTime(notification.timestamp)}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-1 ml-2">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                              <button
                                onClick={() => removeNotification(notification.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setNotifications([])}
                className="w-full text-sm text-gray-600 hover:text-gray-800"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationCenter;
