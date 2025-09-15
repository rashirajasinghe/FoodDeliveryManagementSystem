const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getRestaurantOrders,
  getOrderAnalytics
} = require('../controllers/orderController');
const { authenticate } = require('../middlewares/auth');

// Protected routes
router.post('/', authenticate, createOrder);
router.get('/my-orders', authenticate, getUserOrders);
router.get('/restaurant/:restaurantId', authenticate, getRestaurantOrders);
router.get('/restaurant/:restaurantId/analytics', authenticate, getOrderAnalytics);
router.get('/:id', authenticate, getOrder);
router.put('/:id/status', authenticate, updateOrderStatus);
router.put('/:id/cancel', authenticate, cancelOrder);

module.exports = router;
