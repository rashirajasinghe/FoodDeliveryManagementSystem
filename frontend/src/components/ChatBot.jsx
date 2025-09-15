import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Phone, 
  Mail,
  Clock,
  MapPin,
  ShoppingBag
} from 'lucide-react';
import { useFoodDelivery } from '../contexts/FoodDeliveryContext';

const ChatBot = () => {
  const { user, api } = useFoodDelivery();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize with welcome message
    setMessages([
      {
        id: 1,
        type: 'bot',
        message: "Hi! I'm your AI assistant. How can I help you today?",
        timestamp: new Date(),
        suggestions: [
          "Track my order",
          "Find restaurants",
          "Help with payment",
          "Contact support"
        ]
      }
    ]);

    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    setSocket(newSocket);

    // Listen for bot responses
    newSocket.on('bot-response', (data) => {
      addMessage('bot', data.message, data.suggestions);
      setIsTyping(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (type, message, suggestions = []) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      type,
      message,
      suggestions,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const sendMessage = async (message) => {
    if (!message.trim()) return;

    // Add user message
    addMessage('user', message);

    // Show typing indicator
    setIsTyping(true);

    try {
      // Send message to backend
      const response = await api.post('/chatbot/message', {
        message,
        userId: user?.id,
        context: {
          userType: user?.userType,
          currentOrders: [], // Could be populated with user's current orders
          location: user?.address
        }
      });

      if (response.data.success) {
        // The response will be sent via socket
        // The typing indicator will be cleared when bot-response is received
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      addMessage('bot', "I'm sorry, I'm having trouble connecting right now. Please try again later.");
    }

    setInputMessage('');
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    sendMessage(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  const quickActions = [
    { icon: ShoppingBag, text: "Track Order", action: "Track my order" },
    { icon: MapPin, text: "Find Restaurants", action: "Find restaurants near me" },
    { icon: Phone, text: "Contact Support", action: "I need to speak with a human" },
    { icon: Clock, text: "Order History", action: "Show my order history" }
  ];

  return (
    <>
      {/* Chat Button */}
      <motion.button
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span className="font-semibold">AI Assistant</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      msg.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="block w-full text-left text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="p-2 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-1 mb-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(action.action)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <action.icon className="h-3 w-3" />
                    <span>{action.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={() => sendMessage(inputMessage)}
                  disabled={!inputMessage.trim()}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
