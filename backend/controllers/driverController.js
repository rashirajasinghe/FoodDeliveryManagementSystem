const User = require('../models/User');
const Order = require('../models/Order');
const Delivery = require('../models/Delivery');
const Restaurant = require('../models/Restaurant');
const NotificationService = require('../services/notificationService');

// Get driver's assigned orders
const getDriverOrders = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { status } = req.query;

    let query = { driver: driverId };
    if (status) {
      query.status = status;
    }

    const deliveries = await Delivery.find(query)
      .populate({
        path: 'order',
        populate: [
          { path: 'customer', select: 'name phone' },
          { path: 'restaurant', select: 'name cuisine address' },
          { path: 'items.menuItem', select: 'name price' }
        ]
      })
      .sort({ createdAt: -1 });

    const orders = deliveries.map(delivery => ({
      ...delivery.order.toObject(),
      deliveryStatus: delivery.status,
      deliveryFee: delivery.deliveryFee,
      driverEarnings: delivery.driverEarnings
    }));

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Error fetching driver orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching driver orders',
      error: error.message
    });
  }
};

// Get driver's completed orders
const getDriverCompletedOrders = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const deliveries = await Delivery.find({
      driver: driverId,
      status: 'delivered'
    })
      .populate({
        path: 'order',
        populate: [
          { path: 'customer', select: 'name' },
          { path: 'restaurant', select: 'name' }
        ]
      })
      .sort({ deliveryTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const orders = deliveries.map(delivery => ({
      orderNumber: delivery.order.orderNumber,
      restaurant: delivery.order.restaurant,
      customer: delivery.order.customer,
      total: delivery.order.total,
      deliveryFee: delivery.deliveryFee,
      driverEarnings: delivery.driverEarnings,
      deliveredAt: delivery.deliveryTime,
      customerRating: delivery.customerRating
    }));

    const total = await Delivery.countDocuments({
      driver: driverId,
      status: 'delivered'
    });

    res.json({
      success: true,
      data: orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching completed orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching completed orders',
      error: error.message
    });
  }
};

// Get driver earnings
const getDriverEarnings = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { period = 'all' } = req.query;

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'today':
        dateFilter = {
          deliveryTime: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
        };
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { deliveryTime: { $gte: weekAgo } };
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = { deliveryTime: { $gte: monthAgo } };
        break;
    }

    const deliveries = await Delivery.find({
      driver: driverId,
      status: 'delivered',
      ...dateFilter
    });

    const earnings = {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      total: 0
    };

    // Calculate earnings
    deliveries.forEach(delivery => {
      const deliveryDate = new Date(delivery.deliveryTime);
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      earnings.total += delivery.driverEarnings;

      if (deliveryDate >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
        earnings.today += delivery.driverEarnings;
      }

      if (deliveryDate >= weekAgo) {
        earnings.thisWeek += delivery.driverEarnings;
      }

      if (deliveryDate >= monthAgo) {
        earnings.thisMonth += delivery.driverEarnings;
      }
    });

    res.json({
      success: true,
      data: earnings
    });

  } catch (error) {
    console.error('Error fetching driver earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching driver earnings',
      error: error.message
    });
  }
};

// Update driver status (online/offline)
const updateDriverStatus = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const driverId = req.user.id;

    const driver = await User.findByIdAndUpdate(
      driverId,
      { 'driverInfo.isAvailable': isAvailable },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      message: `Driver is now ${isAvailable ? 'online' : 'offline'}`,
      data: {
        isAvailable: driver.driverInfo.isAvailable
      }
    });

  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating driver status',
      error: error.message
    });
  }
};

