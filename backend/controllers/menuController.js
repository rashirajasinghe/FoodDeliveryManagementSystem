const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const AIService = require('../services/aiService');

// Get menu items for a restaurant
const getMenuItems = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { category, search, sortBy = 'popularity' } = req.query;

    let query = { restaurant: restaurantId, isAvailable: true };

    // Category filter
    if (category) {
      query.category = { $in: category.split(',') };
    }

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    let sortOptions = {};
    switch (sortBy) {
      case 'price_low':
        sortOptions = { price: 1 };
        break;
      case 'price_high':
        sortOptions = { price: -1 };
        break;
      case 'rating':
        sortOptions = { 'rating.average': -1 };
        break;
      case 'popularity':
      default:
        sortOptions = { 'aiData.popularityScore': -1, 'rating.average': -1 };
        break;
    }

    const menuItems = await MenuItem.find(query)
      .populate('restaurant', 'name cuisine')
      .sort(sortOptions);

    res.json({
      success: true,
      data: menuItems
    });

  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu items',
      error: error.message
    });
  }
};

// Get single menu item
const getMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findById(id)
      .populate('restaurant', 'name cuisine address rating')
      .populate('aiData.recommendations');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: menuItem
    });

  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu item',
      error: error.message
    });
  }
};

// Create menu item
const createMenuItem = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const menuItemData = {
      ...req.body,
      restaurant: restaurantId
    };

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
        message: 'Not authorized to add menu items to this restaurant'
      });
    }

    const menuItem = new MenuItem(menuItemData);
    await menuItem.save();

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: menuItem
    });

  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating menu item',
      error: error.message
    });
  }
};

// Update menu item
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const menuItem = await MenuItem.findById(id).populate('restaurant');
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    if (menuItem.restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this menu item'
      });
    }

    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: updatedMenuItem
    });

  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating menu item',
      error: error.message
    });
  }
};

// Delete menu item
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findById(id).populate('restaurant');
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    if (menuItem.restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this menu item'
      });
    }

    // Soft delete
    menuItem.isAvailable = false;
    await menuItem.save();

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting menu item',
      error: error.message
    });
  }
};

// Get AI recommendations for menu items
const getRecommendations = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { userId } = req.query;

    let recommendations = [];

    if (userId) {
      // Personalized recommendations
      recommendations = await AIService.getRecommendations(userId, 10);
      // Filter by restaurant
      recommendations = recommendations.filter(item => 
        item.restaurant._id.toString() === restaurantId
      );
    } else {
      // Popular items for the restaurant
      recommendations = await MenuItem.find({
        restaurant: restaurantId,
        isAvailable: true
      })
      .sort({ 'aiData.popularityScore': -1, 'rating.average': -1 })
      .limit(10)
      .populate('restaurant');
    }

    res.json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
      error: error.message
    });
  }
};

// Optimize pricing for menu item
const optimizePricing = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findById(id).populate('restaurant');
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    if (menuItem.restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to optimize pricing for this menu item'
      });
    }

    const suggestedPrice = await AIService.optimizePricing(id);

    res.json({
      success: true,
      data: {
        currentPrice: menuItem.price,
        suggestedPrice,
        aiData: menuItem.aiData
      }
    });

  } catch (error) {
    console.error('Error optimizing pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Error optimizing pricing',
      error: error.message
    });
  }
};

// Get menu categories
const getCategories = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const categories = await MenuItem.distinct('category', {
      restaurant: restaurantId,
      isAvailable: true
    });

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

module.exports = {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getRecommendations,
  optimizePricing,
  getCategories
};
