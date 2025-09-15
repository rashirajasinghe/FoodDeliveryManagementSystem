const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  cuisine: {
    type: String,
    required: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    }
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    url: String,
    alt: String
  }],
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  minimumOrder: {
    type: Number,
    default: 0
  },
  estimatedDeliveryTime: {
    type: Number,
    default: 30 // in minutes
  },
  operatingHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  features: [{
    type: String,
    enum: ['delivery', 'pickup', 'dine_in', 'fast_delivery', 'organic', 'vegetarian', 'vegan']
  }],
  aiRecommendations: {
    popularItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    trendingScore: { type: Number, default: 0 },
    demandForecast: {
      hourly: [{ hour: Number, predictedOrders: Number }],
      daily: [{ date: Date, predictedOrders: Number }]
    }
  }
}, {
  timestamps: true
});

// Index for geospatial queries
restaurantSchema.index({ "address.coordinates": "2dsphere" });

// Index for search
restaurantSchema.index({ name: "text", description: "text", cuisine: "text" });

module.exports = mongoose.model('Restaurant', restaurantSchema);
