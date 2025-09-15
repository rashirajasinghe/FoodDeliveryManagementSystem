const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Review = require('../models/Review');
const Delivery = require('../models/Delivery');

// Get dashboard analytics
const getDashboardAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const userId = req.user.id;
    const userType = req.user.userType;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Base query for orders
    let orderQuery = { createdAt: { $gte: startDate } };
    
    // Filter by user type
    if (userType === 'restaurant_owner') {
      const userRestaurants = await Restaurant.find({ owner: userId }).select('_id');
      const restaurantIds = userRestaurants.map(r => r._id);
      orderQuery.restaurant = { $in: restaurantIds };
    } else if (userType === 'delivery_driver') {
      orderQuery.deliveryDriver = userId;
    }

    // Get orders
    const orders = await Order.find(orderQuery)
      .populate('restaurant', 'name cuisine')
      .populate('customer', 'name')
      .populate('deliveryDriver', 'name');

    // Calculate overview metrics
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get previous period for comparison
    const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousOrders = await Order.find({
      ...orderQuery,
      createdAt: { $gte: previousStartDate, $lt: startDate }
    });

    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0);
    const previousOrderCount = previousOrders.length;

    // Calculate growth percentages
    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;
    const orderGrowth = previousOrderCount > 0 
      ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100 
      : 0;

    // Get active users
    const activeUsers = await User.countDocuments({
      createdAt: { $gte: startDate },
      isActive: true
    });

    const previousActiveUsers = await User.countDocuments({
      createdAt: { $gte: previousStartDate, $lt: startDate },
      isActive: true
    });

    const userGrowth = previousActiveUsers > 0 
      ? ((activeUsers - previousActiveUsers) / previousActiveUsers) * 100 
      : 0;

    // Get average rating
    const reviews = await Review.find({
      createdAt: { $gte: startDate }
    });

    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    // Generate revenue trend data
    const revenueTrend = generateTrendData(orders, startDate, now, 'revenue', 'total');
    
    // Generate orders trend data
    const ordersTrend = generateTrendData(orders, startDate, now, 'orders', 'count');

    // Get top restaurants
    const topRestaurants = await getTopRestaurants(orderQuery, startDate);

    // Get order status distribution
    const orderStatusDistribution = getOrderStatusDistribution(orders);

    // Get popular cuisines
    const popularCuisines = await getPopularCuisines(orderQuery, startDate);

    // Get hourly distribution
    const hourlyDistribution = getHourlyDistribution(orders);

    const analytics = {
      overview: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        activeUsers,
        averageRating,
        totalReviews: reviews.length,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        orderGrowth: Math.round(orderGrowth * 100) / 100,
        userGrowth: Math.round(userGrowth * 100) / 100
      },
      revenueTrend,
      ordersTrend,
      topRestaurants,
      orderStatusDistribution,
      popularCuisines,
      hourlyDistribution
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

// Get restaurant analytics
const getRestaurantAnalytics = async (req, res) => {
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
        message: 'Not authorized to view restaurant analytics'
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get orders for this restaurant
    const orders = await Order.find({
      restaurant: restaurantId,
      createdAt: { $gte: startDate }
    }).populate('customer', 'name');

    // Get reviews for this restaurant
    const reviews = await Review.find({
      restaurant: restaurantId,
      createdAt: { $gte: startDate }
    });

    // Calculate metrics
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    // Get popular menu items
    const popularItems = await getPopularMenuItems(restaurantId, startDate);

    // Get customer demographics
    const customerDemographics = getCustomerDemographics(orders);

    // Get delivery performance
    const deliveryPerformance = await getDeliveryPerformance(restaurantId, startDate);

    const analytics = {
      overview: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        averageRating,
        totalReviews: reviews.length
      },
      popularItems,
      customerDemographics,
      deliveryPerformance,
      revenueTrend: generateTrendData(orders, startDate, now, 'revenue', 'total'),
      ordersTrend: generateTrendData(orders, startDate, now, 'orders', 'count')
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error fetching restaurant analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant analytics',
      error: error.message
    });
  }
};

// Helper functions
function generateTrendData(orders, startDate, endDate, type, aggregation) {
  const data = [];
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const dayOrders = orders.filter(order => 
      order.createdAt >= dayStart && order.createdAt < dayEnd
    );
    
    let value = 0;
    if (type === 'revenue') {
      value = dayOrders.reduce((sum, order) => sum + order.total, 0);
    } else if (type === 'orders') {
      value = dayOrders.length;
    }
    
    data.push({
      date: dayStart.toISOString().split('T')[0],
      [type]: value
    });
  }
  
  return data;
}

