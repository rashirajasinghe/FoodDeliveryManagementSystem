import React from 'react';
import { Filter, X } from 'lucide-react';

const SearchFilters = ({ filters, onFilterChange, location }) => {
  const categories = ['All', 'Italian', 'American', 'Japanese', 'Mexican', 'Chinese', 'Indian'];
  const priceRanges = ['All', '$', '$$', '$$$', '$$$$'];
  const deliveryTimes = ['All', '15-20 min', '20-25 min', '25-30 min', '30+ min'];

  const handleFilterChange = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      category: '',
      rating: 0,
      priceRange: '',
      deliveryTime: ''
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </h3>
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
        >
          <X className="h-4 w-4 mr-1" />
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {categories.map(category => (
              <option key={category} value={category === 'All' ? '' : category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range
          </label>
          <select
            value={filters.priceRange}
            onChange={(e) => handleFilterChange('priceRange', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {priceRanges.map(range => (
              <option key={range} value={range === 'All' ? '' : range}>
                {range}
              </option>
            ))}
          </select>
        </div>

        {/* Delivery Time Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Time
          </label>
          <select
            value={filters.deliveryTime}
            onChange={(e) => handleFilterChange('deliveryTime', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {deliveryTimes.map(time => (
              <option key={time} value={time === 'All' ? '' : time}>
                {time}
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
            value={filters.rating}
            onChange={(e) => handleFilterChange('rating', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={0}>All Ratings</option>
            <option value={3}>3+ Stars</option>
            <option value={4}>4+ Stars</option>
            <option value={4.5}>4.5+ Stars</option>
          </select>
        </div>
      </div>

      {/* Location Status */}
      {location && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            📍 Location detected: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;