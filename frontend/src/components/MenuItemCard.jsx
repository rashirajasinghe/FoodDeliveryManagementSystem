import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Plus, Minus, Heart } from 'lucide-react';
import { useFoodDelivery } from '../contexts/FoodDeliveryContext';

const MenuItemCard = ({ item }) => {
  const { addToCart, cart } = useFoodDelivery();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [isLiked, setIsLiked] = useState(false);

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  const formatRating = (rating) => {
    return rating ? rating.toFixed(1) : 'N/A';
  };

  const calculateTotalPrice = () => {
    const basePrice = item.price;
    const variantsPrice = selectedVariants.reduce((sum, variant) => sum + variant.price, 0);
    const addonsPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    return (basePrice + variantsPrice + addonsPrice) * quantity;
  };

  const handleAddToCart = () => {
    const cartItem = {
      menuItem: item,
      quantity,
      price: item.price,
      variants: selectedVariants,
      addons: selectedAddons,
      specialInstructions: ''
    };

    addToCart(cartItem);
    setQuantity(1);
    setSelectedVariants([]);
    setSelectedAddons([]);
  };

  const handleVariantChange = (variant, isSelected) => {
    if (isSelected) {
      setSelectedVariants([...selectedVariants, variant]);
    } else {
      setSelectedVariants(selectedVariants.filter(v => v.name !== variant.name));
    }
  };

  const handleAddonChange = (addon, isSelected) => {
    if (isSelected) {
      setSelectedAddons([...selectedAddons, addon]);
    } else {
      setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name));
    }
  };

  const isInCart = cart.some(cartItem => 
    cartItem.menuItem._id === item._id &&
    JSON.stringify(cartItem.variants) === JSON.stringify(selectedVariants) &&
    JSON.stringify(cartItem.addons) === JSON.stringify(selectedAddons)
  );

  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex space-x-4">
        {/* Item Image */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
            {item.images && item.images.length > 0 ? (
              <img
                src={item.images[0].url}
                alt={item.images[0].alt || item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {item.name}
              </h3>
              
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {item.description}
              </p>

              {/* Rating and Popularity */}
              <div className="flex items-center space-x-4 mb-2">
                {item.rating && item.rating.average > 0 && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">
                      {formatRating(item.rating.average)} ({item.rating.count})
                    </span>
                  </div>
                )}
                
                {item.isPopular && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                    Popular
                  </span>
                )}
              </div>

              {/* Dietary Info */}
              {item.dietaryInfo && item.dietaryInfo.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.dietaryInfo.map((diet, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      {diet.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}

              {/* Variants */}
              {item.variants && item.variants.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">Options:</p>
                  <div className="space-y-1">
                    {item.variants.map((variant, index) => (
                      <label key={index} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedVariants.some(v => v.name === variant.name)}
                          onChange={(e) => handleVariantChange(variant, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {variant.name} (+${variant.price.toFixed(2)})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Addons */}
              {item.addons && item.addons.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">Add-ons:</p>
                  <div className="space-y-1">
                    {item.addons.map((addon, index) => (
                      <label key={index} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedAddons.some(a => a.name === addon.name)}
                          onChange={(e) => handleAddonChange(addon, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {addon.name} (+${addon.price.toFixed(2)})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price and Actions */}
            <div className="flex flex-col items-end space-y-2">
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {formatPrice(calculateTotalPrice())}
                </div>
                {selectedVariants.length > 0 || selectedAddons.length > 0 ? (
                  <div className="text-sm text-gray-500">
                    Base: {formatPrice(item.price)}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-1 rounded-full ${
                    isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  
                  <span className="px-3 py-1 text-sm font-medium">
                    {quantity}
                  </span>
                  
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!item.isAvailable}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !item.isAvailable
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isInCart
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {!item.isAvailable
                    ? 'Unavailable'
                    : isInCart
                    ? 'In Cart'
                    : 'Add to Cart'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MenuItemCard;
