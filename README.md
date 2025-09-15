# Food Delivery & Management System (AI-Enabled)

A comprehensive food delivery platform with AI-powered features including recommendation engine, price optimization, demand forecasting, and intelligent order management.

## 🚀 Features

### Core Features
- **Multi-User System**: Customers, Restaurant Owners, Delivery Drivers, and Admins
- **Restaurant Management**: Complete CRUD operations for restaurants and menu items
- **Order Management**: Real-time order tracking and status updates
- **Review System**: Customer reviews with AI-powered sentiment analysis
- **Location-Based Services**: Geospatial queries for nearby restaurants
- **Payment Integration**: Multiple payment methods support
- **Real-time Notifications**: Order updates and delivery tracking

### AI-Enabled Features
- **Smart Recommendations**: Personalized food recommendations based on user preferences
- **Price Optimization**: AI-driven dynamic pricing for menu items
- **Demand Forecasting**: Predictive analytics for restaurant demand
- **Sentiment Analysis**: Automated review sentiment analysis
- **Route Optimization**: AI-powered delivery route optimization
- **Churn Prediction**: Customer retention analytics
- **Popularity Scoring**: AI-based menu item popularity tracking

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)
```
backend/
├── models/
│   ├── User.js              # Multi-role user model
│   ├── Restaurant.js        # Restaurant data model
│   ├── MenuItem.js          # Menu items with AI data
│   ├── Order.js             # Order management
│   ├── Review.js            # Review system
│   └── Delivery.js          # Delivery tracking
├── controllers/
│   ├── authController.js    # Authentication & user management
│   ├── restaurantController.js
│   ├── menuController.js
│   ├── orderController.js
│   └── reviewController.js
├── services/
│   └── aiService.js         # AI algorithms & ML features
├── routes/
│   ├── auth.js
│   ├── restaurants.js
│   ├── menu.js
│   ├── orders.js
│   └── reviews.js
└── middlewares/
    └── auth.js
```

### Frontend (React + Vite + Tailwind CSS)
```
frontend/
├── src/
│   ├── components/
│   │   ├── RestaurantCard.jsx
│   │   ├── MenuItemCard.jsx
│   │   ├── SearchFilters.jsx
│   │   ├── CartSidebar.jsx
│   │   ├── RestaurantInfo.jsx
│   │   └── ReviewSection.jsx
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   └── RestaurantPage.jsx
│   ├── contexts/
│   │   └── FoodDeliveryContext.jsx
│   └── App.jsx
```

## 🤖 AI Features Implementation

### 1. Recommendation Engine
- **Content-Based Filtering**: Based on cuisine preferences and dietary restrictions
- **Collaborative Filtering**: User similarity analysis
- **Hybrid Approach**: Combines both methods for better accuracy

### 2. Price Optimization
- **Demand Elasticity Analysis**: Price sensitivity calculations
- **Competitor Analysis**: Market price comparison
- **Dynamic Pricing**: AI-suggested optimal prices

### 3. Demand Forecasting
- **Time Series Analysis**: Historical order pattern analysis
- **Seasonal Trends**: Holiday and weather impact prediction
- **Real-time Adjustments**: Live demand updates

### 4. Sentiment Analysis
- **Review Classification**: Positive, negative, neutral sentiment
- **Topic Extraction**: Key themes in reviews
- **Spam Detection**: Automated review validation

## 📊 Database Schema

### User Model
```javascript
{
  userType: 'customer' | 'restaurant_owner' | 'delivery_driver' | 'admin',
  preferences: {
    cuisine: [String],
    dietaryRestrictions: [String],
    maxDeliveryDistance: Number
  },
  aiProfile: {
    orderHistory: [Object],
    preferences: Object,
    recommendations: [ObjectId],
    churnRisk: Number,
    lifetimeValue: Number
  }
}
```

### Restaurant Model
```javascript
{
  name: String,
  cuisine: String,
  address: {
    coordinates: { latitude: Number, longitude: Number }
  },
  aiRecommendations: {
    popularItems: [ObjectId],
    trendingScore: Number,
    demandForecast: Object
  }
}
```

### MenuItem Model
```javascript
{
  name: String,
  price: Number,
  category: String,
  aiData: {
    popularityScore: Number,
    priceOptimization: Object,
    recommendations: [ObjectId]
  }
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Google Cloud Console account for OAuth

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ChatApp
```

2. **Backend Setup**
```bash
cd backend
npm install
cp env.example .env
# Configure your .env file
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
```env
# Backend (.env)
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fooddelivery
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
CLIENT_URL=http://localhost:3000

# Frontend (.env)
VITE_API_URL=http://localhost:5000/api
```

## 🔧 API Endpoints

### Authentication
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/recommendations` - Get AI recommendations
- `GET /api/auth/analytics` - Get user analytics

### Restaurants
- `GET /api/restaurants` - Get restaurants with filters
- `GET /api/restaurants/:id` - Get single restaurant
- `POST /api/restaurants` - Create restaurant (owner)
- `PUT /api/restaurants/:id` - Update restaurant (owner)
- `GET /api/restaurants/:id/analytics` - Get restaurant analytics

### Menu
- `GET /api/menu/restaurant/:id` - Get menu items
- `GET /api/menu/:id` - Get single menu item
- `POST /api/menu/restaurant/:id` - Create menu item (owner)
- `PUT /api/menu/:id` - Update menu item (owner)
- `GET /api/menu/restaurant/:id/recommendations` - Get AI recommendations

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/cancel` - Cancel order

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/restaurant/:id` - Get restaurant reviews
- `GET /api/reviews/my-reviews` - Get user reviews
- `POST /api/reviews/:id/helpful` - Mark review as helpful

## 🎯 Usage Examples

### 1. Customer Journey
1. **Browse Restaurants**: Search and filter by cuisine, rating, delivery time
2. **View Menu**: Browse menu items with AI recommendations
3. **Add to Cart**: Customize items with variants and add-ons
4. **Place Order**: Complete checkout with payment
5. **Track Delivery**: Real-time order tracking
6. **Leave Review**: Rate and review experience

### 2. Restaurant Owner Dashboard
1. **Manage Restaurant**: Update restaurant info and hours
2. **Menu Management**: Add/edit menu items with AI pricing suggestions
3. **Order Management**: View and update order status
4. **Analytics**: View sales, popular items, and demand forecasts
5. **Review Management**: Monitor customer feedback

### 3. AI Features Usage
1. **Recommendations**: Personalized suggestions based on order history
2. **Price Optimization**: AI-suggested optimal pricing
3. **Demand Forecasting**: Predict busy periods and prepare accordingly
4. **Sentiment Analysis**: Automatically analyze customer reviews

## 🔮 Future Enhancements

### Planned Features
- **Real-time Chat**: Customer support chatbot
- **Mobile Apps**: React Native mobile applications
- **Advanced Analytics**: Machine learning insights dashboard
- **Multi-language Support**: Internationalization
- **Voice Ordering**: Voice-activated ordering system
- **AR Menu**: Augmented reality menu viewing
- **Blockchain**: Supply chain transparency

### AI Improvements
- **Deep Learning Models**: More sophisticated recommendation algorithms
- **Computer Vision**: Food image recognition and analysis
- **Natural Language Processing**: Advanced review analysis
- **Predictive Maintenance**: Restaurant equipment monitoring
- **Dynamic Menu**: AI-generated menu suggestions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React and Vite for the frontend framework
- Node.js and Express for the backend
- MongoDB for the database
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React for icons

## 📞 Support

For support, email support@fooddelivery.com or join our Slack channel.

---

**Built with ❤️ using AI and modern web technologies**
