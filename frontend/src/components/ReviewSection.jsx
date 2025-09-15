import React, { useState } from 'react';
import { Star, ThumbsUp, Filter } from 'lucide-react';
import { useFoodDelivery } from '../contexts/FoodDeliveryContext';

const ReviewSection = ({ restaurantId, reviews }) => {
  const { createReview, user } = useFoodDelivery();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState(0);

  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
    foodRating: 5,
    deliveryRating: 5,
    serviceRating: 5
  });

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login to submit a review');
      return;
    }

    try {
      await createReview({
        orderId: 'mock-order-id', // In real app, this would come from a completed order
        rating: reviewData.rating,
        comment: reviewData.comment,
        foodRating: reviewData.foodRating,
        deliveryRating: reviewData.deliveryRating,
        serviceRating: reviewData.serviceRating
      });
      
      setReviewData({
        rating: 5,
        comment: '',
        foodRating: 5,
        deliveryRating: 5,
        serviceRating: 5
      });
      setShowReviewForm(false);
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'highest_rating':
        return b.rating - a.rating;
      case 'lowest_rating':
        return a.rating - b.rating;
      case 'most_helpful':
        return (b.helpful?.count || 0) - (a.helpful?.count || 0);
      case 'newest':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  const filteredReviews = filterRating > 0 
    ? sortedReviews.filter(review => review.rating >= filterRating)
    : sortedReviews;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating, size = 'sm') => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Reviews ({reviews.length})
        </h2>
        
        <div className="flex items-center space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest_rating">Highest Rating</option>
            <option value="lowest_rating">Lowest Rating</option>
            <option value="most_helpful">Most Helpful</option>
          </select>

          <select
            value={filterRating}
            onChange={(e) => setFilterRating(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>All Ratings</option>
            <option value={5}>5 Stars</option>
            <option value={4}>4+ Stars</option>
            <option value={3}>3+ Stars</option>
            <option value={2}>2+ Stars</option>
            <option value={1}>1+ Stars</option>
          </select>

          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Write Review
          </button>
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Write a Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= reviewData.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Food Quality
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, foodRating: star })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          star <= reviewData.foodRating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, deliveryRating: star })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          star <= reviewData.deliveryRating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, serviceRating: star })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          star <= reviewData.serviceRating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment
              </label>
              <textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Share your experience..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No reviews found</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review._id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start space-x-3">
                {/* User Avatar */}
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {review.customer?.avatar ? (
                    <img
                      src={review.customer.avatar}
                      alt={review.customer.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-medium">
                      {review.customer?.name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>

                {/* Review Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {review.customer?.name || 'Anonymous'}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-sm">
                          {review.helpful?.count || 0}
                        </span>
                      </button>
                    </div>
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 mb-3">{review.comment}</p>
                  )}

                  {/* Detailed Ratings */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {review.foodRating && (
                      <div className="flex items-center space-x-1">
                        <span>Food:</span>
                        {renderStars(review.foodRating, 'sm')}
                      </div>
                    )}
                    {review.deliveryRating && (
                      <div className="flex items-center space-x-1">
                        <span>Delivery:</span>
                        {renderStars(review.deliveryRating, 'sm')}
                      </div>
                    )}
                    {review.serviceRating && (
                      <div className="flex items-center space-x-1">
                        <span>Service:</span>
                        {renderStars(review.serviceRating, 'sm')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
