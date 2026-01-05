import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Bell, Package, User, MapPin, Clock, Trash2, Volume2, VolumeX, Settings } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const AdminNotification = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const { socket } = useSocket();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications from database
  const { data: notificationData, isLoading, refetch } = useQuery(
    'adminNotifications',
    async () => {
      const response = await api.get('/api/admin/notifications?limit=50');
      return response.data.data;
    },
    {
      enabled: isAuthenticated,
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 10000, // Consider data stale after 10 seconds
    }
  );

  // Fetch sound preferences from database
  const { data: soundData } = useQuery(
    'adminSoundPreferences',
    async () => {
      const response = await api.get('/api/admin/notification-sound');
      return response.data.data;
    },
    {
      enabled: isAuthenticated
    }
  );

  const notifications = notificationData?.notifications || [];
  const unreadCount = notificationData?.unreadCount || 0;
  const soundEnabled = soundData?.soundPreferences?.enabled ?? true;
  const soundType = soundData?.soundPreferences?.type ?? 'beep';

  // Sound configurations with useMemo to prevent re-creation
  const soundConfigs = useMemo(() => ({
    beep: {
      name: 'Beep',
      description: 'Simple double beep',
      frequency: 800,
      pattern: 'double'
    },
    chime: {
      name: 'Chime',
      description: 'Gentle ascending chime',
      frequency: 523,
      pattern: 'ascending'
    },
    ding: {
      name: 'Ding',
      description: 'Single ding sound',
      frequency: 660,
      pattern: 'single'
    },
    notification: {
      name: 'Notification',
      description: 'Standard triple beep',
      frequency: 440,
      pattern: 'triple'
    },
    alert: {
      name: 'Alert',
      description: 'Attention-grabbing alert',
      frequency: 1000,
      pattern: 'urgent'
    },
    siren: {
      name: 'Siren',
      description: 'Strong emergency siren',
      frequency: 800,
      pattern: 'siren'
    },
    bell: {
      name: 'Bell',
      description: 'Loud bell sound',
      frequency: 600,
      pattern: 'bell'
    },
    alarm: {
      name: 'Alarm',
      description: 'High-pitched alarm',
      frequency: 1200,
      pattern: 'alarm'
    }
  }), []);

  // Play sound by type (for preview)
  const playSoundByType = useCallback((type) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const config = soundConfigs[type];
      oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      switch (config.pattern) {
        case 'single':
          // Single beep
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
          break;

        case 'double':
          // Double beep
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.2);
          gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.21);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.35);
          break;

        case 'triple':
          // Triple beep
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.15);
          gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.16);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.3);
          gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.31);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.4);
          break;

        case 'ascending':
          // Ascending chime
          oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
          oscillator.frequency.linearRampToValueAtTime(config.frequency * 1.25, audioContext.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          break;

        case 'urgent':
          // Urgent alert
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.12);
          gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.13);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.22);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.25);
          gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.26);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.35);
          break;
        case 'siren':
          // Strong emergency siren
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.2);
          gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.21);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.4);
          gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.41);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.55);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.55);
          break;
        case 'bell':
          // Loud bell sound
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.35);
          gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.36);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
        case 'alarm':
          // High-pitched alarm
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.15);
          gainNode.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.16);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.3);
          gainNode.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.31);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.45);
          gainNode.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.46);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.55);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.55);
          break;
        default:
          // Default to single beep
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
          break;
      }

      oscillator.onended = () => {
        audioContext.close();
      };
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }, [soundConfigs]);

  // Play notification sound based on selected type
  const playNotificationSound = useCallback(() => {
    if (soundEnabled) {
      playSoundByType(soundType);
    }
  }, [soundEnabled, soundType, playSoundByType]);

  // Update sound preferences
  const updateSoundPreferencesMutation = useMutation(
    async (preferences) => {
      const response = await api.put('/api/admin/notification-sound', preferences);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminSoundPreferences');
        toast.success('Sound preferences updated');
      },
      onError: (error) => {
        toast.error('Failed to update sound preferences');
      },
    }
  );

  // Mark notification as read
  const markAsReadMutation = useMutation(
    async (notificationId) => {
      const response = await api.put(`/api/admin/notifications/${notificationId}/read`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminNotifications');
      },
      onError: (error) => {
        toast.error('Failed to mark notification as read');
      },
    }
  );

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation(
    async () => {
      const response = await api.put('/api/admin/notifications/read-all');
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminNotifications');
        toast.success('All notifications marked as read');
      },
      onError: (error) => {
        toast.error('Failed to mark all notifications as read');
      },
    }
  );

  // Delete notification
  const deleteNotificationMutation = useMutation(
    async (notificationId) => {
      const response = await api.delete(`/api/admin/notifications/${notificationId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminNotifications');
        toast.success('Notification deleted');
      },
      onError: (error) => {
        toast.error('Failed to delete notification');
      },
    }
  );

  // Clear all notifications
  const clearAllNotificationsMutation = useMutation(
    async () => {
      const response = await api.delete('/api/admin/notifications/clear-all');
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminNotifications');
        toast.success('All notifications cleared');
        setShowNotifications(false);
      },
      onError: (error) => {
        toast.error('Failed to clear notifications');
      },
    }
  );

  useEffect(() => {
    if (!socket) {
      console.log('AdminNotification: No socket available');
      return;
    }

    console.log('AdminNotification: Setting up socket listeners');

    // Join admin room
    socket.emit('join-admin');
    console.log('AdminNotification: Emitted join-admin');

    // Listen for new orders
    socket.on('newOrder', (data) => {
      console.log('AdminNotification: Received newOrder event:', data);

      // Play notification sound
      playNotificationSound();

      // Refetch notifications to get the latest from database
      refetch();

      // Show toast notification
      toast.info(
        <div>
          <div className="font-semibold">New Order Received!</div>
          <div className="text-sm">
            Order #{data.order.orderNumber || data.order._id?.slice(-8).toUpperCase()} from {data.order.user?.name}
          </div>
          <div className="text-sm text-gray-600">
            Floor {data.order.deliveryDetails?.floor}, Desk {data.order.deliveryDetails?.deskNumber}
          </div>
          <div className="text-sm font-medium">
            ₹{(data.order.finalAmount || 0).toFixed(2)} • {data.order.items?.length || 0} items
          </div>
        </div>,
        {
          position: 'bottom-left',
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    });

    return () => {
      console.log('AdminNotification: Cleaning up socket listeners');
      socket.off('newOrder');
    };
  }, [socket, refetch, playNotificationSound]);

  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (notificationId, e) => {
    e.stopPropagation();
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleClearAll = () => {
    clearAllNotificationsMutation.mutate();
  };

  const toggleSound = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to update sound preferences');
      return;
    }
    updateSoundPreferencesMutation.mutate({ enabled: !soundEnabled });
  };

  const changeSoundType = (newType) => {
    if (!isAuthenticated) {
      toast.error('Please log in to update sound preferences');
      return;
    }
    updateSoundPreferencesMutation.mutate({ type: newType });
  };

  const testSound = () => {
    playSoundByType(soundType);
  };

  const previewSound = (type) => {
    playSoundByType(type);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diff = now - notificationTime;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return notificationTime.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_placed':
        return <Package className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationContent = (notification) => {
    if (notification.type === 'order_placed') {
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">
              {notification.data?.userName || 'Unknown User'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Floor {notification.data?.floor || 'N/A'}, Desk {notification.data?.deskNumber || 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">
              ₹{(notification.data?.amount || 0).toFixed(2)}
            </span>
            <span className="text-xs text-gray-500">
              Order #{notification.data?.orderNumber || notification.data?.orderId?.slice(-8).toUpperCase()}
            </span>
          </div>
        </div>
      );
    }
    return <span className="text-sm text-gray-600">{notification.message}</span>;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg transition-all duration-200 group"
      >
        <Bell className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-lg animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {/* Sound disabled indicator */}
        {!soundEnabled && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white shadow-sm"></div>
        )}
      </button>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border-0 z-50 max-h-96 overflow-hidden backdrop-blur-sm">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                <Bell className="w-5 h-5 mr-2 text-blue-600" />
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                {/* Sound Settings Button */}
                <button
                  onClick={() => setShowSoundSettings(!showSoundSettings)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  title="Sound settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 px-2 py-1 rounded-lg transition-all duration-200"
                    title="Mark all as read"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-all duration-200"
                  title="Clear all notifications"
                >
                  Clear all
                </button>
              </div>
            </div>

            {/* Sound Settings Panel */}
            {showSoundSettings && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 max-h-64 overflow-y-auto shadow-inner">
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10">
                  <span className="text-sm font-semibold text-gray-900 flex items-center">
                    <Volume2 className="w-4 h-4 mr-2 text-blue-600" />
                    Sound Settings
                  </span>
                  <button
                    onClick={toggleSound}
                    className={`p-2 rounded-lg transition-all duration-200 ${soundEnabled
                      ? 'text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100'
                      : 'text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100'
                      }`}
                    title={soundEnabled ? 'Disable sound notifications' : 'Enable sound notifications'}
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {soundEnabled && (
                  <div className="space-y-3">
                    <div className="text-xs text-gray-600 mb-3 font-medium">Select notification sound:</div>
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(soundConfigs).map(([key, config]) => (
                        <div
                          key={key}
                          className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${soundType === key
                            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300 bg-white'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <div className="text-sm font-semibold text-gray-900">{config.name}</div>
                                {soundType === key && (
                                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{config.description}</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {/* Preview Button */}
                              <button
                                onClick={() => previewSound(key)}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title={`Preview ${config.name} sound`}
                              >
                                <Volume2 className="w-3 h-3" />
                              </button>
                              {/* Select Button */}
                              <button
                                onClick={() => changeSoundType(key)}
                                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all duration-200 ${soundType === key
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                                  }`}
                              >
                                {soundType === key ? 'Selected' : 'Select'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={testSound}
                      className="w-full px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                    >
                      Test Current Sound
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Sound Status */}
            <div className="mt-3 text-xs text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200">
              <span className="font-medium">Sound:</span> {soundEnabled ? `${soundConfigs[soundType]?.name} (${soundType})` : 'Off'}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto bg-white">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
                <p className="text-gray-600 font-medium">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-lg">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-500 font-medium">No notifications</p>
                <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 cursor-pointer ${!notification.isRead ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500' : ''
                      }`}
                    onClick={() => handleMarkAsRead(notification._id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center text-gray-400">
                              <Clock className="w-3 h-3 mr-1" />
                              <span className="text-xs text-gray-500">
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleDeleteNotification(notification._id, e)}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg transition-all duration-200"
                              title="Delete notification"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 mt-2">
                          {getNotificationContent(notification)}
                        </div>
                        {!notification.isRead && (
                          <div className="mt-3 flex items-center space-x-2">
                            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-blue-600 font-medium">Unread</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default AdminNotification; 
