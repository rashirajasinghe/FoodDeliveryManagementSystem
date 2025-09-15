const express = require('express');
const router = express.Router();
const {
  processMessage,
  getSuggestions
} = require('../controllers/chatbotController');
const { authenticate } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Process message
router.post('/message', processMessage);

// Get suggestions
router.get('/suggestions', getSuggestions);

module.exports = router;
