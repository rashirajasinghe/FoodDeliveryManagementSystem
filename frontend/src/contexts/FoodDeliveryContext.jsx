import React, { createContext, useContext, useState, useEffect } from 'react';

const FoodDeliveryContext = createContext();

export const useFoodDelivery = () => {
  const context = useContext(FoodDeliveryContext);
  if (!context) {
    throw new Error('useFoodDelivery must be used within a FoodDeliveryProvider');
  }
  return context;
};

export const FoodDeliveryProvider = ({ children }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    rating: 0,
    priceRange: '',
    deliveryTime: ''
  });
  const [location, setLocation] = useState(null);

  // Mock restaurants data
  const mockRestaurants = [
    {
      _id: '1',
      name: 'Pizza Palace',
      description: 'Best pizza in town with fresh ingredients',
      rating: 4.5,
      deliveryTime: '25-30 min',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
      category: 'Italian',
      priceRange: '$$',
      address: '123 Main St, City'
    },
    {
      _id: '2',
      name: 'Burger King',
      description: 'Flame-grilled burgers and crispy fries',
      rating: 4.2,
      deliveryTime: '20-25 min',
      image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
      category: 'American',
      priceRange: '$$',
      address: '456 Oak Ave, City'
    },
    {
      _id: '3',
      name: 'Sushi Master',
      description: 'Fresh sushi and Japanese cuisine',
      rating: 4.8,
      deliveryTime: '30-35 min',
      image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
      category: 'Japanese',
      priceRange: '$$$',
      address: '789 Pine St, City'
    },
    {
      _id: '4',
      name: 'Taco Fiesta',
      description: 'Authentic Mexican tacos and burritos',
      rating: 4.3,
      deliveryTime: '15-20 min',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
      category: 'Mexican',
      priceRange: '$',
      address: '321 Elm St, City'
    }
  ];

  const getRestaurants = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRestaurants(mockRestaurants);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  const value = {
    restaurants,
    loading,
    filters,
    setFilters,
    getRestaurants,
    location
  };

  return (
    <FoodDeliveryContext.Provider value={value}>
      {children}
    </FoodDeliveryContext.Provider>
  );
};