const express = require('express');
const router = express.Router();
const {
  createReview,
  getRestaurantReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  markHelpful,
  getReviewAnalytics
} = require('../controllers/reviewController');
const { authenticate } = require('../middlewares/auth');

// Public routes
router.get('/restaurant/:restaurantId', getRestaurantReviews);

// Protected routes
router.post('/', authenticate, createReview);
router.get('/my-reviews', authenticate, getUserReviews);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);
router.post('/:id/helpful', authenticate, markHelpful);
router.get('/restaurant/:restaurantId/analytics', authenticate, getReviewAnalytics);

module.exports = router;
