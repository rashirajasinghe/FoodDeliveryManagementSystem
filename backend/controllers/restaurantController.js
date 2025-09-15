const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Review = require('../models/Review');
const AIService = require('../services/aiService');

// Get all restaurants with filters
const getRestaurants = async (req, res) => {
  try {
    const {
      cuisine,
      minRating,
      maxDeliveryFee,
      isOpen,
      search,
      latitude,
      longitude,
      maxDistance = 10,
      page = 1,
      limit = 20
    } = req.query;

    let query = { isActive: true };

    // Cuisine filter
    if (cuisine) {
      query.cuisine = { $in: cuisine.split(',') };
    }

    // Rating filter
    if (minRating) {
      query['rating.average'] = { $gte: parseFloat(minRating) };
    }

    // Delivery fee filter
    if (maxDeliveryFee) {
      query.deliveryFee = { $lte: parseFloat(maxDeliveryFee) };
    }

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Open now filter
    if (isOpen === 'true') {
      const now = new Date();
      const currentDay = now.toLocaleLowerCase().slice(0, 3);
      const currentTime = now.toTimeString().slice(0, 5);
      
      query[`operatingHours.${currentDay}.closed`] = false;
      query[`operatingHours.${currentDay}.open`] = { $lte: currentTime };
      query[`operatingHours.${currentDay}.close`] = { $gte: currentTime };
    }

    let restaurants = await Restaurant.find(query)
      .populate('owner', 'name email')
      .sort({ 'rating.average': -1, 'aiRecommendations.trendingScore': -1 });

    // Location-based filtering
    if (latitude && longitude) {
      const userLocation = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };

      restaurants = restaurants.filter(restaurant => {
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          restaurant.address.coordinates.latitude,
          restaurant.address.coordinates.longitude
        );
        return distance <= maxDistance;
      });
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedRestaurants = restaurants.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedRestaurants,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(restaurants.length / limit),
        total: restaurants.length
      }
    });

  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurants',
      error: error.message
    });
  }
};

// Get single restaurant
const getRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    
    const restaurant = await Restaurant.findById(id)
      .populate('owner', 'name email phone')
      .populate('aiRecommendations.popularItems');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Get menu items
    const menuItems = await MenuItem.find({ restaurant: id, isAvailable: true })
      .sort({ 'aiData.popularityScore': -1, 'rating.average': -1 });

    // Get recent reviews
    const reviews = await Review.find({ restaurant: id })
      .populate('customer', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        restaurant,
        menuItems,
        reviews
      }
    });

  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant',
      error: error.message
    });
  }
};

// Create restaurant (for restaurant owners)
const createRestaurant = async (req, res) => {
  try {
    const restaurantData = {
      ...req.body,
      owner: req.user.id
    };

    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: restaurant
    });

  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating restaurant',
      error: error.message
    });
  }
};

// Update restaurant
const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if user owns the restaurant
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this restaurant'
      });
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Restaurant updated successfully',
      data: updatedRestaurant
    });

  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating restaurant',
      error: error.message
    });
  }
};

// Delete restaurant
const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this restaurant'
      });
    }

    // Soft delete
    restaurant.isActive = false;
    await restaurant.save();

    res.json({
      success: true,
      message: 'Restaurant deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting restaurant',
      error: error.message
    });
  }
};

// Get restaurant analytics
const getRestaurantAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30d' } = req.query;

    // Check if user owns the restaurant
    const restaurant = await Restaurant.findById(id);
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

    // Get orders
    const orders = await Order.find({
      restaurant: id,
      createdAt: { $gte: startDate }
    });

    // Get reviews
    const reviews = await Review.find({
      restaurant: id,
      createdAt: { $gte: startDate }
    });

    // Calculate analytics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    // Daily revenue
    const dailyRevenue = {};
    orders.forEach(order => {
      const date = order.createdAt.toDateString();
      dailyRevenue[date] = (dailyRevenue[date] || 0) + order.total;
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
      .slice(0, 5)
      .map(([itemId, count]) => ({ itemId, count }));

    // Get AI demand forecast
    const demandForecast = await AIService.forecastDemand(id, 7);

    res.json({
      success: true,
      data: {
        overview: {
          totalOrders,
          totalRevenue,
          avgOrderValue,
          avgRating,
          totalReviews: reviews.length
        },
        dailyRevenue,
        popularItems,
        demandForecast
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
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
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantAnalytics
};
