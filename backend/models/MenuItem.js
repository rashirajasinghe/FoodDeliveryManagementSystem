const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['appetizer', 'main_course', 'dessert', 'beverage', 'salad', 'soup', 'pizza', 'pasta', 'sandwich', 'burger']
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  images: [{
    url: String,
    alt: String
  }],
  ingredients: [String],
  allergens: [{
    type: String,
    enum: ['nuts', 'dairy', 'gluten', 'soy', 'eggs', 'shellfish', 'fish', 'sesame']
  }],
  dietaryInfo: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'gluten_free', 'keto', 'low_carb', 'high_protein', 'organic']
  }],
  preparationTime: {
    type: Number,
    default: 15 // in minutes
  },
  calories: {
    type: Number,
    min: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  aiData: {
    popularityScore: { type: Number, default: 0 },
    seasonalTrend: { type: Number, default: 0 },
    priceOptimization: {
      suggestedPrice: Number,
      demandElasticity: Number,
      competitorPrice: Number
    },
    recommendations: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    }]
  },
  variants: [{
    name: String,
    price: Number,
    description: String
  }],
  addons: [{
    name: String,
    price: Number,
    category: String
  }]
}, {
  timestamps: true
});

// Index for search
menuItemSchema.index({ name: "text", description: "text", category: "text" });
menuItemSchema.index({ restaurant: 1, category: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
