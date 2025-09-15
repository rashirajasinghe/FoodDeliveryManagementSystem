import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useFoodDelivery } from '../contexts/FoodDeliveryContext';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PaymentForm = ({ order, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { api } = useFoodDelivery();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const response = await api.post('/payments/create-payment-intent', {
        orderId: order._id
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      const { clientSecret } = response.data.data;

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        await api.post('/payments/confirm-payment', {
          paymentIntentId: paymentIntent.id
        });

        onSuccess(paymentIntent);
      }
    } catch (err) {
      setError(err.message);
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="p-3 border border-gray-300 rounded-lg">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <span>Subtotal:</span>
          <span>${order.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span>Delivery Fee:</span>
          <span>${order.deliveryFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span>Tax:</span>
          <span>${order.tax.toFixed(2)}</span>
        </div>
        {order.tip > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span>Tip:</span>
            <span>${order.tip.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-gray-200 mt-2 pt-2">
          <div className="flex justify-between items-center font-semibold">
            <span>Total:</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            <span>Pay ${order.total.toFixed(2)}</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
        <Lock className="h-4 w-4" />
        <span>Secured by Stripe</span>
      </div>
    </form>
  );
};

const PaymentModal = ({ order, isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState('payment'); // payment, success, error
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStep('payment');
      setError(null);
    }
  }, [isOpen]);

  const handleSuccess = (paymentIntent) => {
    setStep('success');
    setTimeout(() => {
      onSuccess(paymentIntent);
      onClose();
    }, 2000);
  };

  const handleError = (err) => {
    setError(err.message);
    setStep('error');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Complete Payment
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Order #{order?.orderNumber}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'payment' && (
              <Elements stripe={stripePromise}>
                <PaymentForm
                  order={order}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              </Elements>
            )}

            {step === 'success' && (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Payment Successful!
                </h3>
                <p className="text-gray-600">
                  Your order has been confirmed and will be prepared shortly.
                </p>
              </div>
            )}

            {step === 'error' && (
              <div className="text-center py-8">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Payment Failed
                </h3>
                <p className="text-gray-600 mb-4">
                  {error || 'There was an error processing your payment.'}
                </p>
                <button
                  onClick={() => setStep('payment')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;
