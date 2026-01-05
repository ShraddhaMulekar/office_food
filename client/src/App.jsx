import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminMenu from './pages/admin/Menu';
import AdminAnalytics from './pages/admin/Analytics';
import AdminPayments from './pages/admin/Payments';
import DeliveryDashboard from './pages/delivery/Dashboard';
import DeliveryOrders from './pages/delivery/Orders';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Dashboard Redirect Component
const DashboardRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  console.log('DashboardRedirect - User:', user);
  console.log('DashboardRedirect - isAuthenticated:', isAuthenticated);
  console.log('DashboardRedirect - loading:', loading);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Always redirect to menu regardless of authentication status or role
  console.log('Redirecting to menu (unified landing page)');
  return <Navigate to="/menu" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <div className="App">
              <Navbar />
              <main className="min-h-screen">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<DashboardRedirect />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/cart" element={<Cart />} />

                  {/* Protected Routes - Employee */}
                  <Route path="/orders" element={
                    <ProtectedRoute roles={['employee']}>
                      <Orders />
                    </ProtectedRoute>
                  } />
                  <Route path="/orders/:id" element={
                    <ProtectedRoute roles={['employee']}>
                      <OrderDetails />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute roles={['employee', 'delivery', 'admin']}>
                      <Profile />
                    </ProtectedRoute>
                  } />

                  {/* Protected Routes - Admin */}
                  <Route path="/admin" element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/orders" element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminOrders />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/users" element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminUsers />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/menu" element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminMenu />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/analytics" element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminAnalytics />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/payments" element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminPayments />
                    </ProtectedRoute>
                  } />

                  {/* Protected Routes - Delivery */}
                  <Route path="/delivery" element={
                    <ProtectedRoute roles={['delivery']}>
                      <DeliveryDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/delivery/orders" element={
                    <ProtectedRoute roles={['delivery']}>
                      <DeliveryOrders />
                    </ProtectedRoute>
                  } />

                  {/* Test route */}
                  <Route path="/test" element={<div>Test route working!</div>} />

                  {/* Catch all route */}
                  <Route path="*" element={<DashboardRedirect />} />
                </Routes>
              </main>
              <Footer />

              {/* Toast Notifications */}
              <ToastContainer
                position="top-left"
                autoClose={2000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                limit={3}
                className="sm:top-4 sm:left-4 top-2 left-2"
                toastClassName="!text-xs sm:!text-sm !min-h-[40px] sm:!min-h-[48px] !max-w-[280px] sm:!max-w-[320px] !p-2 sm:!p-3"
                bodyClassName="!text-xs sm:!text-sm !p-0"
                progressClassName="!h-1"
              />
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App; 
