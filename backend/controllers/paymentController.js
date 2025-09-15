const PaymentService = require('../services/paymentService');
const Order = require('../models/Order');
const User = require('../models/User');

const paymentService = new PaymentService();

// Create payment intent for order
const createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    // Get order details
    const order = await Order.findById(orderId).populate('restaurant');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order
    if (order.customer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this order'
      });
    }

    // Check if order is already paid
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    // Create payment intent
    const result = await paymentService.createPaymentIntent(
      order.total,
      'usd',
      {
        orderId: order._id.toString(),
        userId: userId,
        restaurantId: order.restaurant._id.toString()
      }
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create payment intent',
        error: result.error
      });
    }

    // Update order with payment intent ID
    order.paymentIntentId = result.paymentIntentId;
    await order.save();

    res.json({
      success: true,
      data: {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        amount: order.total
      }
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment intent',
      error: error.message
    });
  }
};

// Confirm payment
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    // Confirm payment intent
    const result = await paymentService.confirmPaymentIntent(paymentIntentId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment confirmation failed',
        error: result.error
      });
    }

    // Update order status
    const order = await Order.findOne({ 
      paymentIntentId,
      customer: userId 
    });

    if (order) {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      await order.save();

      // Send notification
      const io = req.app.get('io');
      if (io) {
        const NotificationService = require('../services/notificationService');
        const notificationService = new NotificationService(io);
        await notificationService.sendOrderStatusUpdate(order._id, 'confirmed');
      }
    }

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: {
        paymentIntent: result.paymentIntent
      }
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming payment',
      error: error.message
    });
  }
};

// Create customer
const createCustomer = async (req, res) => {
  try {
    const { email, name, phone } = req.body;
    const userId = req.user.id;

    // Check if user already has a Stripe customer ID
    const user = await User.findById(userId);
    if (user.stripeCustomerId) {
      return res.json({
        success: true,
        message: 'Customer already exists',
        customerId: user.stripeCustomerId
      });
    }

    // Create Stripe customer
    const result = await paymentService.createCustomer(email, name, phone);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create customer',
        error: result.error
      });
    }

    // Save customer ID to user
    user.stripeCustomerId = result.customerId;
    await user.save();

    res.json({
      success: true,
      message: 'Customer created successfully',
      data: {
        customerId: result.customerId
      }
    });

  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating customer',
      error: error.message
    });
  }
};

// Get customer payment methods
const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user.stripeCustomerId) {
      return res.json({
        success: true,
        data: {
          paymentMethods: []
        }
      });
    }

    const result = await paymentService.getCustomerPaymentMethods(user.stripeCustomerId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to get payment methods',
        error: result.error
      });
    }

    const formattedMethods = paymentService.formatPaymentMethods(result.paymentMethods);

    res.json({
      success: true,
      data: {
        paymentMethods: formattedMethods
      }
    });

  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting payment methods',
      error: error.message
    });
  }
};

// Create setup intent for saving payment methods
const createSetupIntent = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer not found. Please create a customer first.'
      });
    }

    const result = await paymentService.createSetupIntent(user.stripeCustomerId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create setup intent',
        error: result.error
      });
    }

    res.json({
      success: true,
      data: {
        clientSecret: result.clientSecret,
        setupIntentId: result.setupIntentId
      }
    });

  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating setup intent',
      error: error.message
    });
  }
};

// Process refund
const processRefund = async (req, res) => {
  try {
    const { orderId, amount, reason } = req.body;
    const userId = req.user.id;

    // Get order
    const order = await Order.findById(orderId).populate('restaurant');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (order.customer.toString() !== userId && 
        order.restaurant.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process refund for this order'
      });
    }

    if (!order.paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'No payment found for this order'
      });
    }

    // Process refund
    const result = await paymentService.processRefund(
      order.paymentIntentId,
      amount,
      reason
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Refund failed',
        error: result.error
      });
    }

    // Update order status
    order.paymentStatus = 'refunded';
    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: result.refundId,
        amount: result.amount
      }
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund',
      error: error.message
    });
  }
};

// Get payment status
const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.customer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view payment status'
      });
    }

    res.json({
      success: true,
      data: {
        paymentStatus: order.paymentStatus,
        paymentIntentId: order.paymentIntentId,
        total: order.total
      }
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting payment status',
      error: error.message
    });
  }
};

// Stripe webhook handler
const handleWebhook = (req, res) => {
  paymentService.handleWebhook(req, res);
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  createCustomer,
  getPaymentMethods,
  createSetupIntent,
  processRefund,
  getPaymentStatus,
  handleWebhook
};
