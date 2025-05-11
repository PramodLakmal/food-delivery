import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './contexts/CartContext';

// Layout
import Layout from './components/layout/Layout';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import DeliveryTrackingPage from './pages/DeliveryTrackingPage';

// Protected Pages
import ProfilePage from './pages/ProfilePage';
import DashboardLayout from './components/layout/DashboardLayout';

// Admin Dashboard
import SystemAdminDashboard from './pages/admin/SystemAdminDashboard';

// Restaurant Admin Dashboard
import RestaurantAdminDashboard from './pages/restaurantAdmin/RestaurantAdminDashboard';
import RestaurantOrdersPage from './pages/restaurantAdmin/RestaurantOrdersPage';
import RestaurantOrderDetailsPage from './pages/restaurantAdmin/RestaurantOrderDetailsPage';
import RestaurantDeliveryDetailsPage from './pages/restaurantAdmin/RestaurantDeliveryDetailsPage';

// Delivery Dashboard
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import CompleteProfilePage from './pages/delivery/CompleteProfilePage';

// Not Found Page
import NotFoundPage from './pages/NotFoundPage';

// Inner component that uses the auth context
const AppRoutes = () => {
  const { isAuthenticated, user, loading } = useAuth();

  // Protected route wrapper
  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
      // Redirect based on role if user doesn't have access
      if (user?.role === 'restaurant_admin') {
        return <Navigate to="/restaurant-admin/dashboard" />;
      } else if (user?.role === 'delivery_person') {
        return <Navigate to="/delivery/dashboard" />;
      } else if (user?.role === 'system_admin') {
        return <Navigate to="/admin/dashboard" />;
      } else {
        return <Navigate to="/profile" />;
      }
    }

    return children;
  };

  // Redirect to appropriate dashboard based on user role
  const DashboardRedirect = () => {
    if (!user) return <Navigate to="/login" />;

    switch (user.role) {
      case 'restaurant_admin':
        return <Navigate to="/restaurant-admin/dashboard" />;
      case 'delivery_person':
        return <Navigate to="/delivery/dashboard" />;
      case 'system_admin':
        return <Navigate to="/admin/dashboard" />;
      default:
        return <Navigate to="/profile" />;
    }
  };

  // Check if delivery person profile is complete
  const DeliveryPersonRoute = ({ children }) => {
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }

    if (user?.role !== 'delivery_person') {
      return <Navigate to="/dashboard" />;
    }

    // If delivery person profile is not complete, redirect to complete profile page
    // This is a simplified check - in a real app, you'd check specific fields
    if (!user.isProfileComplete && window.location.pathname !== '/delivery/complete-profile') {
      return <Navigate to="/delivery/complete-profile" />;
    }

    return children;
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="menu" element={<MenuPage />} />
        </Route>

        {/* Customer Routes */}
        <Route path="/menu" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Layout>
              <MenuPage />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Protected Routes */}
        <Route path="/cart" element={
          <ProtectedRoute>
            <Layout><CartPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute>
            <Layout><OrdersPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/orders/:orderId" element={
          <ProtectedRoute>
            <Layout><OrderDetailsPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/delivery-tracking/:deliveryId" element={
          <ProtectedRoute>
            <Layout><DeliveryTrackingPage /></Layout>
          </ProtectedRoute>
        } />

        {/* Dashboard Route - Redirects based on role */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } 
        />

        {/* System Admin Routes */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute allowedRoles={['system_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<SystemAdminDashboard />} />
        </Route>

        {/* Restaurant Admin Routes */}
        <Route 
          path="/restaurant-admin/*" 
          element={
            <ProtectedRoute allowedRoles={['restaurant_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<RestaurantAdminDashboard />} />
          <Route path="orders" element={<RestaurantOrdersPage />} />
          <Route path="orders/:orderId" element={<RestaurantOrderDetailsPage />} />
          <Route path="deliveries/:deliveryId" element={<RestaurantDeliveryDetailsPage />} />
        </Route>

        {/* Delivery Person Routes */}
        <Route 
          path="/delivery/*" 
          element={
            <ProtectedRoute allowedRoles={['delivery_person']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DeliveryDashboard />} />
          <Route path="complete-profile" element={<CompleteProfilePage />} />
        </Route>

        {/* Protected Routes for all authenticated users */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Not Found and Catch-all routes */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-center" reverseOrder={false} />
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
