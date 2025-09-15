const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const { setupGoogleStrategy } = require('./controllers/authController');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Setup Google OAuth strategy
setupGoogleStrategy();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fooddelivery', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/driver', require('./routes/driver'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/tasks', require('./routes/tasks')); // Keep existing task routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join restaurant to their management room
  socket.on('join-restaurant-room', (restaurantId) => {
    socket.join(`restaurant-${restaurantId}`);
    console.log(`Restaurant ${restaurantId} joined their room`);
  });

  // Join delivery driver to their room
  socket.on('join-driver-room', (driverId) => {
    socket.join(`driver-${driverId}`);
    console.log(`Driver ${driverId} joined their room`);
  });

  // Handle order status updates
  socket.on('order-status-update', (data) => {
    const { orderId, status, userId, restaurantId, driverId } = data;
    
    // Notify customer
    if (userId) {
      socket.to(`user-${userId}`).emit('order-updated', {
        orderId,
        status,
        timestamp: new Date()
      });
    }
    
    // Notify restaurant
    if (restaurantId) {
      socket.to(`restaurant-${restaurantId}`).emit('order-updated', {
        orderId,
        status,
        timestamp: new Date()
      });
    }
    
    // Notify driver
    if (driverId) {
      socket.to(`driver-${driverId}`).emit('order-updated', {
        orderId,
        status,
        timestamp: new Date()
      });
    }
  });

  // Handle location updates from drivers
  socket.on('driver-location-update', (data) => {
    const { driverId, location, orderId } = data;
    
    // Notify customers tracking this order
    if (orderId) {
      socket.to(`order-${orderId}`).emit('driver-location-updated', {
        driverId,
        location,
        timestamp: new Date()
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to other modules
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
