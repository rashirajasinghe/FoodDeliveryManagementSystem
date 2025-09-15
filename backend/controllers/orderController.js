const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Delivery = require('../models/Delivery');
const AIService = require('../services/aiService');
const NotificationService = require('../services/notificationService');

// Create new order
const createOrder = async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      customer: req.user.id
    };

    // Validate menu items and calculate prices
    const validatedItems = await validateOrderItems(orderData.items);
    if (!validatedItems.valid) {
      return res.status(400).json({
        success: false,
        message: validatedItems.message
      });
    }

    // Calculate totals
    const subtotal = validatedItems.items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );

    // Get restaurant for delivery fee
    const restaurant = await Restaurant.findById(orderData.restaurant);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    const deliveryFee = restaurant.deliveryFee || 0;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + deliveryFee + tax + (orderData.tip || 0);

    // Create order
    const order = new Order({
      ...orderData,
      items: validatedItems.items,
      subtotal,
      deliveryFee,
      tax,
      total,
      estimatedDeliveryTime: new Date(Date.now() + restaurant.estimatedDeliveryTime * 60000)
    });

    await order.save();

    // Create delivery assignment
    await assignDeliveryDriver(order._id);

    // Update user AI profile
    await updateUserOrderHistory(req.user.id, order);

    // Send new order notification
    const io = req.app.get('io');
    if (io) {
      const notificationService = new NotificationService(io);
      await notificationService.sendNewOrderNotification(order._id);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// Get user's orders
const getUserOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    let query = { customer: userId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('restaurant', 'name cuisine address rating')
      .populate('items.menuItem', 'name price images')
      .populate('deliveryDriver', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

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
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'name cuisine address contact rating')
      .populate('items.menuItem', 'name description price images')
      .populate('deliveryDriver', 'name phone driverInfo.vehicleType');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
    if (order.customer._id.toString() !== req.user.id && 
        order.restaurant.owner.toString() !== req.user.id &&
        req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id).populate('restaurant');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (order.restaurant.owner.toString() !== req.user.id && 
        req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Update order status
    order.status = status;
    
    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
    }

    await order.save();

    // Update delivery status if exists
    const delivery = await Delivery.findOne({ order: id });
    if (delivery) {
      delivery.status = status === 'out_for_delivery' ? 'in_transit' : 
                      status === 'delivered' ? 'delivered' : delivery.status;
      await delivery.save();
    }

    // Send status update notification
    const io = req.app.get('io');
    if (io) {
      const notificationService = new NotificationService(io);
      await notificationService.sendOrderStatusUpdate(id, status);
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order can be cancelled
    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled'
      });
    }

    // Check authorization
    if (order.customer.toString() !== req.user.id && 
        req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    order.status = 'cancelled';
    order.specialInstructions = reason;
    await order.save();

    // Send cancellation notification
    const io = req.app.get('io');
    if (io) {
      const notificationService = new NotificationService(io);
      await notificationService.sendOrderCancellationNotification(id, reason);
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

// Get restaurant orders
const getRestaurantOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    // Check if user owns the restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view restaurant orders'
      });
    }

    let query = { restaurant: restaurantId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('items.menuItem', 'name price')
      .populate('deliveryDriver', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

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
    console.error('Error fetching restaurant orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant orders',
      error: error.message
    });
  }
};

// Get order analytics
const getOrderAnalytics = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { period = '30d' } = req.query;

    // Check if user owns the restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view analytics'
      });
    }

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const orders = await Order.find({
      restaurant: restaurantId,
      createdAt: { $gte: startDate }
    });

    // Calculate analytics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Status distribution
    const statusDistribution = {};
    orders.forEach(order => {
      statusDistribution[order.status] = (statusDistribution[order.status] || 0) + 1;
    });

    // Hourly distribution
    const hourlyDistribution = {};
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });

    // Popular items
    const itemCounts = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const itemId = item.menuItem.toString();
        itemCounts[itemId] = (itemCounts[itemId] || 0) + item.quantity;
      });
    });

    const popularItems = Object.entries(itemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([itemId, count]) => ({ itemId, count }));

    res.json({
      success: true,
      data: {
        overview: {
          totalOrders,
          totalRevenue,
          avgOrderValue
        },
        statusDistribution,
        hourlyDistribution,
        popularItems
      }
    });

  } catch (error) {
    console.error('Error fetching order analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order analytics',
      error: error.message
    });
  }
};

// Helper function to validate order items
async function validateOrderItems(items) {
  try {
    const validatedItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return { valid: false, message: `Menu item ${item.menuItem} not found` };
      }

      if (!menuItem.isAvailable) {
        return { valid: false, message: `Menu item ${menuItem.name} is not available` };
      }

      validatedItems.push({
        menuItem: item.menuItem,
        quantity: item.quantity,
        price: menuItem.price,
        variants: item.variants || [],
        addons: item.addons || [],
        specialInstructions: item.specialInstructions || ''
      });
    }

    return { valid: true, items: validatedItems };
  } catch (error) {
    return { valid: false, message: 'Error validating order items' };
  }
}

// Helper function to assign delivery driver
async function assignDeliveryDriver(orderId) {
  try {
    const order = await Order.findById(orderId).populate('restaurant');
    if (!order) return;

    // Find available drivers near the restaurant
    const availableDrivers = await User.find({
      userType: 'delivery_driver',
      'driverInfo.isAvailable': true,
      'driverInfo.currentLocation': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [
              order.restaurant.address.coordinates.longitude,
              order.restaurant.address.coordinates.latitude
            ]
          },
          $maxDistance: 10000 // 10km radius
        }
      }
    }).sort({ 'driverInfo.rating.average': -1 });

    if (availableDrivers.length > 0) {
      const driver = availableDrivers[0];
      order.deliveryDriver = driver._id;
      await order.save();

      // Create delivery record
      const delivery = new Delivery({
        order: orderId,
        driver: driver._id,
        deliveryFee: order.deliveryFee,
        driverEarnings: order.deliveryFee * 0.8, // 80% to driver
        estimatedDeliveryTime: order.estimatedDeliveryTime
      });

      await delivery.save();
    }
  } catch (error) {
    console.error('Error assigning delivery driver:', error);
  }
}

// Helper function to update user order history
async function updateUserOrderHistory(userId, order) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Add to order history
    user.aiProfile.orderHistory.push({
      restaurant: order.restaurant,
      items: order.items.map(item => item.menuItem),
      orderDate: order.createdAt,
      rating: 0 // Will be updated when user rates
    });

    // Keep only last 50 orders
    if (user.aiProfile.orderHistory.length > 50) {
      user.aiProfile.orderHistory = user.aiProfile.orderHistory.slice(-50);
    }

    await user.save();
  } catch (error) {
    console.error('Error updating user order history:', error);
  }
}

module.exports = {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getRestaurantOrders,
  getOrderAnalytics
};
