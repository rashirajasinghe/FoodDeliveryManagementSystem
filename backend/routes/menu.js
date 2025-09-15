const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getRecommendations,
  optimizePricing,
  getCategories
} = require('../controllers/menuController');
const { authenticate } = require('../middlewares/auth');

// Public routes
router.get('/restaurant/:restaurantId', getMenuItems);
router.get('/restaurant/:restaurantId/categories', getCategories);
router.get('/restaurant/:restaurantId/recommendations', getRecommendations);
router.get('/:id', getMenuItem);

// Protected routes
router.post('/restaurant/:restaurantId', authenticate, createMenuItem);
router.put('/:id', authenticate, updateMenuItem);
router.delete('/:id', authenticate, deleteMenuItem);
router.post('/:id/optimize-pricing', authenticate, optimizePricing);

module.exports = router;
