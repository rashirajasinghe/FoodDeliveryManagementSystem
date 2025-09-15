import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFoodDelivery } from '../contexts/FoodDeliveryContext';
import MenuItemCard from '../components/MenuItemCard';
import RestaurantInfo from '../components/RestaurantInfo';
import ReviewSection from '../components/ReviewSection';
import CartSidebar from '../components/CartSidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Clock, MapPin, Phone } from 'lucide-react';

const RestaurantPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentRestaurant,
    menuItems,
    reviews,
    recommendations,
    loading,
    getRestaurant,
    getRecommendations,
    getRestaurantReviews,
    cart,
    getCartItemCount
  } = useFoodDelivery();

  const [activeCategory, setActiveCategory] = useState('all');
  const [showCart, setShowCart] = useState(false);
  const [sortBy, setSortBy] = useState('popularity');

  useEffect(() => {
    if (id) {
      getRestaurant(id);
      getRecommendations(id);
      getRestaurantReviews(id);
    }
  }, [id]);

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];

  const filteredMenuItems = menuItems.filter(item => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const sortedMenuItems = [...filteredMenuItems].sort((a, b) => {
    switch (sortBy) {
      case 'price_low':
        return a.price - b.price;
      case 'price_high':
        return b.price - a.price;
      case 'rating':
        return (b.rating?.average || 0) - (a.rating?.average || 0);
      case 'popularity':
      default:
        return (b.aiData?.popularityScore || 0) - (a.aiData?.popularityScore || 0);
    }
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentRestaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Restaurant not found</h2>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Restaurants
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getCartItemCount()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Restaurant Info */}
          <div className="lg:col-span-1">
            <RestaurantInfo restaurant={currentRestaurant} />
          </div>

          {/* Menu Section */}
          <div className="lg:col-span-2">
            {/* Category Tabs */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      activeCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category === 'all' ? 'All Items' : category.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Sort Options */}
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="popularity">Popularity</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
            </div>

            {/* Menu Items */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {sortedMenuItems.map((item) => (
                <MenuItemCard key={item._id} item={item} />
              ))}
            </motion.div>

            {sortedMenuItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-500">Try selecting a different category</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <ReviewSection restaurantId={id} reviews={reviews} />
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={showCart} onClose={() => setShowCart(false)} />
    </div>
  );
};

export default RestaurantPage;
