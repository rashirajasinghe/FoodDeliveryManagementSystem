const express = require('express');
const passport = require('passport');
const router = express.Router();
const { 
  getCurrentUser, 
  updateProfile, 
  getRecommendations, 
  getUserAnalytics, 
  logout, 
  googleCallback 
} = require('../controllers/authController');
const { isAuthenticated } = require('../middlewares/auth');

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  googleCallback
);

// Get current user
router.get('/me', isAuthenticated, getCurrentUser);

// Update user profile
router.put('/profile', isAuthenticated, updateProfile);

// Get AI recommendations
router.get('/recommendations', isAuthenticated, getRecommendations);

// Get user analytics
router.get('/analytics', isAuthenticated, getUserAnalytics);

// Logout
router.post('/logout', logout);

module.exports = router;
