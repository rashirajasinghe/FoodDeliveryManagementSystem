import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const FoodDeliveryContext = createContext();

const initialState = {
  user: null,
  cart: [],
  restaurants: [],
  currentRestaurant: null,
  menuItems: [],
  orders: [],
  reviews: [],
  recommendations: [],
  loading: false,
  error: null,
  location: null,
  filters: {
    cuisine: '',
    minRating: 0,
    maxDeliveryFee: 100,
    isOpen: false,
    search: '',
    sortBy: 'popularity'
  }
};

const foodDeliveryReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_USER':
      return { ...state, user: action.payload };
    
    case 'SET_RESTAURANTS':
      return { ...state, restaurants: action.payload, loading: false };
    
    case 'SET_CURRENT_RESTAURANT':
      return { ...state, currentRestaurant: action.payload };
    
    case 'SET_MENU_ITEMS':
      return { ...state, menuItems: action.payload, loading: false };
    
    case 'SET_ORDERS':
      return { ...state, orders: action.payload, loading: false };
    
    case 'SET_REVIEWS':
      return { ...state, reviews: action.payload, loading: false };
    
    case 'SET_RECOMMENDATIONS':
      return { ...state, recommendations: action.payload };
    
    case 'SET_LOCATION':
      return { ...state, location: action.payload };
    
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    case 'ADD_TO_CART':
      const existingItem = state.cart.find(item => 
        item.menuItem._id === action.payload.menuItem._id &&
        JSON.stringify(item.variants) === JSON.stringify(action.payload.variants) &&
        JSON.stringify(item.addons) === JSON.stringify(action.payload.addons)
      );
      
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item._id === existingItem._id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      } else {
        return {
          ...state,
          cart: [...state.cart, { ...action.payload, _id: Date.now() }]
        };
      }
    
    case 'UPDATE_CART_ITEM':
      return {
        ...state,
        cart: state.cart.map(item =>
          item._id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item._id !== action.payload)
      };
    
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

export const FoodDeliveryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(foodDeliveryReducer, initialState);

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Create axios instance
  const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
  });

  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      return config;
    },
    (error) => {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return Promise.reject(error);
    }
  );

  // Response interceptor
  api.interceptors.response.use(
    (response) => {
      dispatch({ type: 'SET_LOADING', payload: false });
      return response;
    },
    (error) => {
      dispatch({ type: 'SET_LOADING', payload: false });
      const message = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      return Promise.reject(error);
    }
  );

  // Get current user
  const getCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      dispatch({ type: 'SET_USER', payload: response.data });
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  };

  // Get restaurants
  const getRestaurants = async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries({ ...state.filters, ...filters }).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, value);
        }
      });
      
      const response = await api.get(`/restaurants?${params}`);
      dispatch({ type: 'SET_RESTAURANTS', payload: response.data.data });
      return response.data;
    } catch (error) {
      console.error('Error getting restaurants:', error);
      throw error;
    }
  };

  // Get single restaurant
  const getRestaurant = async (id) => {
    try {
      const response = await api.get(`/restaurants/${id}`);
      dispatch({ type: 'SET_CURRENT_RESTAURANT', payload: response.data.data.restaurant });
      dispatch({ type: 'SET_MENU_ITEMS', payload: response.data.data.menuItems });
      dispatch({ type: 'SET_REVIEWS', payload: response.data.data.reviews });
      return response.data;
    } catch (error) {
      console.error('Error getting restaurant:', error);
      throw error;
    }
  };

  // Get menu items
  const getMenuItems = async (restaurantId, filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, value);
        }
      });
      
      const response = await api.get(`/menu/restaurant/${restaurantId}?${params}`);
      dispatch({ type: 'SET_MENU_ITEMS', payload: response.data.data });
      return response.data;
    } catch (error) {
      console.error('Error getting menu items:', error);
      throw error;
    }
  };

  // Get recommendations
  const getRecommendations = async (restaurantId) => {
    try {
      const response = await api.get(`/menu/restaurant/${restaurantId}/recommendations?userId=${state.user?.id}`);
      dispatch({ type: 'SET_RECOMMENDATIONS', payload: response.data.data });
      return response.data;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  };

  // Create order
  const createOrder = async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      dispatch({ type: 'CLEAR_CART' });
      toast.success('Order placed successfully!');
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  // Get user orders
  const getUserOrders = async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, value);
        }
      });
      
      const response = await api.get(`/orders/my-orders?${params}`);
      dispatch({ type: 'SET_ORDERS', payload: response.data.data });
      return response.data;
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }
  };

  // Get single order
  const getOrder = async (id) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  };

  // Cancel order
  const cancelOrder = async (id, reason) => {
    try {
      const response = await api.put(`/orders/${id}/cancel`, { reason });
      toast.success('Order cancelled successfully');
      return response.data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  };

  // Create review
  const createReview = async (reviewData) => {
    try {
      const response = await api.post('/reviews', reviewData);
      toast.success('Review submitted successfully');
      return response.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  };

  // Get restaurant reviews
  const getRestaurantReviews = async (restaurantId, filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, value);
        }
      });
      
      const response = await api.get(`/reviews/restaurant/${restaurantId}?${params}`);
      dispatch({ type: 'SET_REVIEWS', payload: response.data.data.reviews });
      return response.data;
    } catch (error) {
      console.error('Error getting restaurant reviews:', error);
      throw error;
    }
  };

  // Cart actions
  const addToCart = (item) => {
    dispatch({ type: 'ADD_TO_CART', payload: item });
    toast.success('Item added to cart');
  };

  const updateCartItem = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      dispatch({ type: 'UPDATE_CART_ITEM', payload: { id, quantity } });
    }
  };

  const removeFromCart = (id) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
    toast.success('Item removed from cart');
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  // Filter actions
  const setFilters = (filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  // Location actions
  const setLocation = (location) => {
    dispatch({ type: 'SET_LOCATION', payload: location });
  };

  // Get user location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location');
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
    }
  };

  // Calculate cart total
  const getCartTotal = () => {
    return state.cart.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      const variantsTotal = item.variants?.reduce((sum, variant) => sum + variant.price, 0) || 0;
      const addonsTotal = item.addons?.reduce((sum, addon) => sum + addon.price, 0) || 0;
      return total + (itemTotal + variantsTotal + addonsTotal) * item.quantity;
    }, 0);
  };

  // Get cart item count
  const getCartItemCount = () => {
    return state.cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Initialize app
  useEffect(() => {
    getCurrentUser();
    getUserLocation();
  }, []);

  const value = {
    ...state,
    api,
    getCurrentUser,
    getRestaurants,
    getRestaurant,
    getMenuItems,
    getRecommendations,
    createOrder,
    getUserOrders,
    getOrder,
    cancelOrder,
    createReview,
    getRestaurantReviews,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    setFilters,
    setLocation,
    getUserLocation,
    getCartTotal,
    getCartItemCount,
    clearError
  };

  return (
    <FoodDeliveryContext.Provider value={value}>
      {children}
    </FoodDeliveryContext.Provider>
  );
};

export const useFoodDelivery = () => {
  const context = useContext(FoodDeliveryContext);
  if (!context) {
    throw new Error('useFoodDelivery must be used within a FoodDeliveryProvider');
  }
  return context;
};
