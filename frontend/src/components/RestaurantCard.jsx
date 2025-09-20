import React from 'react';
import { Star, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const RestaurantCard = ({ restaurant }) => {
  return (
    <motion.div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 flex items-center">
          <Star className="h-4 w-4 text-yellow-400 fill-current" />
          <span className="ml-1 text-sm font-semibold">{restaurant.rating}</span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{restaurant.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{restaurant.description}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{restaurant.deliveryTime}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="truncate max-w-24">{restaurant.address}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">{restaurant.priceRange}</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {restaurant.category}
          </span>
        </div>
        
        <button className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
          View Menu
        </button>
      </div>
    </motion.div>
  );
};

export default RestaurantCard;