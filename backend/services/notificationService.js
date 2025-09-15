const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  // Send order status update notification
  async sendOrderStatusUpdate(orderId, status) {
    try {
      const order = await Order.findById(orderId)
        .populate('customer', 'name')
        .populate('restaurant', 'name owner')
        .populate('deliveryDriver', 'name');

      if (!order) return;

      const notificationData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status,
        timestamp: new Date(),
        customer: order.customer?.name,
        restaurant: order.restaurant?.name,
        driver: order.deliveryDriver?.name
      };

      // Notify customer
      if (order.customer) {
        this.io.to(`user-${order.customer._id}`).emit('order-updated', {
          ...notificationData,
          type: 'order-status-update',
          message: this.getStatusMessage(status, 'customer')
        });
      }

      // Notify restaurant owner
      if (order.restaurant?.owner) {
        this.io.to(`user-${order.restaurant.owner}`).emit('order-updated', {
          ...notificationData,
          type: 'order-status-update',
          message: this.getStatusMessage(status, 'restaurant')
        });
      }

      // Notify delivery driver
      if (order.deliveryDriver) {
        this.io.to(`user-${order.deliveryDriver._id}`).emit('order-updated', {
          ...notificationData,
          type: 'order-status-update',
          message: this.getStatusMessage(status, 'driver')
        });
      }

      // Notify restaurant room
      this.io.to(`restaurant-${order.restaurant._id}`).emit('order-updated', {
        ...notificationData,
        type: 'order-status-update'
      });

    } catch (error) {
      console.error('Error sending order status update:', error);
    }
  }

  // Send driver location update
  async sendDriverLocationUpdate(orderId, driverId, location) {
    try {
      const order = await Order.findById(orderId).populate('customer');
      
      if (!order) return;

      this.io.to(`user-${order.customer._id}`).emit('driver-location-updated', {
        orderId,
        driverId,
        location,
        timestamp: new Date()
      });

      // Also notify restaurant for tracking
      this.io.to(`restaurant-${order.restaurant}`).emit('driver-location-updated', {
        orderId,
        driverId,
        location,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error sending driver location update:', error);
    }
  }

  // Send new order notification to restaurant
  async sendNewOrderNotification(orderId) {
    try {
      const order = await Order.findById(orderId)
        .populate('restaurant', 'name owner')
        .populate('customer', 'name');

      if (!order) return;

      const notificationData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customer: order.customer?.name,
        restaurant: order.restaurant?.name,
        total: order.total,
        timestamp: new Date(),
        type: 'new-order',
        message: `New order #${order.orderNumber} from ${order.customer?.name}`
      };

      // Notify restaurant owner
      if (order.restaurant?.owner) {
        this.io.to(`user-${order.restaurant.owner}`).emit('new-order', notificationData);
      }

      // Notify restaurant room
      this.io.to(`restaurant-${order.restaurant._id}`).emit('new-order', notificationData);

    } catch (error) {
      console.error('Error sending new order notification:', error);
    }
  }

  // Send delivery assignment notification
  async sendDeliveryAssignmentNotification(orderId, driverId) {
    try {
      const order = await Order.findById(orderId)
        .populate('customer', 'name')
        .populate('deliveryDriver', 'name phone');

      if (!order) return;

      const notificationData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customer: order.customer?.name,
        driver: order.deliveryDriver?.name,
        driverPhone: order.deliveryDriver?.phone,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        timestamp: new Date(),
        type: 'delivery-assigned',
        message: `Your order has been assigned to ${order.deliveryDriver?.name}`
      };

      // Notify customer
      this.io.to(`user-${order.customer._id}`).emit('delivery-assigned', notificationData);

      // Notify driver
      this.io.to(`user-${driverId}`).emit('delivery-assigned', {
        ...notificationData,
        message: `You have been assigned order #${order.orderNumber}`
      });

    } catch (error) {
      console.error('Error sending delivery assignment notification:', error);
    }
  }

  // Send order cancellation notification
  async sendOrderCancellationNotification(orderId, reason) {
    try {
      const order = await Order.findById(orderId)
        .populate('customer', 'name')
        .populate('restaurant', 'name owner')
        .populate('deliveryDriver', 'name');

      if (!order) return;

      const notificationData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        reason,
        timestamp: new Date(),
        type: 'order-cancelled',
        message: `Order #${order.orderNumber} has been cancelled`
      };

      // Notify customer
      if (order.customer) {
        this.io.to(`user-${order.customer._id}`).emit('order-cancelled', {
          ...notificationData,
          message: `Your order #${order.orderNumber} has been cancelled. Reason: ${reason}`
        });
      }

      // Notify restaurant owner
      if (order.restaurant?.owner) {
        this.io.to(`user-${order.restaurant.owner}`).emit('order-cancelled', {
          ...notificationData,
          message: `Order #${order.orderNumber} from ${order.customer?.name} has been cancelled`
        });
      }

      // Notify driver if assigned
      if (order.deliveryDriver) {
        this.io.to(`user-${order.deliveryDriver._id}`).emit('order-cancelled', {
          ...notificationData,
          message: `Order #${order.orderNumber} has been cancelled`
        });
      }

    } catch (error) {
      console.error('Error sending order cancellation notification:', error);
    }
  }

  // Get status message based on user type
  getStatusMessage(status, userType) {
    const messages = {
      customer: {
        pending: 'Your order has been received and is being processed',
        confirmed: 'Your order has been confirmed by the restaurant',
        preparing: 'Your order is being prepared',
        ready: 'Your order is ready for pickup',
        out_for_delivery: 'Your order is out for delivery',
        delivered: 'Your order has been delivered',
        cancelled: 'Your order has been cancelled'
      },
      restaurant: {
        pending: 'New order received',
        confirmed: 'Order confirmed',
        preparing: 'Order is being prepared',
        ready: 'Order is ready for pickup',
        out_for_delivery: 'Order is out for delivery',
        delivered: 'Order has been delivered',
        cancelled: 'Order has been cancelled'
      },
      driver: {
        pending: 'New delivery assignment',
        confirmed: 'Order confirmed for delivery',
        preparing: 'Order is being prepared',
        ready: 'Order is ready for pickup',
        out_for_delivery: 'Order is out for delivery',
        delivered: 'Order has been delivered',
        cancelled: 'Order has been cancelled'
      }
    };

    return messages[userType]?.[status] || 'Order status updated';
  }

  // Send general notification to user
  async sendUserNotification(userId, type, message, data = {}) {
    try {
      this.io.to(`user-${userId}`).emit('notification', {
        type,
        message,
        data,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending user notification:', error);
    }
  }

  // Send broadcast notification to all users
  async sendBroadcastNotification(type, message, data = {}) {
    try {
      this.io.emit('broadcast-notification', {
        type,
        message,
        data,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending broadcast notification:', error);
    }
  }
}

module.exports = NotificationService;
