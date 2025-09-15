const express = require('express');
const router = express.Router();
const {
  getDriverOrders,
  getDriverCompletedOrders,
  getDriverEarnings,
  updateDriverStatus,
  updateDriverLocation,
  updateDeliveryStatus,
  getNearbyOrders,
  acceptOrder
} = require('../controllers/driverController');
const { authenticate } = require('../middlewares/auth');

// All routes require authentication and driver role
router.use(authenticate);

// Driver orders
router.get('/orders', getDriverOrders);
router.get('/completed-orders', getDriverCompletedOrders);
router.get('/earnings', getDriverEarnings);

// Driver status and location
router.put('/toggle-status', updateDriverStatus);
router.put('/location', updateDriverLocation);

// Delivery management
router.put('/delivery-status', updateDeliveryStatus);
router.get('/nearby-orders', getNearbyOrders);
router.post('/accept-order', acceptOrder);

module.exports = router;
