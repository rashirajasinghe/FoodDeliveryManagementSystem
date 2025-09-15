const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  // Create payment intent
  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Confirm payment intent
  async confirmPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          paymentIntent
        };
      } else {
        return {
          success: false,
          error: 'Payment not completed'
        };
      }
    } catch (error) {
      console.error('Error confirming payment intent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create customer
  async createCustomer(email, name, phone = null) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        phone
      });

      return {
        success: true,
        customerId: customer.id
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create payment method
  async createPaymentMethod(type, card) {
    try {
      const paymentMethod = await stripe.paymentMethods.create({
        type,
        card
      });

      return {
        success: true,
        paymentMethodId: paymentMethod.id
      };
    } catch (error) {
      console.error('Error creating payment method:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Attach payment method to customer
  async attachPaymentMethod(paymentMethodId, customerId) {
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      return {
        success: true
      };
    } catch (error) {
      console.error('Error attaching payment method:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create setup intent for saving payment methods
  async createSetupIntent(customerId) {
    try {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });

      return {
        success: true,
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id
      };
    } catch (error) {
      console.error('Error creating setup intent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get customer payment methods
  async getCustomerPaymentMethods(customerId) {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return {
        success: true,
        paymentMethods: paymentMethods.data
      };
    } catch (error) {
      console.error('Error getting payment methods:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process refund
  async processRefund(paymentIntentId, amount = null, reason = 'requested_by_customer') {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create webhook endpoint handler
  handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        this.handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        this.handlePaymentFailed(event.data.object);
        break;
      case 'payment_method.attached':
        this.handlePaymentMethodAttached(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }

  // Handle successful payment
  async handlePaymentSucceeded(paymentIntent) {
    try {
      const orderId = paymentIntent.metadata.orderId;
      if (orderId) {
        // Update order payment status
        const Order = require('../models/Order');
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: 'paid',
          paymentIntentId: paymentIntent.id
        });

        console.log(`Payment succeeded for order ${orderId}`);
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }

  // Handle failed payment
  async handlePaymentFailed(paymentIntent) {
    try {
      const orderId = paymentIntent.metadata.orderId;
      if (orderId) {
        // Update order payment status
        const Order = require('../models/Order');
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: 'failed',
          paymentIntentId: paymentIntent.id
        });

        console.log(`Payment failed for order ${orderId}`);
      }
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  // Handle payment method attached
  async handlePaymentMethodAttached(paymentMethod) {
    try {
      console.log(`Payment method ${paymentMethod.id} attached to customer ${paymentMethod.customer}`);
    } catch (error) {
      console.error('Error handling payment method attachment:', error);
    }
  }

  // Calculate processing fees
  calculateProcessingFee(amount) {
    // Stripe charges 2.9% + 30¢ per transaction
    const percentage = 0.029;
    const fixed = 0.30;
    return (amount * percentage) + fixed;
  }

  // Get payment methods for frontend
  formatPaymentMethods(paymentMethods) {
    return paymentMethods.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year
      }
    }));
  }
}

module.exports = PaymentService;
