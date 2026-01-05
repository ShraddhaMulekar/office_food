import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import { useQueryClient } from 'react-query';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('SocketProvider: User authenticated, creating socket connection');

      // Create socket connection
      const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:4001', {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        auth: {
          token: localStorage.getItem('token')
        }
      });

      // Join user-specific room
      newSocket.emit('join-user', user._id);
      console.log('SocketProvider: Joined user room:', user._id);

      // Join role-specific room
      if (user.role === 'admin') {
        newSocket.emit('join-admin');
        console.log('SocketProvider: Admin joined admin room');
      } else if (user.role === 'delivery') {
        newSocket.emit('join-delivery', user._id);
        console.log('SocketProvider: Delivery joined delivery room:', user._id);
      }

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('SocketProvider: Connected to server, socket ID:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('SocketProvider: Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('SocketProvider: Socket connection error:', error);
        setIsConnected(false);
      });

      // Debounce map for toasts
      const toastDebounceMap = {};
      const TOAST_DEBOUNCE_MS = 2000;

      // Helper to show toast only if not shown recently for this order/type
      function showDebouncedToast(key, fn) {
        const now = Date.now();
        if (!toastDebounceMap[key] || now - toastDebounceMap[key] > TOAST_DEBOUNCE_MS) {
          toastDebounceMap[key] = now;
          fn();
        }
      }

      // Order updates
      newSocket.on('orderUpdate', (data) => {
        const { type, order } = data;

        // Add null checks to prevent runtime errors
        if (!order || !order.orderNumber) {
          console.warn('SocketProvider: Received orderUpdate with invalid order data:', data);
          return;
        }

        console.log('SocketProvider: Received orderUpdate:', { type, orderNumber: order.orderNumber });

        let message = '';
        switch (type) {
          case 'order_placed':
            message = `Order #${order.orderNumber} placed successfully`;
            break;
          case 'pending':
            message = `Order #${order.orderNumber} is pending confirmation`;
            break;
          case 'confirmed':
            message = `Order #${order.orderNumber} has been confirmed`;
            break;
          case 'preparing':
            message = `Order #${order.orderNumber} is being prepared`;
            break;
          case 'ready':
            message = `Order #${order.orderNumber} is ready for delivery`;
            break;
          case 'delivering':
            message = `Order #${order.orderNumber} is out for delivery`;
            break;
          case 'out_for_delivery':
            message = `Order #${order.orderNumber} is out for delivery`;
            break;
          case 'delivered':
            message = `Order #${order.orderNumber} has been delivered`;
            break;
          case 'cancelled':
            message = `Order #${order.orderNumber} has been cancelled`;
            break;
          default:
            message = `Order #${order.orderNumber} status updated to ${type}`;
        }
        showDebouncedToast(`orderUpdate-${type}-${order._id}`, () => {
          toast.success(message, {
            position: 'bottom-left',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        });

        // Invalidate relevant queries
        queryClient.invalidateQueries(['orders']);
        queryClient.invalidateQueries(['adminOrders']);
      });

      // Payment updates
      newSocket.on('paymentUpdate', (data) => {
        console.log('SocketProvider: Received paymentUpdate:', data);
        const { type, order } = data;

        // Add null checks to prevent runtime errors
        if (!order || !order.orderNumber) {
          console.warn('SocketProvider: Received paymentUpdate with invalid order data:', data);
          return;
        }

        let message = '';

        switch (type) {
          case 'payment_success':
            message = `Payment successful for Order #${order.orderNumber}`;
            break;
          case 'payment_failed':
            message = `Payment failed for Order #${order.orderNumber}`;
            break;
          default:
            message = `Payment update for Order #${order.orderNumber}`;
        }

        toast.info(message, {
          position: 'bottom-left',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      });

      // New delivery assignment (for delivery staff)
      newSocket.on('newDeliveryAssignment', (data) => {
        console.log('SocketProvider: Received newDeliveryAssignment:', data);
        const { order } = data;

        // Add null checks to prevent runtime errors
        if (!order || !order.orderNumber) {
          console.warn('SocketProvider: Received newDeliveryAssignment with invalid order data:', data);
          return;
        }

        toast.info(`New delivery assignment: Order #${order.orderNumber}`, {
          position: 'bottom-left',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      });

      // New order notification (for admin)
      newSocket.on('newOrder', (data) => {
        console.log('SocketProvider: Received newOrder notification:', data);
        const { order } = data;

        // Add null checks to prevent runtime errors
        if (!order || !order.orderNumber) {
          console.warn('SocketProvider: Received newOrder with invalid order data:', data);
          return;
        }

        const userName = order.user?.name || 'Unknown User';
        toast.info(`New order received: #${order.orderNumber} from ${userName}`, {
          position: 'bottom-left',
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Invalidate admin orders query
        queryClient.invalidateQueries(['adminOrders']);
      });

      // Broadcast notifications
      newSocket.on('broadcastNotification', (data) => {
        console.log('SocketProvider: Received broadcastNotification:', data);
        const { title, message } = data;
        toast.info(`${title}: ${message}`, {
          position: 'bottom-left',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      });

      // Test notifications
      newSocket.on('testNotification', (data) => {
        console.log('SocketProvider: Received testNotification:', data);
        toast.success(`Test notification received!`, {
          position: 'bottom-left',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      });

      // Error handling
      newSocket.on('error', (error) => {
        console.error('SocketProvider: Socket error:', error);
        toast.error('Connection error. Please refresh the page.');
      });

      // Order status update
      newSocket.on('orderStatusUpdate', (data) => {
        console.log('SocketProvider: Received orderStatusUpdate:', data);
        // Update order status in real-time
        if (data.orderId) {
          queryClient.invalidateQueries(['order', data.orderId]);
        }
        queryClient.invalidateQueries(['orders']);
        queryClient.invalidateQueries(['adminOrders']);
      });

      setSocket(newSocket);

      // Cleanup on unmount or when authentication changes
      return () => {
        console.log('SocketProvider: Cleaning up socket connection');
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    } else {
      // If not authenticated, close the socket if it exists
      if (socket) {
        console.log('SocketProvider: User logged out, disconnecting socket');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user, queryClient]);

  const value = {
    socket,
    isConnected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};