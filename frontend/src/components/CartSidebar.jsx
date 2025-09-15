import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, CreditCard } from 'lucide-react';
import { useFoodDelivery } from '../contexts/FoodDeliveryContext';
import { useNavigate } from 'react-router-dom';
import PaymentModal from './PaymentModal';

const CartSidebar = ({ isOpen, onClose }) => {
  const {
    cart,
    getCartTotal,
    getCartItemCount,
    updateCartItem,
    removeFromCart,
    clearCart,
    createOrder,
    user
  } = useFoodDelivery();

  const navigate = useNavigate();
  const [showPayment, setShowPayment] = useState(false);
  const [orderData, setOrderData] = useState(null);

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (cart.length === 0) {
      return;
    }

    // Calculate totals
    const subtotal = getCartTotal();
    const deliveryFee = 2.99; // Fixed delivery fee
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + deliveryFee + tax;

    // Create order data
    const order = {
      restaurant: cart[0].menuItem.restaurant._id,
      items: cart.map(item => ({
        menuItem: item.menuItem._id,
        quantity: item.quantity,
        price: item.price,
        variants: item.variants || [],
        addons: item.addons || [],
        specialInstructions: item.specialInstructions || ''
      })),
      subtotal,
      deliveryFee,
      tax,
      total,
      paymentMethod: 'credit_card',
      deliveryAddress: user.address || {
        street: '123 Main St',
        city: 'City',
        state: 'State',
        zipCode: '12345',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      }
    };

    // Create order first
    try {
      const response = await createOrder(order);
      setOrderData(response.data);
      setShowPayment(true);
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    onClose();
    navigate('/orders');
  };

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  const subtotal = getCartTotal();
  const deliveryFee = 2.99;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Your Cart ({getCartItemCount()})
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ShoppingBag className="h-12 w-12 mb-4" />
                  <p className="text-lg font-medium mb-2">Your cart is empty</p>
                  <p className="text-sm text-center">
                    Add some delicious items to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item._id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start space-x-3">
                        {/* Item Image */}
                        <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {item.menuItem.images && item.menuItem.images.length > 0 ? (
                            <img
                              src={item.menuItem.images[0].url}
                              alt={item.menuItem.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                            {item.menuItem.name}
                          </h3>
                          
                          {/* Variants and Addons */}
                          {(item.variants?.length > 0 || item.addons?.length > 0) && (
                            <div className="mt-1 text-xs text-gray-600">
                              {item.variants?.map((variant, index) => (
                                <span key={index} className="block">
                                  {variant.name} (+{formatPrice(variant.price)})
                                </span>
                              ))}
                              {item.addons?.map((addon, index) => (
                                <span key={index} className="block">
                                  {addon.name} (+{formatPrice(addon.price)})
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatPrice((item.price + (item.variants?.reduce((sum, v) => sum + v.price, 0) || 0) + (item.addons?.reduce((sum, a) => sum + a.price, 0) || 0)) * item.quantity)}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateCartItem(item._id, item.quantity - 1)}
                                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              
                              <span className="text-sm font-medium w-6 text-center">
                                {item.quantity}
                              </span>
                              
                              <button
                                onClick={() => updateCartItem(item._id, item.quantity + 1)}
                                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                              >
                                <Plus className="h-3 w-3" />
                              </button>

                              <button
                                onClick={() => removeFromCart(item._id)}
                                className="p-1 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-gray-200 p-4 space-y-4">
                {/* Order Summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">{formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Proceed to Payment</span>
                  </button>
                  
                  <button
                    onClick={clearCart}
                    className="w-full text-gray-600 hover:text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Payment Modal */}
      {orderData && (
        <PaymentModal
          order={orderData}
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;
