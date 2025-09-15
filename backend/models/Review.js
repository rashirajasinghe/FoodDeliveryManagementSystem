const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  foodRating: {
    type: Number,
    min: 1,
    max: 5
  },
  deliveryRating: {
    type: Number,
    min: 1,
    max: 5
  },
  serviceRating: {
    type: Number,
    min: 1,
    max: 5
  },
  images: [{
    url: String,
    alt: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  helpful: {
    count: { type: Number, default: 0 },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  aiAnalysis: {
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral']
    },
    sentimentScore: Number,
    keyTopics: [String],
    isSpam: { type: Boolean, default: false },
    responseSuggestion: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
reviewSchema.index({ restaurant: 1, rating: -1 });
reviewSchema.index({ customer: 1, createdAt: -1 });
reviewSchema.index({ isVerified: 1 });

// Ensure one review per order
reviewSchema.index({ order: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
