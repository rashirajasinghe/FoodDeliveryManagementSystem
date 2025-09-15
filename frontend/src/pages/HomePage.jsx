import React, { useEffect, useState } from 'react';
import { useFoodDelivery } from '../contexts/FoodDeliveryContext';
import RestaurantCard from '../components/RestaurantCard';
import SearchFilters from '../components/SearchFilters';
import HeroSection from '../components/HeroSection';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';

const HomePage = () => {
  const {
    restaurants,
    loading,
    filters,
    setFilters,
    getRestaurants,
    location
  } = useFoodDelivery();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getRestaurants();
  }, [filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ search: searchQuery });
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        location={location}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <SearchFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          location={location}
        />

        {/* Restaurants Grid */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {restaurants.length} Restaurants Available
            </h2>
            <div className="text-sm text-gray-500">
              {location ? `Near ${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}` : 'Location not available'}
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {restaurants.map((restaurant) => (
                <motion.div key={restaurant._id} variants={itemVariants}>
                  <RestaurantCard restaurant={restaurant} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {!loading && restaurants.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No restaurants found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
