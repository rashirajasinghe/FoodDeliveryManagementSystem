const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  avatar: {
    type: String
  },
  phone: {
    type: String
  },
  userType: {
    type: String,
    enum: ['customer', 'restaurant_owner', 'delivery_driver', 'admin'],
    default: 'customer'
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  preferences: {
    cuisine: [String],
    dietaryRestrictions: [String],
    maxDeliveryDistance: { type: Number, default: 10 }, // in km
    notificationSettings: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  // For delivery drivers
  driverInfo: {
    licenseNumber: String,
    vehicleType: {
      type: String,
      enum: ['bike', 'motorcycle', 'car', 'scooter']
    },
    vehicleNumber: String,
    isAvailable: { type: Boolean, default: false },
    currentLocation: {
      latitude: Number,
      longitude: Number,
      lastUpdated: Date
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
    earnings: {
      total: { type: Number, default: 0 },
      thisWeek: { type: Number, default: 0 },
      thisMonth: { type: Number, default: 0 }
    }
  },
  // For restaurant owners
  restaurantInfo: {
    businessLicense: String,
    taxId: String,
    bankAccount: {
      accountNumber: String,
      routingNumber: String
    }
  },
  aiProfile: {
    orderHistory: [{
      restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
      items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
      orderDate: Date,
      rating: Number
    }],
    preferences: {
      priceRange: { min: Number, max: Number },
      cuisineWeights: mongoose.Schema.Types.Mixed,
      timePreferences: [Number], // preferred hours
      dietaryWeights: mongoose.Schema.Types.Mixed
    },
    recommendations: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    }],
    churnRisk: { type: Number, default: 0 },
    lifetimeValue: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for geospatial queries
userSchema.index({ "address.coordinates": "2dsphere" });
userSchema.index({ "driverInfo.currentLocation": "2dsphere" });

module.exports = mongoose.model('User', userSchema);
