import React, { useEffect, useState } from 'react';
import { useFoodDelivery } from '../contexts/FoodDeliveryContext';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Star, 
  Clock,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

const RestaurantDashboard = () => {
  const { user, restaurants, getRestaurants, createRestaurant } = useFoodDelivery();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (user?.userType === 'restaurant_owner') {
      getRestaurants();
    }
  }, [user]);

  const mockAnalytics = {
    totalOrders: 1247,
    totalRevenue: 45678.90,
    avgOrderValue: 36.65,
    customerRating: 4.6,
    popularItems: [
      { name: 'Margherita Pizza', orders: 234, revenue: 4680 },
      { name: 'Chicken Burger', orders: 189, revenue: 3780 },
      { name: 'Caesar Salad', orders: 156, revenue: 2340 }
    ],
    recentOrders: [
      { id: 'ORD-001', customer: 'John Doe', total: 24.99, status: 'delivered' },
      { id: 'ORD-002', customer: 'Jane Smith', total: 18.50, status: 'preparing' },
      { id: 'ORD-003', customer: 'Mike Johnson', total: 32.75, status: 'out_for_delivery' }
    ]
  };

  const handleCreateRestaurant = async (restaurantData) => {
    try {
      await createRestaurant(restaurantData);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating restaurant:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'preparing': return 'text-yellow-600 bg-yellow-100';
      case 'out_for_delivery': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Restaurant Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your restaurants, view analytics, and track performance
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{mockAnalytics.totalOrders}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${mockAnalytics.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">${mockAnalytics.avgOrderValue}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer Rating</p>
                <p className="text-2xl font-bold text-gray-900">{mockAnalytics.customerRating}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Popular Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Items</h3>
            <div className="space-y-4">
              {mockAnalytics.popularItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.orders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${item.revenue}</p>
                    <p className="text-sm text-gray-600">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
            <div className="space-y-3">
              {mockAnalytics.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{order.id}</p>
                    <p className="text-sm text-gray-600">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${order.total}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Restaurants List */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Your Restaurants</h3>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add Restaurant</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {restaurants.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No restaurants yet</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first restaurant</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Restaurant
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant) => (
                  <motion.div
                    key={restaurant._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{restaurant.name}</h4>
                        <p className="text-sm text-gray-600">{restaurant.cuisine}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">
                          {restaurant.rating?.average?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {restaurant.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{restaurant.estimatedDeliveryTime || 30} min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{restaurant.deliveryFee === 0 ? 'Free' : `$${restaurant.deliveryFee}`}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
