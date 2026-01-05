import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSocket } from '../../context/SocketContext';
import {
  Users,
  Package,
  DollarSign,
  Star,
  ArrowUp,
  ArrowDown,
  Utensils,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  ShoppingCart,
  CreditCard,
  UserCheck,
  UserX,
  X,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const Dashboard = () => {
  const { user, isAuthenticated, hasRole } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Debug logging
  console.log('Admin Dashboard - User:', user);
  console.log('Admin Dashboard - isAuthenticated:', isAuthenticated);
  console.log('Admin Dashboard - hasRole admin:', hasRole('admin'));
  console.log('Admin Dashboard - hasRole delivery:', hasRole('delivery'));
  console.log('Admin Dashboard - User role:', user?.role);

  const { data: dashboardData, isLoading, error } = useQuery(
    'adminDashboard',
    async () => {
      const response = await api.get('/api/admin/dashboard');
      return response.data.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const { socket } = useSocket();

  // Listen for real-time order notifications
  useEffect(() => {
    if (!socket) {
      console.log('AdminDashboard: No socket available');
      return;
    }

    console.log('AdminDashboard: Setting up socket listeners');

    // Join admin room
    socket.emit('join-admin');
    console.log('AdminDashboard: Emitted join-admin');

    // Listen for new orders
    socket.on('newOrder', (data) => {
      console.log('AdminDashboard: Received newOrder event:', data);

      const { order } = data;
      toast.info(
        <div>
          <div className="font-semibold">New Order Received!</div>
          <div className="text-sm">
            Order #{order.orderNumber || order._id?.slice(-8).toUpperCase()} from {order.user?.name}
          </div>
          <div className="text-sm text-gray-600">
            Floor {order.deliveryDetails?.floor}, Desk {order.deliveryDetails?.deskNumber}
          </div>
          <div className="text-sm font-medium">
            ₹{(order.finalAmount || 0).toFixed(2)} • {order.items?.length || 0} items
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
      console.log('AdminDashboard: Cleaning up socket listeners');
      socket.off('newOrder');
    };
  }, [socket]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-warning-600 bg-warning-50';
      case 'confirmed':
        return 'text-primary-600 bg-primary-50';
      // case 'preparing':
      //   return 'text-secondary-600 bg-secondary-50';
      case 'ready':
        return 'text-success-600 bg-success-50';
      case 'delivering':
        return 'text-primary-600 bg-primary-50';
      case 'delivered':
        return 'text-success-600 bg-success-50';
      case 'cancelled':
        return 'text-error-600 bg-error-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {!isAuthenticated ? (
            <p className="text-error-600 mb-4">Please log in to access the admin dashboard</p>
          ) : !hasRole(['admin', 'delivery']) ? (
            <p className="text-error-600 mb-4">You don't have permission to access the admin dashboard</p>
          ) : (
            <p className="text-error-600 mb-4">Failed to load dashboard data</p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container-mobile py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Overview of your food ordering system</p>
        </div>

        {/* Dashboard Content with Responsive Ordering */}
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Recent Orders - First on mobile, last on desktop */}
          <div className="order-1 sm:order-3 lg:order-3">
            <div className="card bg-white shadow-lg border-0">
              <div className="card-header p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-blue-600" />
                    Recent Orders
                  </h2>
                  <Link
                    to="/admin/orders"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                  >
                    View All →
                  </Link>
                </div>
              </div>
              <div className="card-body p-0 sm:p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData?.recentOrders?.map((order) => (
                        <tr
                          key={order._id}
                          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 cursor-pointer"
                          onClick={() => handleOrderClick(order)}
                        >
                          <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-semibold text-gray-900 bg-blue-100 px-2 py-1 rounded-full inline-block">
                              #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">{order.user?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{order.user?.email}</div>
                          </td>
                          <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              {formatCurrency(order.finalAmount || 0)}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 whitespace-nowrap text-xs text-gray-500">
                            {formatDate(order.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(!dashboardData?.recentOrders || dashboardData.recentOrders.length === 0) && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium">No recent orders</p>
                    <p className="text-sm">Orders will appear here as they come in</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards - Second on mobile, first on desktop */}
          <div className="order-2 sm:order-1 lg:order-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {/* Total Revenue */}
              <div className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="card-body p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-green-100 mb-1">Total Revenue</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1">
                        {formatCurrency(dashboardData?.revenue?.total || 0)}
                      </p>
                      <div className="flex items-center">
                        {dashboardData?.revenueChange >= 0 ? (
                          <ArrowUp className="w-3 h-3 text-green-200 flex-shrink-0" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-red-200 flex-shrink-0" />
                        )}
                        <span className={`text-xs ml-1 ${dashboardData?.revenueChange >= 0 ? 'text-green-200' : 'text-red-200'
                          }`}>
                          {Math.abs(dashboardData?.revenueChange || 0).toFixed(1)}%
                        </span>
                        <span className="text-xs text-green-100 ml-1">from last month</span>
                      </div>
                    </div>
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg flex-shrink-0 ml-2 backdrop-blur-sm">
                      <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white">₹</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Orders */}
              <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="card-body p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-blue-100 mb-1">Total Orders</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1">
                        {formatNumber(dashboardData?.orders?.total || 0)}
                      </p>
                      <div className="flex items-center">
                        {dashboardData?.ordersChange >= 0 ? (
                          <ArrowUp className="w-3 h-3 text-blue-200 flex-shrink-0" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-red-200 flex-shrink-0" />
                        )}
                        <span className={`text-xs ml-1 ${dashboardData?.ordersChange >= 0 ? 'text-blue-200' : 'text-red-200'
                          }`}>
                          {Math.abs(dashboardData?.ordersChange || 0).toFixed(1)}%
                        </span>
                        <span className="text-xs text-blue-100 ml-1">from last month</span>
                      </div>
                    </div>
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg flex-shrink-0 ml-2 backdrop-blur-sm">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Users */}
              <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="card-body p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-purple-100 mb-1">Total Users</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1">
                        {formatNumber(dashboardData?.users?.total || 0)}
                      </p>
                      <div className="flex items-center">
                        {dashboardData?.usersChange >= 0 ? (
                          <ArrowUp className="w-3 h-3 text-purple-200 flex-shrink-0" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-red-200 flex-shrink-0" />
                        )}
                        <span className={`text-xs ml-1 ${dashboardData?.usersChange >= 0 ? 'text-purple-200' : 'text-red-200'
                          }`}>
                          {Math.abs(dashboardData?.usersChange || 0).toFixed(1)}%
                        </span>
                        <span className="text-xs text-purple-100 ml-1">from last month</span>
                      </div>
                    </div>
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg flex-shrink-0 ml-2 backdrop-blur-sm">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Average Rating */}
              <div className="card bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="card-body p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-yellow-100 mb-1">Avg Rating</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1">
                        {(dashboardData?.averageRating || 0).toFixed(1)}
                      </p>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-200 fill-current flex-shrink-0" />
                        <span className="text-xs text-yellow-100 ml-1">out of 5</span>
                      </div>
                    </div>
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg flex-shrink-0 ml-2 backdrop-blur-sm">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions - Third on mobile, second on desktop */}
          <div className="order-3 sm:order-2 lg:order-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <Link
                to="/admin/orders"
                className="card bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-0"
              >
                <div className="card-body p-3 sm:p-4 text-center">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl w-fit mx-auto mb-3 sm:mb-4 shadow-lg">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-1">Manage Orders</h3>
                  <p className="text-xs text-gray-600">View and update order status</p>
                </div>
              </Link>

              <Link
                to="/admin/menu"
                className="card bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-0"
              >
                <div className="card-body p-3 sm:p-4 text-center">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl w-fit mx-auto mb-3 sm:mb-4 shadow-lg">
                    <Utensils className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-1">Menu Management</h3>
                  <p className="text-xs text-gray-600">Add, edit, or remove dishes</p>
                </div>
              </Link>

              <Link
                to="/admin/users"
                className="card bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-0"
              >
                <div className="card-body p-3 sm:p-4 text-center">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl w-fit mx-auto mb-3 sm:mb-4 shadow-lg">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-1">User Management</h3>
                  <p className="text-xs text-gray-600">Manage user accounts</p>
                </div>
              </Link>

              <Link
                to="/admin/analytics"
                className="card bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-0"
              >
                <div className="card-body p-3 sm:p-4 text-center">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl w-fit mx-auto mb-3 sm:mb-4 shadow-lg">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-1">Analytics</h3>
                  <p className="text-xs text-gray-600">View detailed reports</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border-0">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                  <Package className="w-6 h-6 mr-2 text-blue-600" />
                  Order Details
                </h3>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Order Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">
                        Order #{selectedOrder.orderNumber || selectedOrder._id?.slice(-8).toUpperCase()}
                      </h4>
                      <p className="text-sm text-gray-600">{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <UserCheck className="w-4 h-4 mr-2 text-blue-600" />
                    Customer Information
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedOrder.user?.name || 'Unknown'}</p>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Mail className="w-4 h-4 mr-1" />
                        {selectedOrder.user?.email}
                      </div>
                      {selectedOrder.user?.phone && (
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Phone className="w-4 h-4 mr-1" />
                          {selectedOrder.user.phone}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        Floor {selectedOrder.deliveryDetails?.floor || 'N/A'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Package className="w-4 h-4 mr-1" />
                        Desk {selectedOrder.deliveryDetails?.deskNumber || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <h5 className="text-sm font-semibold text-gray-700 p-4 border-b border-gray-200 flex items-center">
                    <ShoppingCart className="w-4 h-4 mr-2 text-green-600" />
                    Order Items ({selectedOrder.items?.length || 0})
                  </h5>
                  <div className="divide-y divide-gray-200">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.dish?.name || 'Unknown Dish'}</p>
                          <p className="text-xs text-gray-600">Quantity: {item.quantity}</p>
                          {item.specialInstructions && (
                            <p className="text-xs text-gray-500 mt-1">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2 text-green-600" />
                    Order Summary
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(selectedOrder.subtotal || 0)}</span>
                    </div>
                    {selectedOrder.deliveryFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Fee:</span>
                        <span className="font-medium">{formatCurrency(selectedOrder.deliveryFee)}</span>
                      </div>
                    )}
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium text-green-600">-{formatCurrency(selectedOrder.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-lg border-t border-green-200 pt-2">
                      <span>Total:</span>
                      <span className="text-green-600">{formatCurrency(selectedOrder.finalAmount || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                {selectedOrder.paymentMethod && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <CreditCard className="w-4 h-4 mr-2 text-purple-600" />
                      Payment Information
                    </h5>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">{selectedOrder.paymentMethod}</p>
                        <p className="text-xs text-gray-600">
                          Status: {selectedOrder.paymentStatus?.charAt(0).toUpperCase() + selectedOrder.paymentStatus?.slice(1) || 'N/A'}
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-purple-600">
                        {formatCurrency(selectedOrder.finalAmount || 0)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="btn-outline flex-1 hover:bg-gray-50 transition-all duration-200"
                >
                  Close
                </button>
                <Link
                  to={`/admin/orders`}
                  className="btn-primary flex-1 text-center bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  View All Orders
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 
