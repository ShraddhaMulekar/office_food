import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: false,
  loading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAIL: 'LOGIN_FAIL',
  LOGOUT: 'LOGOUT',
  USER_LOADED: 'USER_LOADED',
  AUTH_ERROR: 'AUTH_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_PROFILE: 'UPDATE_PROFILE'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    
    case AUTH_ACTIONS.USER_LOADED:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_FAIL:
    case AUTH_ACTIONS.AUTH_ERROR:
    case AUTH_ACTIONS.LOGOUT:
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: action.payload
      };
    
    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set auth token header
  const setAuthToken = (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  };

  // Load user
  const loadUser = useCallback(async () => {
    if (state.token) {
      setAuthToken(state.token);
      try {
        const res = await api.get('/api/auth/me');
        dispatch({
          type: AUTH_ACTIONS.USER_LOADED,
          payload: res.data.data.user
        });
      } catch (error) {
        dispatch({
          type: AUTH_ACTIONS.AUTH_ERROR,
          payload: error.response?.data?.message || 'Authentication failed'
        });
      }
    } else {
      dispatch({ type: AUTH_ACTIONS.AUTH_ERROR, payload: null });
    }
  }, [state.token]);

  // Register user
  const register = async (formData) => {
    try {
      const res = await api.post('/api/auth/register', formData);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: res.data.data
      });
      // Set auth token after successful registration
      setAuthToken(res.data.data.token);
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAIL,
        payload: message
      });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      const res = await api.post('/api/auth/login', formData);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: res.data.data
      });
      // Set auth token after successful login
      setAuthToken(res.data.data.token);
      return { success: true, user: res.data.data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAIL,
        payload: message
      });
      throw error;
    }
  };

  // Logout user
  const logout = () => {
    dispatch({ type: AUTH_ACTIONS.LOGOUT, payload: null });
    setAuthToken(null);
    toast.info('Logged out successfully');
  };

  // Update profile
  const updateProfile = async (formData) => {
    try {
      const res = await api.put('/api/auth/profile', formData);
      dispatch({
        type: AUTH_ACTIONS.UPDATE_PROFILE,
        payload: res.data.data.user
      });
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Change password
  const changePassword = async (formData) => {
    try {
      await api.put('/api/auth/password', formData);
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has role
  const hasRole = (roles) => {
    if (!state.user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(state.user.role);
    }
    return state.user.role === roles;
  };

  // Check if user is admin
  const isAdmin = () => hasRole('admin');

  // Check if user is delivery staff
  const isDeliveryStaff = () => hasRole('delivery');

  // Check if user is employee
  const isEmployee = () => hasRole('employee');

  // Load user on mount and token change
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Set auth token on mount
  useEffect(() => {
    if (state.token) {
      setAuthToken(state.token);
    }
  }, [state.token]);

  const value = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    clearError,
    hasRole,
    isAdmin,
    isDeliveryStaff,
    isEmployee
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};