async function getTopRestaurants(orderQuery, startDate) {
  const pipeline = [
    { $match: { ...orderQuery, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$restaurant',
        orders: { $sum: 1 },
        revenue: { $sum: '$total' }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 }
  ];

  const results = await Order.aggregate(pipeline);
  
  // Populate restaurant details
  const restaurantIds = results.map(r => r._id);
  const restaurants = await Restaurant.find({ _id: { $in: restaurantIds } });
  
  return results.map(result => {
    const restaurant = restaurants.find(r => r._id.toString() === result._id.toString());
    return {
      _id: result._id,
      name: restaurant?.name || 'Unknown',
      orders: result.orders,
      revenue: result.revenue,
      rating: restaurant?.rating?.average || 0
    };
  });
}

function getOrderStatusDistribution(orders) {
  const statusCounts = {};
  orders.forEach(order => {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
  });

  return Object.entries(statusCounts).map(([name, value]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    value
  }));
}

async function getPopularCuisines(orderQuery, startDate) {
  const pipeline = [
    { $match: { ...orderQuery, createdAt: { $gte: startDate } } },
    {
      $lookup: {
        from: 'restaurants',
        localField: 'restaurant',
        foreignField: '_id',
        as: 'restaurant'
      }
    },
    { $unwind: '$restaurant' },
    {
      $group: {
        _id: '$restaurant.cuisine',
        orders: { $sum: 1 },
        revenue: { $sum: '$total' }
      }
    },
    { $sort: { orders: -1 } },
    { $limit: 5 }
  ];

  const results = await Order.aggregate(pipeline);
  const totalOrders = results.reduce((sum, r) => sum + r.orders, 0);

  return results.map(result => ({
    name: result._id,
    orders: result.orders,
    revenue: result.revenue,
    percentage: Math.round((result.orders / totalOrders) * 100)
  }));
}

function getHourlyDistribution(orders) {
  const hourlyCounts = {};
  
  for (let hour = 0; hour < 24; hour++) {
    hourlyCounts[hour] = 0;
  }
  
  orders.forEach(order => {
    const hour = new Date(order.createdAt).getHours();
    hourlyCounts[hour]++;
  });

  return Object.entries(hourlyCounts).map(([hour, orders]) => ({
    hour: `${hour}:00`,
    orders
  }));
}

async function getPopularMenuItems(restaurantId, startDate) {
  const pipeline = [
    { $match: { restaurant: restaurantId, createdAt: { $gte: startDate } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.menuItem',
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { quantity: -1 } },
    { $limit: 10 }
  ];

  const results = await Order.aggregate(pipeline);
  
  // Get menu item details
  const MenuItem = require('../models/MenuItem');
  const itemIds = results.map(r => r._id);
  const items = await MenuItem.find({ _id: { $in: itemIds } });
  
  return results.map(result => {
    const item = items.find(i => i._id.toString() === result._id.toString());
    return {
      _id: result._id,
      name: item?.name || 'Unknown Item',
      quantity: result.quantity,
      revenue: result.revenue
    };
  });
}

function getCustomerDemographics(orders) {
  const customerCounts = {};
  orders.forEach(order => {
    const customerId = order.customer._id.toString();
    customerCounts[customerId] = (customerCounts[customerId] || 0) + 1;
  });

  const totalCustomers = Object.keys(customerCounts).length;
  const repeatCustomers = Object.values(customerCounts).filter(count => count > 1).length;

  return {
    totalCustomers,
    repeatCustomers,
    newCustomers: totalCustomers - repeatCustomers,
    averageOrdersPerCustomer: totalCustomers > 0 ? orders.length / totalCustomers : 0
  };
}

async function getDeliveryPerformance(restaurantId, startDate) {
  const deliveries = await Delivery.find({
    'order.restaurant': restaurantId,
    createdAt: { $gte: startDate }
  }).populate('order');

  const totalDeliveries = deliveries.length;
  const onTimeDeliveries = deliveries.filter(delivery => {
    if (!delivery.deliveryTime || !delivery.order.estimatedDeliveryTime) return false;
    return delivery.deliveryTime <= delivery.order.estimatedDeliveryTime;
  }).length;

  const averageDeliveryTime = deliveries.reduce((sum, delivery) => {
    if (delivery.deliveryTime && delivery.pickupTime) {
      return sum + (delivery.deliveryTime - delivery.pickupTime) / (1000 * 60); // in minutes
    }
    return sum;
  }, 0) / totalDeliveries;

  return {
    totalDeliveries,
    onTimeDeliveries,
    onTimeRate: totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0,
    averageDeliveryTime: Math.round(averageDeliveryTime)
  };
}

module.exports = {
  getDashboardAnalytics,
  getRestaurantAnalytics
};
