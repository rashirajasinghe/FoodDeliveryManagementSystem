const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const User = require('../models/User');
const Review = require('../models/Review');

class AIService {
  // Recommendation Engine
  static async getRecommendations(userId, limit = 10) {
    try {
      const user = await User.findById(userId).populate('aiProfile.orderHistory.restaurant');
      
      if (!user || !user.aiProfile.orderHistory.length) {
        // Cold start: return popular items
        return await this.getPopularItems(limit);
      }

      const recommendations = [];
      const userPreferences = user.aiProfile.preferences;
      const orderHistory = user.aiProfile.orderHistory;

      // Content-based filtering
      const contentBasedRecs = await this.getContentBasedRecommendations(userPreferences, orderHistory, limit);
      recommendations.push(...contentBasedRecs);

      // Collaborative filtering
      const collaborativeRecs = await this.getCollaborativeRecommendations(userId, orderHistory, limit);
      recommendations.push(...collaborativeRecs);

      // Remove duplicates and return top recommendations
      const uniqueRecs = this.removeDuplicateRecommendations(recommendations);
      return uniqueRecs.slice(0, limit);

    } catch (error) {
      console.error('Error getting recommendations:', error);
      return await this.getPopularItems(limit);
    }
  }

  static async getContentBasedRecommendations(preferences, orderHistory, limit) {
    const recommendations = [];
    
    // Get user's favorite cuisines
    const favoriteCuisines = preferences.cuisineWeights || {};
    const topCuisines = Object.keys(favoriteCuisines)
      .sort((a, b) => favoriteCuisines[b] - favoriteCuisines[a])
      .slice(0, 3);

    // Get items from favorite cuisines
    for (const cuisine of topCuisines) {
      const items = await MenuItem.find({
        'restaurant.cuisine': cuisine,
        isAvailable: true
      })
      .populate('restaurant')
      .limit(limit / topCuisines.length);
      
      recommendations.push(...items);
    }

    return recommendations;
  }

  static async getCollaborativeRecommendations(userId, orderHistory, limit) {
    // Find users with similar preferences
    const similarUsers = await this.findSimilarUsers(userId, orderHistory);
    
    const recommendations = [];
    
    for (const similarUser of similarUsers) {
      const theirOrders = await Order.find({ customer: similarUser._id })
        .populate('items.menuItem')
        .limit(5);
      
      for (const order of theirOrders) {
        for (const item of order.items) {
          if (!orderHistory.some(h => h.items.includes(item.menuItem._id))) {
            recommendations.push(item.menuItem);
          }
        }
      }
    }

    return recommendations.slice(0, limit);
  }

