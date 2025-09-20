import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your food delivery assistant. How can I help you today?",
      isBot: true
    }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      text: inputText,
      isBot: false
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: "Thanks for your message! I'm here to help with your food delivery needs. You can ask me about restaurants, menu items, or delivery times.",
        isBot: true
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg transition-colors duration-200 z-50"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-96 flex flex-col">
            {/* Header */}
            <div className="bg-primary-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <h3 className="font-semibold">Food Delivery Assistant</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.isBot
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-primary-600 text-white'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;