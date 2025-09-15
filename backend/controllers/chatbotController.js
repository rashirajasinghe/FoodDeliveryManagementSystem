const ChatbotService = require('../services/chatbotService');

const chatbotService = new ChatbotService();

// Process chatbot message
const processMessage = async (req, res) => {
  try {
    const { message, userId, context } = req.body;
    const actualUserId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Process the message
    const response = await chatbotService.processMessage(
      message,
      actualUserId,
      context || {}
    );

    // Emit response via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${actualUserId}`).emit('bot-response', {
        message: response.message,
        suggestions: response.suggestions || []
      });
    }

    res.json({
      success: true,
      data: {
        message: response.message,
        suggestions: response.suggestions || []
      }
    });

  } catch (error) {
    console.error('Error processing chatbot message:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing message',
      error: error.message
    });
  }
};

// Get chatbot suggestions
const getSuggestions = async (req, res) => {
  try {
    const suggestions = [
      "Track my order",
      "Find restaurants",
      "Help with payment",
      "Contact support",
      "Order history",
      "Delivery time",
      "Cancel order",
      "Refund request"
    ];

    res.json({
      success: true,
      data: { suggestions }
    });

  } catch (error) {
    console.error('Error getting chatbot suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting suggestions',
      error: error.message
    });
  }
};

module.exports = {
  processMessage,
  getSuggestions
};
