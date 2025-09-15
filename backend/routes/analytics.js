const express = require('express');
const router = express.Router();
const {
  getDashboardAnalytics,
  getRestaurantAnalytics
} = require('../controllers/analyticsController');
const { authenticate } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Dashboard analytics
router.get('/dashboard', getDashboardAnalytics);

// Restaurant-specific analytics
router.get('/restaurant/:restaurantId', getRestaurantAnalytics);

module.exports = router;
