const User = require('../models/User');
const passport = require('passport');
const AIService = require('../services/aiService');

// Google OAuth callback
const googleCallback = (req, res) => {
  // Successful authentication, redirect to frontend
  res.redirect(`${process.env.CLIENT_URL}/dashboard`);
};

// Get current user
const getCurrentUser = (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar,
      userType: req.user.userType,
      phone: req.user.phone,
      address: req.user.address,
      preferences: req.user.preferences,
      driverInfo: req.user.driverInfo,
      restaurantInfo: req.user.restaurantInfo
    });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { userType, phone, address, preferences, driverInfo, restaurantInfo } = req.body;
    const userId = req.user.id;

    const updateData = {};
    
    if (userType) updateData.userType = userType;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };
    if (driverInfo) updateData.driverInfo = { ...req.user.driverInfo, ...driverInfo };
    if (restaurantInfo) updateData.restaurantInfo = { ...req.user.restaurantInfo, ...restaurantInfo };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Get AI recommendations for user
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const recommendations = await AIService.getRecommendations(userId, parseInt(limit));

    res.json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting recommendations',
      error: error.message
    });
  }
};

// Get user analytics
const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get churn risk prediction
    const churnPrediction = await AIService.predictChurnRisk(userId);

    // Get order history
    const user = await User.findById(userId).populate('aiProfile.orderHistory.restaurant');
    const orderHistory = user.aiProfile.orderHistory;

    // Calculate analytics
    const totalOrders = orderHistory.length;
    const totalSpent = orderHistory.reduce((sum, order) => sum + (order.total || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Favorite cuisines
    const cuisineCounts = {};
    orderHistory.forEach(order => {
      if (order.restaurant && order.restaurant.cuisine) {
        cuisineCounts[order.restaurant.cuisine] = (cuisineCounts[order.restaurant.cuisine] || 0) + 1;
      }
    });

    const favoriteCuisines = Object.entries(cuisineCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([cuisine, count]) => ({ cuisine, count }));

    res.json({
      success: true,
      data: {
        overview: {
          totalOrders,
          totalSpent,
          avgOrderValue,
          churnRisk: churnPrediction?.churnRisk || 0,
          churnReasons: churnPrediction?.reasons || []
        },
        favoriteCuisines,
        aiProfile: user.aiProfile
      }
    });

  } catch (error) {
    console.error('Error getting user analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user analytics',
      error: error.message
    });
  }
};

// Logout user
const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error during logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
};

// Google OAuth strategy setup
const setupGoogleStrategy = () => {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        return done(null, user);
      }
      
      // Create new user
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        avatar: profile.photos[0].value,
        userType: 'customer' // Default to customer
      });
      
      await user.save();
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
  
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

module.exports = {
  googleCallback,
  getCurrentUser,
  updateProfile,
  getRecommendations,
  getUserAnalytics,
  logout,
  setupGoogleStrategy
};
