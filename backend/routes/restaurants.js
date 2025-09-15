const express = require('express');
const router = express.Router();
const {
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantAnalytics
} = require('../controllers/restaurantController');
const { authenticate } = require('../middlewares/auth');

// Public routes
router.get('/', getRestaurants);
router.get('/:id', getRestaurant);

// Protected routes
router.post('/', authenticate, createRestaurant);
router.put('/:id', authenticate, updateRestaurant);
router.delete('/:id', authenticate, deleteRestaurant);
router.get('/:id/analytics', authenticate, getRestaurantAnalytics);

module.exports = router;
