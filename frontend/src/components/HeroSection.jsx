import React from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Clock, Star } from 'lucide-react';

const HeroSection = ({ searchQuery, setSearchQuery, onSearch, location }) => {
  const heroVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-700/90"></div>
      
      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          className="text-center"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main Heading */}
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-6"
            variants={itemVariants}
          >
            Delicious Food
            <br />
            <span className="text-yellow-400">Delivered Fast</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto"
            variants={itemVariants}
          >
            Order from your favorite restaurants and get your food delivered in minutes.
            AI-powered recommendations help you discover new flavors.
          </motion.p>

          {/* Search Form */}
          <motion.form
            onSubmit={onSearch}
            className="max-w-2xl mx-auto mb-8"
            variants={itemVariants}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search for restaurants, cuisines, or dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-yellow-400/50"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-2 rounded-full font-semibold transition-colors"
              >
                Search
              </button>
            </div>
          </motion.form>

          {/* Features */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            variants={itemVariants}
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-yellow-400/20 p-4 rounded-full mb-4">
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-blue-100">
                Get your food delivered in 30 minutes or less
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="bg-yellow-400/20 p-4 rounded-full mb-4">
                <Star className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Recommendations</h3>
              <p className="text-blue-100">
                Discover new favorites with our smart recommendations
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="bg-yellow-400/20 p-4 rounded-full mb-4">
                <MapPin className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Location Based</h3>
              <p className="text-blue-100">
                Find the best restaurants near you
              </p>
            </div>
          </motion.div>

          {/* Location Status */}
          {location && (
            <motion.div
              className="mt-8 flex items-center justify-center text-blue-200"
              variants={itemVariants}
            >
              <MapPin className="h-5 w-5 mr-2" />
              <span>
                Location detected: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400/20 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-yellow-400/20 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-yellow-400/20 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-yellow-400/20 rounded-full animate-pulse delay-500"></div>
      </div>
    </div>
  );
};

export default HeroSection;
