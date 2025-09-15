const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  createCustomer,
  getPaymentMethods,
  createSetupIntent,
  processRefund,
  getPaymentStatus,
  handleWebhook
} = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/auth');

// Webhook endpoint (no auth required)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.post('/create-payment-intent', authenticate, createPaymentIntent);
router.post('/confirm-payment', authenticate, confirmPayment);
router.post('/create-customer', authenticate, createCustomer);
router.get('/payment-methods', authenticate, getPaymentMethods);
router.post('/create-setup-intent', authenticate, createSetupIntent);
router.post('/refund', authenticate, processRefund);
router.get('/status/:orderId', authenticate, getPaymentStatus);

module.exports = router;
