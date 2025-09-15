const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

class ChatbotService {
  constructor() {
    this.intents = {
      'track_order': this.handleTrackOrder.bind(this),
      'find_restaurants': this.handleFindRestaurants.bind(this),
      'payment_help': this.handlePaymentHelp.bind(this),
      'contact_support': this.handleContactSupport.bind(this),
      'order_history': this.handleOrderHistory.bind(this),
      'restaurant_info': this.handleRestaurantInfo.bind(this),
      'delivery_time': this.handleDeliveryTime.bind(this),
      'cancel_order': this.handleCancelOrder.bind(this),
      'refund': this.handleRefund.bind(this),
      'general_help': this.handleGeneralHelp.bind(this)
    };
  }

  async processMessage(message, userId, context = {}) {
    try {
      // Simple intent recognition (in production, use NLP/AI)
      const intent = this.recognizeIntent(message);
      
      if (this.intents[intent]) {
        return await this.intents[intent](message, userId, context);
      } else {
        return this.handleGeneralHelp(message, userId, context);
      }
    } catch (error) {
      console.error('Error processing chatbot message:', error);
      return {
        message: "I'm sorry, I encountered an error. Please try again or contact support.",
        suggestions: ['Contact support', 'Try again']
      };
    }
  }

  recognizeIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('track') || lowerMessage.includes('order status')) {
      return 'track_order';
    }
    if (lowerMessage.includes('restaurant') || lowerMessage.includes('food') || lowerMessage.includes('menu')) {
      return 'find_restaurants';
    }
    if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('card')) {
      return 'payment_help';
    }
    if (lowerMessage.includes('contact') || lowerMessage.includes('human') || lowerMessage.includes('support')) {
      return 'contact_support';
    }
    if (lowerMessage.includes('history') || lowerMessage.includes('past orders')) {
      return 'order_history';
    }
    if (lowerMessage.includes('delivery time') || lowerMessage.includes('when will')) {
      return 'delivery_time';
    }
    if (lowerMessage.includes('cancel') || lowerMessage.includes('refund')) {
      return lowerMessage.includes('refund') ? 'refund' : 'cancel_order';
    }
    
    return 'general_help';
  }

  async handleTrackOrder(message, userId, context) {
    try {
      const orders = await Order.find({
        customer: userId,
        status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] }
      }).populate('restaurant', 'name').sort({ createdAt: -1 });

      if (orders.length === 0) {
        return {
          message: "You don't have any active orders at the moment. Would you like to browse restaurants?",
          suggestions: ['Find restaurants', 'Order history', 'Contact support']
        };
      }

      const latestOrder = orders[0];
      const statusMessages = {
        pending: "Your order has been received and is being processed.",
        confirmed: "Your order has been confirmed by the restaurant.",
        preparing: "Your order is being prepared by the restaurant.",
        ready: "Your order is ready for pickup.",
        out_for_delivery: "Your order is out for delivery and should arrive soon."
      };

      return {
        message: `Your latest order #${latestOrder.orderNumber} from ${latestOrder.restaurant.name} is currently: ${statusMessages[latestOrder.status] || latestOrder.status}`,
        suggestions: ['Track all orders', 'Contact restaurant', 'Order again']
      };
    } catch (error) {
      return {
        message: "I couldn't retrieve your order information. Please try again or contact support.",
        suggestions: ['Contact support', 'Try again']
      };
    }
  }

  async handleFindRestaurants(message, userId, context) {
    try {
      const restaurants = await Restaurant.find({ isOperational: true })
        .select('name cuisine rating address')
        .limit(5)
        .sort({ rating: -1 });

      if (restaurants.length === 0) {
        return {
          message: "I couldn't find any restaurants at the moment. Please try again later.",
          suggestions: ['Contact support', 'Try again']
        };
      }

      const restaurantList = restaurants.map(r => 
        `• ${r.name} (${r.cuisine}) - ⭐ ${r.rating.average}`
      ).join('\n');

      return {
        message: `Here are some popular restaurants near you:\n\n${restaurantList}\n\nWould you like to see more details about any of these?`,
        suggestions: ['Show more restaurants', 'Filter by cuisine', 'Contact support']
      };
    } catch (error) {
      return {
        message: "I couldn't find restaurants at the moment. Please try again later.",
        suggestions: ['Contact support', 'Try again']
      };
    }
  }

  async handlePaymentHelp(message, userId, context) {
    return {
      message: "I can help you with payment issues. Here are some common solutions:\n\n• Check if your card details are correct\n• Ensure you have sufficient funds\n• Try a different payment method\n• Contact your bank if the issue persists\n\nWould you like me to help you with something specific?",
      suggestions: ['Track my order', 'Contact support', 'Try again']
    };
  }

  async handleContactSupport(message, userId, context) {
    return {
      message: "I understand you'd like to speak with a human. Here are your options:\n\n• Call us at (555) 123-4567\n• Email us at support@fooddelivery.com\n• Live chat is available 24/7\n\nIs there anything else I can help you with while you wait?",
      suggestions: ['Track my order', 'Find restaurants', 'Order history']
    };
  }

  async handleOrderHistory(message, userId, context) {
    try {
      const orders = await Order.find({ customer: userId })
        .populate('restaurant', 'name')
        .sort({ createdAt: -1 })
        .limit(5);

      if (orders.length === 0) {
        return {
          message: "You haven't placed any orders yet. Would you like to browse restaurants?",
          suggestions: ['Find restaurants', 'Contact support']
        };
      }

      const orderList = orders.map(order => 
        `• Order #${order.orderNumber} from ${order.restaurant.name} - ${order.status}`
      ).join('\n');

      return {
        message: `Here are your recent orders:\n\n${orderList}\n\nWould you like to track any specific order?`,
        suggestions: ['Track my order', 'Find restaurants', 'Contact support']
      };
    } catch (error) {
      return {
        message: "I couldn't retrieve your order history. Please try again or contact support.",
        suggestions: ['Contact support', 'Try again']
      };
    }
  }

  async handleRestaurantInfo(message, userId, context) {
    return {
      message: "I can help you find information about restaurants. What would you like to know?\n\n• Restaurant hours and location\n• Menu items and prices\n• Ratings and reviews\n• Delivery options",
      suggestions: ['Find restaurants', 'Track my order', 'Contact support']
    };
  }

  async handleDeliveryTime(message, userId, context) {
    try {
      const activeOrder = await Order.findOne({
        customer: userId,
        status: { $in: ['confirmed', 'preparing', 'ready', 'out_for_delivery'] }
      }).populate('restaurant', 'name');

      if (!activeOrder) {
        return {
          message: "You don't have any active orders. Would you like to place a new order?",
          suggestions: ['Find restaurants', 'Order history', 'Contact support']
        };
      }

      const estimatedTime = new Date(activeOrder.estimatedDeliveryTime);
      const now = new Date();
      const timeDiff = Math.ceil((estimatedTime - now) / (1000 * 60)); // minutes

      if (timeDiff <= 0) {
        return {
          message: `Your order from ${activeOrder.restaurant.name} should arrive any moment now!`,
          suggestions: ['Track my order', 'Contact restaurant', 'Order again']
        };
      } else {
        return {
          message: `Your order from ${activeOrder.restaurant.name} is estimated to arrive in ${timeDiff} minutes.`,
          suggestions: ['Track my order', 'Contact restaurant', 'Order again']
        };
      }
    } catch (error) {
      return {
        message: "I couldn't get delivery time information. Please try again or contact support.",
        suggestions: ['Contact support', 'Try again']
      };
    }
  }

  async handleCancelOrder(message, userId, context) {
    try {
      const activeOrder = await Order.findOne({
        customer: userId,
        status: { $in: ['pending', 'confirmed'] }
      }).populate('restaurant', 'name');

      if (!activeOrder) {
        return {
          message: "You don't have any orders that can be cancelled. Only pending or confirmed orders can be cancelled.",
          suggestions: ['Track my order', 'Order history', 'Contact support']
        };
      }

      return {
        message: `I can help you cancel order #${activeOrder.orderNumber} from ${activeOrder.restaurant.name}. Please note that cancellation may not be possible if the order is already being prepared. Would you like me to proceed?`,
        suggestions: ['Yes, cancel order', 'Track my order', 'Contact support']
      };
    } catch (error) {
      return {
        message: "I couldn't process your cancellation request. Please contact support for assistance.",
        suggestions: ['Contact support', 'Try again']
      };
    }
  }

  async handleRefund(message, userId, context) {
    return {
      message: "I can help you with refund requests. Here's what you need to know:\n\n• Refunds are processed within 3-5 business days\n• You can request a refund for cancelled or undelivered orders\n• Refunds will be credited to your original payment method\n\nWould you like me to help you with a specific refund request?",
      suggestions: ['Track my order', 'Contact support', 'Order history']
    };
  }

  async handleGeneralHelp(message, userId, context) {
    return {
      message: "I'm here to help! I can assist you with:\n\n• Tracking your orders\n• Finding restaurants\n• Payment issues\n• Order history\n• Delivery information\n• Cancellations and refunds\n\nWhat would you like help with?",
      suggestions: ['Track my order', 'Find restaurants', 'Contact support', 'Order history']
    };
  }
}

module.exports = ChatbotService;
