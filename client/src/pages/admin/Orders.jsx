import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  Search,
  Eye,
  Edit,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  DollarSign,
  X,
  ExternalLink,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Orders = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDeliveryAgent, setSelectedDeliveryAgent] = useState('');
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [showPaymentProofModal, setShowPaymentProofModal] = useState(false);

  const { data: ordersData, isLoading, error } = useQuery(
    ['adminOrders', searchTerm, statusFilter, currentPage, pageSize],
    async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());
      
      const response = await api.get(`/api/admin/orders?${params.toString()}`);
      return response.data.data;
    }
  );

  const orders = ordersData?.orders || [];
  const pagination = ordersData?.pagination || {};

  // Calculate pagination info
  const totalPages = pagination.totalPages || 1;
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const updateStatusMutation = useMutation(
    async ({ orderId, status, notes, deliveryAgentId }) => {
      const response = await api.put(`/api/admin/orders/${orderId}/status`, {
        status,
        notes,
        deliveryAgentId
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Order status updated successfully');
        setShowUpdateModal(false);
        setShowAssignModal(false);
        setSelectedOrder(null);
        setSelectedDeliveryAgent('');
        queryClient.invalidateQueries('adminOrders');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update order status');
      }
    }
  );

  // Test user notification mutation
  const testNotificationMutation = useMutation(
    async ({ userId, orderNumber }) => {
      const response = await api.post('/api/admin/test-user-notification', {
        userId,
        orderNumber
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success(`Test notification sent! User room clients: ${data.userRoomClients}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send test notification');
      }
    }
  );

  // Fetch delivery agents
  useQuery(
    'deliveryAgents',
    async () => {
      const response = await api.get('/api/admin/delivery-agents');
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        setDeliveryAgents(data.deliveryAgents || []);
      },
    }
  );

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

  const getOrderCardColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 border-amber-300';
      case 'confirmed':
        return 'bg-blue-100 border-blue-300';
      case 'delivering':
        return 'bg-purple-100 border-purple-300';
      case 'delivered':
        return 'bg-green-100 border-green-300';
      case 'cancelled':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getNextStatusOptions = (currentStatus) => {
    switch (currentStatus) {
      case 'pending':
        return ['confirmed', 'cancelled'];
      case 'confirmed':
        return ['delivering', 'cancelled'];
      case 'delivering':
        return ['delivered', 'cancelled'];
      default:
        return [];
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 mb-4">Failed to load orders</p>
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
    <div className="min-h-screen bg-gray-50">
      <div className="container-mobile py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Management</h1>
            <button
              onClick={() => {
                if (orders.length > 0) {
                  const firstOrder = orders[0];
                  testNotificationMutation.mutate({
                    userId: firstOrder.user._id,
                    orderNumber: firstOrder.orderNumber || 'TEST123'
                  });
                } else {
                  toast.error('No orders available for testing');
                }
              }}
              disabled={testNotificationMutation.isLoading || orders.length === 0}
              // className="btn-secondary text-xs sm:text-sm"
            >
              {/* {testNotificationMutation.isLoading ? 'Testing...' : 'Test User Notification'} */}
            </button>
          </div>
          <p className="text-sm sm:text-base text-gray-600">Manage and track all orders</p>
        </div>

        {/* Filters and Search */}
        <div className="card mb-6 sm:mb-8">
          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Search */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Search Orders
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                  <input
                    type="text"
                    placeholder="Search by order ID, customer name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-8 sm:pl-10 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Status Filter
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input text-xs sm:text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="delivering">Delivering</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Page Size */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Orders per page
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(parseInt(e.target.value))}
                  className="input text-xs sm:text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Refresh Button */}
              <div className="flex items-end">
                <button
                  onClick={() => queryClient.invalidateQueries('adminOrders')}
                  className="btn-outline w-full flex items-center justify-center space-x-2 text-xs sm:text-sm"
                >
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner className="w-8 h-8" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-error-600 mb-4">Failed to load orders</p>
            <button 
              onClick={() => queryClient.invalidateQueries('adminOrders')}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Orders Table for md+ screens */}
            <div className="hidden md:block">
              <div className="rounded-xl shadow-lg border border-gray-200">
                <table className="w-full bg-white">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider w-20">Order #</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider w-24">Customer</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider w-20">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider w-24">Date</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider w-20">Amount</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider w-32">Address</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider w-28">Items</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider w-24">Payment</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider w-24">Agent</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-12 text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                            <span className="text-lg font-semibold text-gray-600">No orders found</span>
                            <span className="text-sm text-gray-400 mt-1">Try adjusting your search or filter criteria</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      orders.map((order, index) => (
                        <tr key={order._id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-3 py-3">
                            <div className="flex items-center min-w-0">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2 flex-shrink-0">
                                <span className="text-white text-xs font-bold">#</span>
                              </div>
                              <span className="text-xs font-semibold text-gray-900 truncate">
                                {order.orderNumber || `ORDER${order._id?.slice(-6).toUpperCase()}`}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-2">
                                <User className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-xs font-medium text-gray-800 truncate">{order.user?.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${
                              order.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              order.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              order.status === 'preparing' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                              order.status === 'ready' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                              order.status === 'delivering' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                              order.status === 'delivered' ? 'bg-green-100 text-green-800 border border-green-200' :
                              'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1">{getStatusLabel(order.status)}</span>
                            </span>
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-600 min-w-0">
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mr-1 flex-shrink-0">
                                <Clock className="w-2 h-2 text-white" />
                              </div>
                              <span className="truncate">{formatDate(order.createdAt)}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-1">
                                <span className="text-white text-xs font-bold">₹</span>
                              </div>
                              <span className="text-xs font-bold text-green-600">
                                {(order.finalAmount || 0).toFixed(2)}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-700 min-w-0">
                            <div className="flex items-start">
                              <div className="w-4 h-4 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center mr-1 mt-0.5 flex-shrink-0">
                                <MapPin className="w-2 h-2 text-white" />
                              </div>
                              <span className="truncate">{order.deliveryDetails?.address || 'No address'}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-700 min-w-0">
                            <div className="space-y-1">
                              {order.items?.slice(0, 1).map((item, idx) => (
                                <div key={idx} className="flex items-center">
                                  <div className="w-1.5 h-1.5 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mr-1"></div>
                                  <span className="truncate">
                                    {item.dish?.name || 'Unknown'} x{item.quantity}
                                  </span>
                                </div>
                              ))}
                              {order.items?.length > 1 && (
                                <div className="flex items-center">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1"></div>
                                  <span className="text-gray-400">+{order.items.length - 1} more</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-col space-y-1">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                order.paymentMethod === 'cod' 
                                  ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                {order.paymentMethod === 'cod' ? 'COD' : 'Online'}
                              </span>
                              {order.paymentMethod === 'cod' && order.status === 'delivered' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(order);
                                    setShowPaymentProofModal(true);
                                  }}
                                  className="inline-flex items-center px-1.5 py-0.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-medium rounded hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-sm"
                                >
                                  <Eye className="w-2.5 h-2.5 mr-0.5" />
                                  {order.paymentProof ? 'View' : 'Upload'}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-700 min-w-0">
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center mr-1 flex-shrink-0 ${
                                order.deliveryStaff 
                                  ? 'bg-gradient-to-br from-blue-400 to-indigo-500' 
                                  : 'bg-gradient-to-br from-gray-300 to-gray-400'
                              }`}>
                                <Truck className="w-2 h-2 text-white" />
                              </div>
                              <span className={`truncate ${order.deliveryStaff ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                                {order.deliveryStaff ? order.deliveryStaff.name : 'Unassigned'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-col space-y-1 min-w-0">
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                }}
                                className="inline-flex items-center justify-center px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-medium rounded hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm"
                              >
                                <Eye className="w-2.5 h-2.5 mr-0.5" /> View
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowUpdateModal(true);
                                }}
                                className="inline-flex items-center justify-center px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-medium rounded hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-sm"
                              >
                                <Edit className="w-2.5 h-2.5 mr-0.5" /> Update
                              </button>
                              {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'delivering') && (
                                <button
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setShowAssignModal(true);
                                  }}
                                  className="inline-flex items-center justify-center px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-medium rounded hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-sm"
                                >
                                  <Truck className="w-2.5 h-2.5 mr-0.5" />
                                  {order.deliveryStaff ? 'Reassign' : 'Assign'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Orders Grid for mobile (unchanged) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 md:hidden">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className={`card border-2 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                    order.status === 'pending' ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300' :
                    order.status === 'confirmed' ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300' :
                    order.status === 'preparing' ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300' :
                    order.status === 'ready' ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-300' :
                    order.status === 'delivering' ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300' :
                    order.status === 'delivered' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' :
                    'bg-gradient-to-br from-red-50 to-pink-50 border-red-300'
                  }`}
                >
                  <div className="card-body">
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          order.status === 'pending' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                          order.status === 'confirmed' ? 'bg-gradient-to-br from-blue-400 to-indigo-500' :
                          order.status === 'preparing' ? 'bg-gradient-to-br from-purple-400 to-pink-500' :
                          order.status === 'ready' ? 'bg-gradient-to-br from-indigo-400 to-blue-500' :
                          order.status === 'delivering' ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                          order.status === 'delivered' ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
                          'bg-gradient-to-br from-red-400 to-pink-500'
                        }`}>
                          {getStatusIcon(order.status)}
                        </div>
                        <span className={`badge text-xs font-semibold shadow-sm ${
                          order.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          order.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          order.status === 'preparing' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          order.status === 'ready' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                          order.status === 'delivering' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-800 border border-green-200' :
                          'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                          <Clock className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs sm:text-sm text-gray-600 font-medium">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Order Info */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">#</span>
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-gray-900">
                            Order #{order.orderNumber || `ORDER${order._id?.slice(-6).toUpperCase()}`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">₹</span>
                          </div>
                          <span className="text-sm sm:text-base font-bold text-green-600">
                            {(order.finalAmount || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-xs sm:text-sm text-gray-600">
                        <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-medium">{order.user?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-start space-x-3 text-xs sm:text-sm text-gray-600">
                        <div className="w-6 h-6 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center mt-0.5">
                          <MapPin className="w-3 h-3 text-white" />
                        </div>
                        <span className="truncate">{order.deliveryDetails?.address || 'No address'}</span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 font-medium">
                        {order.items?.length || 0} items
                      </p>
                      <div className="space-y-2">
                        {order.items?.slice(0, 2).map((item, index) => (
                          <div key={index} className="flex items-center justify-between text-xs sm:text-sm">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full"></div>
                              <span className="truncate flex-1">{item.dish?.name || 'Unknown Item'}</span>
                            </div>
                            <span className="text-gray-500 ml-2 font-medium">x{item.quantity}</span>
                          </div>
                        ))}
                        {order.items?.length > 2 && (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <p className="text-xs text-gray-500 font-medium">
                              +{order.items.length - 2} more items
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        order.paymentMethod === 'cod' 
                          ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}
                      </span>
                      {order.paymentMethod === 'cod' && order.status === 'delivered' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                            setShowPaymentProofModal(true);
                          }}
                          className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-medium rounded-md hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-sm"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          {order.paymentProof ? 'View Proof' : 'Upload Proof'}
                        </button>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 mb-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          setShowUpdateModal(true);
                        }}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs sm:text-sm font-medium rounded-md hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-sm"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Update
                      </button>
                      
                      {/* Assignment/Reassignment Button */}
                      {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'delivering') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                            setShowAssignModal(true);
                          }}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs sm:text-sm font-medium rounded-md hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-sm"
                        >
                          <Truck className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {order.deliveryStaff ? 'Reassign' : 'Assign'}
                        </button>
                      )}
                    </div>

                    {/* Current Assignment Info */}
                    {order.deliveryStaff && (
                      <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                              <Truck className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-blue-800 font-medium">Assigned to:</span>
                            <span className="text-blue-900 font-semibold">{order.deliveryStaff.name}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                              setShowAssignModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {(totalPages > 1 || orders.length > 0) && (
              <div className="flex items-center justify-between mt-6 sm:mt-8">
                <div className="text-xs sm:text-sm text-gray-600">
                  {orders.length > 0 ? (
                    `Showing ${((currentPage - 1) * pageSize) + 1} to ${Math.min(currentPage * pageSize, pagination.total || orders.length)} of ${pagination.total || orders.length} orders`
                  ) : (
                    `No orders found`
                  )}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!hasPrevPage}
                      className="btn-outline px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                      Previous
                    </button>
                    <span className="text-xs sm:text-sm text-gray-600 px-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!hasNextPage}
                      className="btn-outline px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Order Details Modal */}
        {selectedOrder && !showUpdateModal && !showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Details
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Order ID:</span>
                  <span className="text-sm text-gray-900">
                    #{selectedOrder._id.slice(-8).toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Customer:</span>
                  <span className="text-sm text-gray-900">{selectedOrder.user?.name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Phone:</span>
                  <span className="text-sm text-gray-900">
                    {selectedOrder.user?.phone || 'Not provided'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total:</span>
                  <span className="text-sm font-bold text-gray-900">
                    ₹{(selectedOrder.finalAmount || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <span className={`badge ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-700">Delivery Address:</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedOrder.deliveryDetails?.address || 'N/A'}
                  </p>
                </div>

                {selectedOrder.deliveryStaff && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Delivery Agent:</span>
                    <p className="text-sm text-gray-900 mt-1">{selectedOrder.deliveryStaff.name}</p>
                  </div>
                )}

                {selectedOrder.paymentMethod === 'cod' && selectedOrder.status === 'delivered' && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Payment Proof:</span>
                    <div className="mt-2">
                      {selectedOrder.paymentProof ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setShowPaymentProofModal(true)}
                            className="btn-outline flex items-center text-sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Payment Proof
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-red-600">No payment proof uploaded</p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium text-gray-700">Order Items:</span>
                  <div className="mt-2 space-y-1">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-gray-600">
                          ₹{(item.quantity * item.price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="btn-outline flex-1"
                >
                  Close
                </button>
                {getNextStatusOptions(selectedOrder.status).length > 0 && (
                  <button
                    onClick={() => {
                      setShowUpdateModal(true);
                    }}
                    className="btn-primary flex items-center flex-1 justify-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Update Status
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {showUpdateModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Update Order Status
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Current Status: <span className="font-medium text-gray-900">{getStatusLabel(selectedOrder.status)}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Select new status:
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {['pending', 'confirmed', 'delivering', 'delivered', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      updateStatusMutation.mutate({
                        orderId: selectedOrder._id,
                        status: status,
                        notes: '',
                        deliveryAgentId: ''
                      });
                    }}
                    disabled={updateStatusMutation.isLoading || status === selectedOrder.status}
                    className={`p-3 rounded-lg border-2 transition-all font-medium ${
                      status === selectedOrder.status
                        ? 'border-gray-400 bg-gray-200 text-gray-600 cursor-not-allowed'
                        : status === 'pending'
                        ? 'border-amber-400 bg-amber-100 text-amber-800 hover:bg-amber-200 hover:border-amber-500'
                        : status === 'confirmed'
                        ? 'border-blue-400 bg-blue-100 text-blue-800 hover:bg-blue-200 hover:border-blue-500'
                        : status === 'delivering'
                        ? 'border-purple-400 bg-purple-100 text-purple-800 hover:bg-purple-200 hover:border-purple-500'
                        : status === 'delivered'
                        ? 'border-green-400 bg-green-100 text-green-800 hover:bg-green-200 hover:border-green-500'
                        : status === 'cancelled'
                        ? 'border-red-400 bg-red-100 text-red-800 hover:bg-red-200 hover:border-red-500'
                        : 'border-gray-400 bg-gray-100 text-gray-800 hover:bg-gray-200 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {status === 'pending' && <Clock className="w-4 h-4 text-amber-700" />}
                      {status === 'confirmed' && <CheckCircle className="w-4 h-4 text-blue-700" />}
                      {status === 'delivering' && <Truck className="w-4 h-4 text-purple-700" />}
                      {status === 'delivered' && <CheckCircle className="w-4 h-4 text-green-700" />}
                      {status === 'cancelled' && <X className="w-4 h-4 text-red-700" />}
                      <span className="font-medium">{getStatusLabel(status)}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedOrder(null);
                  }}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Agent Assignment Modal */}
        {showAssignModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedOrder.deliveryStaff ? 'Reassign Delivery Agent' : 'Assign Delivery Agent'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Agent
                  </label>
                  <select
                    value={selectedDeliveryAgent}
                    onChange={(e) => setSelectedDeliveryAgent(e.target.value)}
                    className="input"
                  >
                    <option value="">Select delivery agent</option>
                    {deliveryAgents.map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name} {agent.isAvailable ? '(Available)' : '(Busy)'}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedOrder.deliveryStaff && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Currently assigned to: <strong>{selectedOrder.deliveryStaff.name}</strong>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!selectedDeliveryAgent) {
                      toast.error('Please select a delivery agent');
                      return;
                    }
                    updateStatusMutation.mutate({
                      orderId: selectedOrder._id,
                      status: 'confirmed',
                      notes: '',
                      deliveryAgentId: selectedDeliveryAgent
                    });
                  }}
                  disabled={updateStatusMutation.isLoading || !selectedDeliveryAgent}
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  {updateStatusMutation.isLoading ? (
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                  ) : (
                    <Truck className="w-4 h-4 mr-2" />
                  )}
                  {selectedOrder.deliveryStaff ? 'Reassign' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Proof Viewer Modal */}
        {showPaymentProofModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment Proof - Order #{selectedOrder._id.slice(-8).toUpperCase()}
                </h3>
                <button
                  onClick={() => {
                    setShowPaymentProofModal(false);
                    setSelectedOrder(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <h4 className="text-sm font-medium text-blue-900">Cash on Delivery Payment</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Amount Collected:</span>
                      <span className="font-semibold text-blue-900 ml-2">₹{selectedOrder.finalAmount?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Delivery Agent:</span>
                      <span className="font-semibold text-blue-900 ml-2">{selectedOrder.deliveryStaff?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Delivered At:</span>
                      <span className="font-semibold text-blue-900 ml-2">
                        {selectedOrder.deliveredAt ? new Date(selectedOrder.deliveredAt).toLocaleString('en-IN') : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Customer:</span>
                      <span className="font-semibold text-blue-900 ml-2">{selectedOrder.user?.name || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Proof Image</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={`https://shreenathlunchbackend-1.onrender.com${selectedOrder.paymentProof}`}
                      alt="Payment Proof"
                      className="w-full h-auto max-h-96 object-contain bg-gray-50"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPgo=';
                      }}
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Payment Verification</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Please verify that the payment proof clearly shows the amount collected and is legible. 
                        This proof serves as documentation for cash collection.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowPaymentProofModal(false);
                    setSelectedOrder(null);
                  }}
                  className="btn-outline flex-1"
                >
                  Close
                </button>
                <a
                  href={`https://shreenathlunchbackend-1.onrender.com${selectedOrder.paymentProof}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center justify-center flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders; 
