import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, MapPin, DollarSign } from 'lucide-react';

const RestaurantCard = ({ restaurant }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/restaurant/${restaurant._id}`);
  };

  const formatRating = (rating) => {
    return rating ? rating.toFixed(1) : 'N/A';
  };

  const formatDeliveryTime = (time) => {
    return `${time || 30} min`;
  };

  const formatDeliveryFee = (fee) => {
    return fee === 0 ? 'Free' : `$${fee.toFixed(2)}`;
  };

  return (
    <motion.div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Restaurant Image */}
      <div className="relative h-48 bg-gray-200">
        {restaurant.images && restaurant.images.length > 0 ? (
          <img
            src={restaurant.images[0].url}
            alt={restaurant.images[0].alt || restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        
        {/* Rating Badge */}
        {restaurant.rating && restaurant.rating.average > 0 && (
          <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full flex items-center space-x-1 text-sm font-medium">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span>{formatRating(restaurant.rating.average)}</span>
          </div>
        )}
      </div>

      {/* Restaurant Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {restaurant.name}
          </h3>
        </div>

        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {restaurant.description}
        </p>

        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">
            {restaurant.cuisine}
          </span>
        </div>

        {/* Restaurant Details */}
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{formatDeliveryTime(restaurant.estimatedDeliveryTime)}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <DollarSign className="h-4 w-4" />
            <span>{formatDeliveryFee(restaurant.deliveryFee)} delivery</span>
          </div>

          {restaurant.minimumOrder > 0 && (
            <div className="text-xs text-gray-500">
              Min. order: ${restaurant.minimumOrder.toFixed(2)}
            </div>
          )}
        </div>

        {/* Features */}
        {restaurant.features && restaurant.features.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {restaurant.features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {feature.replace('_', ' ')}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RestaurantCard;
