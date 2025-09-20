import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FoodDeliveryProvider } from './contexts/FoodDeliveryContext';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import RestaurantPage from './pages/RestaurantPage';
import RestaurantDashboard from './pages/RestaurantDashboard';
import OrdersPage from './pages/OrdersPage';
import DriverDashboard from './pages/DriverDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import ChatBot from './components/ChatBot';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <FoodDeliveryProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <Toaster position="top-right" />
                <ChatBot />
                <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Food Delivery Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/restaurant/:id"
                element={
                  <ProtectedRoute>
                    <RestaurantPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/restaurant-dashboard"
                element={
                  <ProtectedRoute>
                    <RestaurantDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/driver-dashboard"
                element={
                  <ProtectedRoute>
                    <DriverDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <AnalyticsDashboard />
                  </ProtectedRoute>
                }
              />
              
            </Routes>
          </div>
        </Router>
      </FoodDeliveryProvider>
    </AuthProvider>
  );
}

export default App;
