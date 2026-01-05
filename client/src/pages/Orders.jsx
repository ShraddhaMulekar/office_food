import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  Star,
  Eye,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

// Add custom CSS for animations
const customStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.6s ease-out forwards;
  }
  
  .animate-fade-in:nth-child(1) { animation-delay: 0.1s; }
  .animate-fade-in:nth-child(2) { animation-delay: 0.2s; }
  .animate-fade-in:nth-child(3) { animation-delay: 0.3s; }
  .animate-fade-in:nth-child(4) { animation-delay: 0.4s; }
  .animate-fade-in:nth-child(5) { animation-delay: 0.5s; }
  
  @keyframes slideInFromTop {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-slide-in {
    animation: slideInFromTop 0.8s ease-out forwards;
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
  
  .animate-pulse-slow {
    animation: pulse 2s ease-in-out infinite;
  }
`;

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const { data: ordersData, isLoading, error, refetch } = useQuery(
    ['userOrders', currentPage, pageSize],
    async () => {
      const response = await api.get(`/api/orders?page=${currentPage}&limit=${pageSize}`);
      return response.data.data;
    },
    {
      staleTime: 30 * 1000, // 30 seconds
    }
  );

  const orders = ordersData?.orders || [];
  const pagination = ordersData?.pagination || {};

  // Calculate pagination info
  const totalPages = pagination.totalPages || 1;
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Real-time order updates
  useEffect(() => {
    if (!user) return;

    const socket = window.io;
    if (socket) {
      // Join user's room for order updates
      socket.emit('join', `user-${user._id}`);

      // Listen for order updates
      const handleOrderUpdate = (data) => {
        console.log('Order update received:', data);
        // Refetch orders to get latest status
        queryClient.invalidateQueries('userOrders');
      };

      socket.on('orderUpdate', handleOrderUpdate);

      return () => {
        socket.off('orderUpdate', handleOrderUpdate);
        socket.emit('leave', `user-${user._id}`);
      };
    }
  }, [user, queryClient]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-warning-600" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-primary-600" />;
      case 'preparing':
        return <Package className="w-4 h-4 text-secondary-600" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-success-600" />;
      case 'delivering':
        return <Truck className="w-4 h-4 text-primary-600" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-success-600" />;
      case 'cancelled':
        return <CheckCircle className="w-4 h-4 text-error-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'confirmed':
        return 'status-confirmed';
      case 'preparing':
        return 'status-preparing';
      case 'ready':
        return 'status-ready';
      case 'delivering':
        return 'status-delivering';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'badge-gray';
    }
  };

  const getStatusTimeline = (order) => {
    const statuses = [
      { key: 'pending', label: 'Ordered', icon: Clock, color: 'from-yellow-500 to-orange-500' },
      { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'from-blue-500 to-purple-500' },
      { key: 'delivering', label: 'On the Way', icon: Truck, color: 'from-purple-500 to-pink-500' },
      { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'from-green-500 to-emerald-500' }
    ];

    const currentStatusIndex = statuses.findIndex(s => s.key === order.status);

    return statuses.map((status, index) => {
      const isCompleted = index <= currentStatusIndex;
      const Icon = status.icon;

      return (
        <div key={status.key} className="flex flex-col sm:flex-row items-center animate-fade-in" style={{ animationDelay: `${index * 200}ms` }}>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all duration-500 ${isCompleted
              ? `bg-gradient-to-r ${status.color} text-white transform scale-110`
              : 'bg-gray-200 text-gray-400'
            }`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className={`mt-2 sm:mt-0 sm:ml-3 text-xs sm:text-sm text-center sm:text-left font-medium transition-all duration-300 ${isCompleted ? 'text-gray-900' : 'text-gray-500'
            }`}>
            {status.label}
          </div>
          {index < statuses.length - 1 && (
            <div className={`hidden sm:block flex-1 h-1 mx-4 rounded-full transition-all duration-500 ${isCompleted ? `bg-gradient-to-r ${status.color}` : 'bg-gray-200'
              }`} />
          )}
        </div>
      );
    });
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Ordered';
      case 'confirmed':
        return 'Confirmed';
      case 'delivering':
        return 'On the Way';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
            <LoadingSpinner className="w-10 h-10 text-white" />
          </div>
          <p className="text-gray-600 font-semibold text-lg">Loading your orders...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your order history</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Oops! Something went wrong</h3>
          <p className="text-gray-600 mb-6">Failed to load your orders. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="btn-primary bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header */}
          <div className="mb-8 animate-slide-in">
            <button
              onClick={() => navigate('/menu')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm sm:text-base transition-all duration-200 hover:bg-white hover:shadow-md px-3 py-2 rounded-lg group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
              Back to Menu
            </button>
            <div className="text-center sm:text-left">
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 animate-pulse-slow">
                My Orders
              </h1>
              <p className="text-gray-600 text-lg">Track your orders and view order history</p>
              <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    {orders.length} Order{orders.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    {orders.filter(o => o.status === 'delivered').length} Delivered
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Orders List */}
          <div className="space-y-6">
            {orders && orders.length > 0 ? (
              orders.map((order, index) => (
                <div
                  key={order._id}
                  className="card bg-white shadow-lg hover:shadow-2xl transition-all duration-500 border-0 transform hover:scale-[1.02] animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="card-header bg-gradient-to-r from-gray-50 via-blue-50 to-purple-50 border-b border-gray-200 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
                    {/* Mobile Layout - Stacked */}
                    <div className="block sm:hidden space-y-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-white rounded-lg shadow-md">
                            {getStatusIcon(order.status)}
                          </div>
                          <span className={`badge ${getStatusColor(order.status)} shadow-md`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600 text-sm bg-green-50 px-3 py-1 rounded-full shadow-sm">
                            ₹{(order.finalAmount || 0).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500 bg-blue-100 px-3 py-1 rounded-full font-medium">
                          Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                        </div>
                        <Link
                          to={`/orders/${order._id}`}
                          className="btn-outline flex items-center text-sm py-2 px-4 hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <Eye className="w-3 h-3 mr-1.5" />
                          View Details
                        </Link>
                      </div>
                    </div>

                    {/* Desktop Layout - Side by Side */}
                    <div className="hidden sm:flex items-center justify-between relative z-10">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-white rounded-lg shadow-md">
                            {getStatusIcon(order.status)}
                          </div>
                          <span className={`badge ${getStatusColor(order.status)} shadow-md`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 bg-blue-100 px-3 py-1 rounded-full font-medium">
                          Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-bold text-green-600 bg-green-50 px-4 py-2 rounded-full shadow-md">
                            ₹{(order.finalAmount || 0).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <Link
                          to={`/orders/${order._id}`}
                          className="btn-outline flex items-center hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="card-body">
                    {/* Enhanced Status Timeline */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-blue-600" />
                        Order Progress
                      </h4>
                      <div className="grid grid-cols-4 sm:flex sm:items-center sm:space-x-2 gap-2 sm:gap-0">
                        {getStatusTimeline(order)}
                      </div>
                    </div>

                    {/* Enhanced Order Items */}
                    <div className="space-y-3 mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                        <Package className="w-4 h-4 mr-2 text-green-600" />
                        Order Items
                      </h4>
                      {order.items?.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:from-blue-50 hover:to-purple-50 transition-all duration-300 shadow-sm hover:shadow-md">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                              {item.dish?.image ? (
                                <img
                                  src={item.dish.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover rounded-xl"
                                />
                              ) : (
                                <Package className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">{item.name}</div>
                              <div className="text-xs sm:text-sm text-gray-500">
                                Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="font-bold text-green-600 text-sm sm:text-base">
                              ₹{item.totalPrice.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                      {order.items && order.items.length > 3 && (
                        <div className="text-sm text-gray-500 text-center py-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                          <Package className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                          +{order.items.length - 3} more items
                        </div>
                      )}
                    </div>

                    {/* Enhanced Order Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-sm">
                        <div className="p-3 bg-blue-200 rounded-xl">
                          <Calendar className="w-4 h-4 text-blue-700" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Order Date</div>
                          <div className="text-sm text-gray-600">
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl shadow-sm">
                        <div className="p-3 bg-green-200 rounded-xl">
                          <Truck className="w-4 h-4 text-green-700" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Delivery Details</div>
                          <div className="text-sm text-gray-600 truncate">
                            {order.deliveryDetails?.address || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl shadow-sm">
                        <div className="p-3 bg-purple-200 rounded-xl">
                          <span className="text-lg font-bold text-purple-700">₹</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Payment Method</div>
                          <div className="text-sm text-gray-600 capitalize">
                            {order.paymentMethod}
                          </div>
                        </div>
                      </div>

                      {order.deliveryStaff && (
                        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl shadow-sm">
                          <div className="p-3 bg-orange-200 rounded-xl">
                            <Truck className="w-4 h-4 text-orange-700" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">Delivery Agent</div>
                            <div className="text-sm text-gray-600">
                              {order.deliveryStaff.name}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Rating Section for Delivered Orders */}
                    {order.status === 'delivered' && !order.rating?.stars && (
                      <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl border border-blue-200 shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                          <div>
                            <h4 className="font-semibold text-blue-900 flex items-center text-lg">
                              <Star className="w-5 h-5 mr-2 text-yellow-500" />
                              Rate your order
                            </h4>
                            <p className="text-sm text-blue-700 mt-1">
                              How was your experience? Share your feedback!
                            </p>
                          </div>
                          <Link
                            to={`/orders/${order._id}`}
                            className="btn-primary flex items-center justify-center sm:justify-start bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Rate Order
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Rating Display for Rated Orders */}
                    {order.rating?.stars && (
                      <div className="mt-6 p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-xl border border-green-200 shadow-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-green-200 rounded-xl">
                            <Star className="w-5 h-5 text-yellow-500 fill-current" />
                          </div>
                          <div>
                            <span className="font-semibold text-green-900 text-lg">
                              You rated this order {order.rating.stars}/5 stars
                            </span>
                            {order.rating.feedback && (
                              <p className="text-sm text-green-700 mt-2 italic">"{order.rating.feedback}"</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                  <Package className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No orders yet</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                  Start by browsing our delicious menu and placing your first order!
                </p>
                <Link to="/menu" className="btn-primary bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg px-8 py-4">
                  Browse Menu
                </Link>
              </div>
            )}
          </div>

          {/* Enhanced Pagination */}
          {orders && orders.length > 0 && totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center">
              <div className="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-xl">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!hasPrevPage}
                  className={`p-3 rounded-xl border transition-all duration-200 ${hasPrevPage
                      ? 'border-gray-300 hover:bg-gray-50 text-gray-700 hover:shadow-md hover:scale-105'
                      : 'border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${page === currentPage
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-110'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50 hover:shadow-md hover:scale-105'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!hasNextPage}
                  className={`p-3 rounded-xl border transition-all duration-200 ${hasNextPage
                      ? 'border-gray-300 hover:bg-gray-50 text-gray-700 hover:shadow-md hover:scale-105'
                      : 'border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Orders; 
