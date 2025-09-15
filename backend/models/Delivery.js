const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'],
    default: 'assigned'
  },
  pickupTime: {
    type: Date
  },
  deliveryTime: {
    type: Date
  },
  estimatedDeliveryTime: {
    type: Date,
    required: true
  },
  actualDeliveryTime: {
    type: Date
  },
  route: [{
    latitude: Number,
    longitude: Number,
    timestamp: Date,
    status: String
  }],
  distance: {
    type: Number, // in kilometers
    default: 0
  },
  deliveryFee: {
    type: Number,
    required: true
  },
  driverEarnings: {
    type: Number,
    required: true
  },
  customerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  customerFeedback: String,
  aiOptimization: {
    optimalRoute: [{
      latitude: Number,
      longitude: Number,
      estimatedTime: Number
    }],
    trafficConditions: String,
    weatherImpact: String,
    fuelEfficiency: Number
  }
}, {
  timestamps: true
});

// Index for efficient queries
deliverySchema.index({ driver: 1, status: 1 });
deliverySchema.index({ order: 1 });
deliverySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Delivery', deliverySchema);
