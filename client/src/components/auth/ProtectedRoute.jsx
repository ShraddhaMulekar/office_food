import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role(s)
  if (roles.length > 0) {
    const hasRequiredRole = roles.includes(user.role);
    if (!hasRequiredRole) {
      // Redirect to appropriate dashboard based on user role
      let redirectPath = '/';

      switch (user.role) {
        case 'admin':
          redirectPath = '/admin';
          break;
        case 'delivery':
          redirectPath = '/delivery';
          break;
        case 'employee':
          redirectPath = '/';
          break;
        default:
          redirectPath = '/';
      }

      return <Navigate to={redirectPath} replace />;
    }
  }

  // User is authenticated and has required role, render children
  return children;
};

export default ProtectedRoute;