  static async findSimilarUsers(userId, orderHistory) {
    // Simple similarity based on restaurant preferences
    const userRestaurants = orderHistory.map(h => h.restaurant.toString());
    
    const similarUsers = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
          'aiProfile.orderHistory': { $exists: true, $ne: [] }
        }
      },
      {
        $addFields: {
          similarity: {
            $size: {
              $setIntersection: [
                userRestaurants,
                '$aiProfile.orderHistory.restaurant'
              ]
            }
          }
        }
      },
      {
        $match: { similarity: { $gt: 0 } }
      },
      {
        $sort: { similarity: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return similarUsers;
  }

  static async getPopularItems(limit = 10) {
    return await MenuItem.find({ isAvailable: true })
      .sort({ 'aiData.popularityScore': -1, 'rating.average': -1 })
      .populate('restaurant')
      .limit(limit);
  }

  static removeDuplicateRecommendations(recommendations) {
    const seen = new Set();
    return recommendations.filter(item => {
      if (seen.has(item._id.toString())) {
        return false;
      }
      seen.add(item._id.toString());
      return true;
    });
  }

  // Price Optimization
  static async optimizePricing(menuItemId) {
    try {
      const menuItem = await MenuItem.findById(menuItemId).populate('restaurant');
      if (!menuItem) return null;

      const orders = await Order.find({
        'items.menuItem': menuItemId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      });

      const currentPrice = menuItem.price;
      const orderCount = orders.length;
      const totalRevenue = orders.reduce((sum, order) => {
        const item = order.items.find(i => i.menuItem.toString() === menuItemId);
        return sum + (item ? item.price * item.quantity : 0);
      }, 0);

      // Simple price elasticity calculation
      const priceElasticity = this.calculatePriceElasticity(menuItem, orders);
      const suggestedPrice = this.calculateOptimalPrice(currentPrice, priceElasticity, orderCount);

      // Update AI data
      menuItem.aiData.priceOptimization = {
        suggestedPrice,
        demandElasticity: priceElasticity,
        competitorPrice: await this.getCompetitorPrice(menuItem)
      };

      await menuItem.save();
      return suggestedPrice;

    } catch (error) {
      console.error('Error optimizing pricing:', error);
      return null;
    }
  }

  static calculatePriceElasticity(menuItem, orders) {
    // Simplified elasticity calculation
    const basePrice = menuItem.price;
    const baseQuantity = orders.length;
    
    // This is a simplified calculation - in reality, you'd need more sophisticated analysis
    return -0.5; // Default elasticity
  }

  static calculateOptimalPrice(currentPrice, elasticity, quantity) {
    // Simple optimization: if demand is high, increase price slightly
    if (quantity > 50) {
      return currentPrice * 1.05;
    } else if (quantity < 10) {
      return currentPrice * 0.95;
    }
    return currentPrice;
  }

  static async getCompetitorPrice(menuItem) {
    // Find similar items in nearby restaurants
    const competitors = await MenuItem.find({
      category: menuItem.category,
      restaurant: { $ne: menuItem.restaurant },
      isAvailable: true
    }).populate('restaurant');

    if (competitors.length === 0) return menuItem.price;

    const avgPrice = competitors.reduce((sum, item) => sum + item.price, 0) / competitors.length;
    return avgPrice;
  }

  // Demand Forecasting
  static async forecastDemand(restaurantId, days = 7) {
    try {
      const orders = await Order.find({
        restaurant: restaurantId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      const hourlyDemand = this.aggregateHourlyDemand(orders);
      const dailyDemand = this.aggregateDailyDemand(orders);

      // Simple forecasting using moving averages
      const forecast = {
        hourly: this.forecastHourlyDemand(hourlyDemand, days),
        daily: this.forecastDailyDemand(dailyDemand, days)
      };

      // Update restaurant AI data
      await Restaurant.findByIdAndUpdate(restaurantId, {
        'aiRecommendations.demandForecast': forecast
      });

      return forecast;

    } catch (error) {
      console.error('Error forecasting demand:', error);
      return null;
    }
  }

  static aggregateHourlyDemand(orders) {
    const hourlyData = {};
    
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourlyData[hour] = (hourlyData[hour] || 0) + 1;
    });

    return hourlyData;
  }

  static aggregateDailyDemand(orders) {
    const dailyData = {};
    
    orders.forEach(order => {
      const date = new Date(order.createdAt).toDateString();
      dailyData[date] = (dailyData[date] || 0) + 1;
    });

    return dailyData;
  }

  static forecastHourlyDemand(hourlyData, days) {
    const forecast = [];
    const hours = Object.keys(hourlyData).map(Number).sort((a, b) => a - b);
    
    for (let day = 0; day < days; day++) {
      for (const hour of hours) {
        const avgDemand = hourlyData[hour] / 30; // Average over 30 days
        forecast.push({
          hour,
          predictedOrders: Math.round(avgDemand * (1 + Math.random() * 0.2 - 0.1)) // Add some variance
        });
      }
    }

    return forecast;
  }

  static forecastDailyDemand(dailyData, days) {
    const forecast = [];
    const avgDaily = Object.values(dailyData).reduce((sum, count) => sum + count, 0) / Object.keys(dailyData).length;
    
    for (let day = 0; day < days; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      
      forecast.push({
        date,
        predictedOrders: Math.round(avgDaily * (1 + Math.random() * 0.3 - 0.15))
      });
    }

    return forecast;
  }

  // Sentiment Analysis for Reviews
  static async analyzeReviewSentiment(reviewId) {
    try {
      const review = await Review.findById(reviewId);
      if (!review) return null;

      // Simple sentiment analysis based on rating and keywords
      const sentiment = this.analyzeTextSentiment(review.comment || '');
      const sentimentScore = this.calculateSentimentScore(review.rating, sentiment);

      // Update review with AI analysis
      review.aiAnalysis = {
        sentiment: sentimentScore > 0.5 ? 'positive' : sentimentScore < -0.5 ? 'negative' : 'neutral',
        sentimentScore,
        keyTopics: this.extractKeyTopics(review.comment || ''),
        isSpam: this.detectSpam(review.comment || ''),
        responseSuggestion: this.generateResponseSuggestion(sentimentScore, review.comment)
      };

      await review.save();
      return review.aiAnalysis;

    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return null;
    }
  }

  static analyzeTextSentiment(text) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'delicious', 'perfect', 'love', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate', 'worst', 'disappointed'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    return score;
  }

  static calculateSentimentScore(rating, textSentiment) {
    const ratingScore = (rating - 3) / 2; // Convert 1-5 rating to -1 to 1 scale
    const textScore = Math.max(-1, Math.min(1, textSentiment / 10)); // Normalize text sentiment
    
    return (ratingScore + textScore) / 2;
  }

  static extractKeyTopics(text) {
    const topics = ['food', 'delivery', 'service', 'price', 'quality', 'speed', 'staff'];
    const foundTopics = topics.filter(topic => 
      text.toLowerCase().includes(topic)
    );
    return foundTopics;
  }

  static detectSpam(text) {
    // Simple spam detection
    const spamIndicators = ['buy now', 'click here', 'free money', 'urgent'];
    return spamIndicators.some(indicator => 
      text.toLowerCase().includes(indicator)
    );
  }

  static generateResponseSuggestion(sentimentScore, comment) {
    if (sentimentScore > 0.5) {
      return "Thank you for your positive feedback! We're glad you enjoyed your experience.";
    } else if (sentimentScore < -0.5) {
      return "We apologize for the negative experience. Please contact us so we can make this right.";
    } else {
      return "Thank you for your feedback. We appreciate your input and will use it to improve our service.";
    }
  }

  // Route Optimization for Delivery
  static async optimizeDeliveryRoute(deliveryId) {
    try {
      const delivery = await Delivery.findById(deliveryId).populate('order');
      if (!delivery) return null;

      const order = delivery.order;
      const restaurantLocation = await this.getRestaurantLocation(order.restaurant);
      const customerLocation = order.deliveryAddress.coordinates;

      // Simple route optimization (in reality, you'd use Google Maps API or similar)
      const optimalRoute = this.calculateOptimalRoute(restaurantLocation, customerLocation);

      // Update delivery with optimized route
      delivery.aiOptimization = {
        optimalRoute,
        trafficConditions: 'normal',
        weatherImpact: 'none',
        fuelEfficiency: 0.8
      };

      await delivery.save();
      return optimalRoute;

    } catch (error) {
      console.error('Error optimizing route:', error);
      return null;
    }
  }

  static async getRestaurantLocation(restaurantId) {
    const restaurant = await Restaurant.findById(restaurantId);
    return restaurant.address.coordinates;
  }

  static calculateOptimalRoute(start, end) {
    // Simplified route calculation
    return [
      { latitude: start.latitude, longitude: start.longitude, estimatedTime: 0 },
      { latitude: end.latitude, longitude: end.longitude, estimatedTime: 15 }
    ];
  }

  // Customer Churn Prediction
  static async predictChurnRisk(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      const orders = await Order.find({ customer: userId })
        .sort({ createdAt: -1 })
        .limit(10);

      if (orders.length === 0) return { churnRisk: 0.8, reasons: ['No order history'] };

      const lastOrderDate = orders[0].createdAt;
      const daysSinceLastOrder = (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24);
      
      const avgOrderValue = orders.reduce((sum, order) => sum + order.total, 0) / orders.length;
      const orderFrequency = orders.length / 30; // Orders per day

      let churnRisk = 0;
      const reasons = [];

      if (daysSinceLastOrder > 14) {
        churnRisk += 0.3;
        reasons.push('No recent orders');
      }

      if (avgOrderValue < 20) {
        churnRisk += 0.2;
        reasons.push('Low order value');
      }

      if (orderFrequency < 0.1) {
        churnRisk += 0.2;
        reasons.push('Low order frequency');
      }

      // Update user AI profile
      user.aiProfile.churnRisk = churnRisk;
      await user.save();

      return { churnRisk, reasons };

    } catch (error) {
      console.error('Error predicting churn:', error);
      return null;
    }
  }
}

module.exports = AIService;