// Update driver location
const updateDriverLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const driverId = req.user.id;

    const location = {
      latitude,
      longitude,
      lastUpdated: new Date()
    };

    const driver = await User.findByIdAndUpdate(
      driverId,
      { 'driverInfo.currentLocation': location },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Emit location update to relevant orders
    const io = req.app.get('io');
    if (io) {
      const activeDeliveries = await Delivery.find({
        driver: driverId,
        status: { $in: ['in_transit', 'picked_up'] }
      }).populate('order');

      activeDeliveries.forEach(delivery => {
        io.to(`order-${delivery.order._id}`).emit('driver-location-updated', {
          orderId: delivery.order._id,
          driverId,
          location,
          timestamp: new Date()
        });
      });
    }

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: { location }
    });

  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating driver location',
      error: error.message
    });
  }
};

// Update delivery status
const updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const driverId = req.user.id;

    const delivery = await Delivery.findOne({
      order: orderId,
      driver: driverId
    }).populate('order');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Update delivery status
    delivery.status = status;
    
    if (status === 'delivered') {
      delivery.deliveryTime = new Date();
    } else if (status === 'picked_up') {
      delivery.pickupTime = new Date();
    }

    await delivery.save();

    // Update order status
    const order = delivery.order;
    let orderStatus = order.status;

    switch (status) {
      case 'picked_up':
        orderStatus = 'ready';
        break;
      case 'in_transit':
        orderStatus = 'out_for_delivery';
        break;
      case 'delivered':
        orderStatus = 'delivered';
        order.actualDeliveryTime = new Date();
        break;
      case 'failed':
        orderStatus = 'cancelled';
        break;
    }

    order.status = orderStatus;
    await order.save();

    // Send notifications
    const io = req.app.get('io');
    if (io) {
      const notificationService = new NotificationService(io);
      await notificationService.sendOrderStatusUpdate(orderId, orderStatus);
    }

    res.json({
      success: true,
      message: 'Delivery status updated successfully',
      data: {
        deliveryStatus: delivery.status,
        orderStatus: order.status
      }
    });

  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating delivery status',
      error: error.message
    });
  }
};

// Get nearby orders for assignment
const getNearbyOrders = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;
    const driverId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required'
      });
    }

    // Find orders without assigned drivers within radius
    const orders = await Order.find({
      status: { $in: ['confirmed', 'preparing'] },
      deliveryDriver: { $exists: false }
    }).populate('restaurant', 'name address coordinates');

    const nearbyOrders = orders.filter(order => {
      if (!order.restaurant.address.coordinates) return false;
      
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        order.restaurant.address.coordinates.latitude,
        order.restaurant.address.coordinates.longitude
      );
      
      return distance <= radius;
    });

    res.json({
      success: true,
      data: nearbyOrders
    });

  } catch (error) {
    console.error('Error fetching nearby orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby orders',
      error: error.message
    });
  }
};

// Accept order assignment
const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const driverId = req.user.id;

    // Check if driver is available
    const driver = await User.findById(driverId);
    if (!driver.driverInfo.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Driver is not available'
      });
    }

    // Check if order is still available
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.deliveryDriver) {
      return res.status(400).json({
        success: false,
        message: 'Order already assigned to another driver'
      });
    }

    // Assign order to driver
    order.deliveryDriver = driverId;
    order.status = 'confirmed';
    await order.save();

    // Create delivery record
    const delivery = new Delivery({
      order: orderId,
      driver: driverId,
      deliveryFee: order.deliveryFee,
      driverEarnings: order.deliveryFee * 0.8, // 80% to driver
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      status: 'assigned'
    });

    await delivery.save();

    // Send notifications
    const io = req.app.get('io');
    if (io) {
      const notificationService = new NotificationService(io);
      await notificationService.sendDeliveryAssignmentNotification(orderId, driverId);
    }

    res.json({
      success: true,
      message: 'Order accepted successfully',
      data: { orderId, deliveryId: delivery._id }
    });

  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting order',
      error: error.message
    });
  }
};

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = {
  getDriverOrders,
  getDriverCompletedOrders,
  getDriverEarnings,
  updateDriverStatus,
  updateDriverLocation,
  updateDeliveryStatus,
  getNearbyOrders,
  acceptOrder
};
