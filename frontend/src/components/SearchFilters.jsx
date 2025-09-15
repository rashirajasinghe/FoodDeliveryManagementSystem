import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MapPin, Star, DollarSign } from 'lucide-react';

const SearchFilters = ({ filters, onFilterChange, location }) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const cuisines = [
    'Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'Thai', 'American', 'Mediterranean', 'Korean', 'Vietnamese'
  ];

  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      cuisine: '',
      minRating: 0,
      maxDeliveryFee: 100,
      isOpen: false,
      search: '',
      sortBy: 'popularity'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Search Bar */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search restaurants, cuisines, or dishes..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="h-5 w-5" />
          <span>Filters</span>
        </button>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handleFilterChange('isOpen', !filters.isOpen)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filters.isOpen
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}
        >
          <Clock className="h-4 w-4 inline mr-1" />
          Open Now
        </button>

        <button
          onClick={() => handleFilterChange('maxDeliveryFee', filters.maxDeliveryFee === 0 ? 100 : 0)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filters.maxDeliveryFee === 0
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}
        >
          <DollarSign className="h-4 w-4 inline mr-1" />
          Free Delivery
        </button>

        <button
          onClick={() => handleFilterChange('minRating', filters.minRating === 4 ? 0 : 4)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filters.minRating === 4
              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}
        >
          <Star className="h-4 w-4 inline mr-1" />
          4+ Stars
        </button>
      </div>

      {/* Advanced Filters */}
      <motion.div
        initial={false}
        animate={{ height: showAdvancedFilters ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cuisine Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cuisine
              </label>
              <select
                value={filters.cuisine}
                onChange={(e) => handleFilterChange('cuisine', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Cuisines</option>
                {cuisines.map((cuisine) => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Rating
              </label>
              <select
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Any Rating</option>
                <option value={3}>3+ Stars</option>
                <option value={4}>4+ Stars</option>
                <option value={4.5}>4.5+ Stars</option>
              </select>
            </div>

            {/* Delivery Fee Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Delivery Fee
              </label>
              <select
                value={filters.maxDeliveryFee}
                onChange={(e) => handleFilterChange('maxDeliveryFee', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={100}>Any Fee</option>
                <option value={0}>Free Only</option>
                <option value={2}>Under $2</option>
                <option value={5}>Under $5</option>
                <option value={10}>Under $10</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="popularity">Popularity</option>
                <option value="rating">Rating</option>
                <option value="delivery_time">Delivery Time</option>
                <option value="delivery_fee">Delivery Fee</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </motion.div>

      {/* Location Info */}
      {location && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span>
              Showing restaurants near {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
