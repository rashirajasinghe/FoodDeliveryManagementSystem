const Review = require('../models/Review');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const AIService = require('../services/aiService');

// Create review
const createReview = async (req, res) => {
  try {
    const { orderId, rating, comment, foodRating, deliveryRating, serviceRating, images } = req.body;
    const userId = req.user.id;

    // Check if order exists and belongs to user
    const order = await Order.findById(orderId)
      .populate('restaurant', 'name');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.customer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review this order'
      });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Can only review delivered orders'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this order'
      });
    }

    // Create review
    const review = new Review({
      customer: userId,
      restaurant: order.restaurant._id,
      order: orderId,
      rating,
      comment,
      foodRating,
      deliveryRating,
      serviceRating,
      images: images || [],
      isVerified: true // Verified since it's from a real order
    });

    await review.save();

    // Analyze sentiment using AI
    await AIService.analyzeReviewSentiment(review._id);

    // Update restaurant rating
    await updateRestaurantRating(order.restaurant._id);

    // Update user AI profile
    await updateUserReviewHistory(userId, review);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });

  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
};

// Get restaurant reviews
const getRestaurantReviews = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10, rating, sortBy = 'newest' } = req.query;

    let query = { restaurant: restaurantId, isVerified: true };

    // Rating filter
    if (rating) {
      query.rating = { $gte: parseInt(rating) };
    }

    let sortOptions = {};
    switch (sortBy) {
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'highest_rating':
        sortOptions = { rating: -1 };
        break;
      case 'lowest_rating':
        sortOptions = { rating: 1 };
        break;
      case 'most_helpful':
        sortOptions = { 'helpful.count': -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    const reviews = await Review.find(query)
      .populate('customer', 'name avatar')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { restaurant: restaurantId, isVerified: true } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        ratingDistribution,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching restaurant reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// Get user reviews
const getUserReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const reviews = await Review.find({ customer: userId })
      .populate('restaurant', 'name cuisine images')
      .populate('order', 'orderNumber total')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ customer: userId });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user reviews',
      error: error.message
    });
  }
};

// Update review
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    const updatedReview = await Review.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    // Re-analyze sentiment
    await AIService.analyzeReviewSentiment(id);

    // Update restaurant rating
    await updateRestaurantRating(review.restaurant);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });

  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

// Delete review
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await Review.findByIdAndDelete(id);

    // Update restaurant rating
    await updateRestaurantRating(review.restaurant);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

// Mark review as helpful
const markHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already marked as helpful
    if (review.helpful.users.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Review already marked as helpful'
      });
    }

    review.helpful.users.push(userId);
    review.helpful.count += 1;
    await review.save();

    res.json({
      success: true,
      message: 'Review marked as helpful',
      data: { helpfulCount: review.helpful.count }
    });

  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking review as helpful',
      error: error.message
    });
  }
};

// Get review analytics for restaurant
const getReviewAnalytics = async (req, res) => {
  try {
    const { restaurantId } = req.params;

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
        message: 'Not authorized to view review analytics'
      });
    }

    const reviews = await Review.find({ restaurant: restaurantId, isVerified: true });

    // Calculate analytics
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    // Rating distribution
    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = reviews.filter(r => r.rating === i).length;
    }

    // Sentiment analysis
    const sentimentDistribution = {
      positive: reviews.filter(r => r.aiAnalysis?.sentiment === 'positive').length,
      negative: reviews.filter(r => r.aiAnalysis?.sentiment === 'negative').length,
      neutral: reviews.filter(r => r.aiAnalysis?.sentiment === 'neutral').length
    };

    // Key topics
    const allTopics = reviews
      .flatMap(r => r.aiAnalysis?.keyTopics || [])
      .reduce((acc, topic) => {
        acc[topic] = (acc[topic] || 0) + 1;
        return acc;
      }, {});

    const topTopics = Object.entries(allTopics)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));

    // Recent trends
    const recentReviews = reviews
      .filter(r => r.createdAt >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .length;

    res.json({
      success: true,
      data: {
        overview: {
          totalReviews,
          avgRating,
          recentReviews
        },
        ratingDistribution,
        sentimentDistribution,
        topTopics
      }
    });

  } catch (error) {
    console.error('Error fetching review analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review analytics',
      error: error.message
    });
  }
};

// Helper function to update restaurant rating
async function updateRestaurantRating(restaurantId) {
  try {
    const reviews = await Review.find({ 
      restaurant: restaurantId, 
      isVerified: true 
    });

    if (reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    await Restaurant.findByIdAndUpdate(restaurantId, {
      'rating.average': Math.round(avgRating * 10) / 10,
      'rating.count': reviews.length
    });
  } catch (error) {
    console.error('Error updating restaurant rating:', error);
  }
}

// Helper function to update user review history
async function updateUserReviewHistory(userId, review) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Update order history with rating
    const orderHistory = user.aiProfile.orderHistory;
    const orderIndex = orderHistory.findIndex(
      h => h.restaurant.toString() === review.restaurant.toString()
    );

    if (orderIndex !== -1) {
      orderHistory[orderIndex].rating = review.rating;
      await user.save();
    }
  } catch (error) {
    console.error('Error updating user review history:', error);
  }
}

module.exports = {
  createReview,
  getRestaurantReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  markHelpful,
  getReviewAnalytics
};
