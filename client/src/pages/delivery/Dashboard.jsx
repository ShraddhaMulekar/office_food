import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  User,
  Phone,
  Navigation,
  DollarSign,
  Star,
  Upload,
  QrCode,
  ArrowLeft
} from 'lucide-react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, hasRole } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState('');

  const { data: deliveryData, isLoading, error } = useQuery(
    'deliveryDashboard',
    async () => {
      const response = await api.get('/api/delivery/dashboard');
      return response.data.data;
    },
    {
      enabled: isAuthenticated && hasRole('delivery'),
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 30 * 1000, // Refetch every 30 seconds
    }
  );

  const updateOrderStatusMutation = useMutation(
    async ({ orderId, status }) => {
      const response = await api.put(`/api/delivery/orders/${orderId}/status`, { status });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Order status updated successfully!');
        queryClient.invalidateQueries('deliveryDashboard');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update order status');
      },
    }
  );

  // Upload payment proof mutation
  const uploadPaymentProofMutation = useMutation(
    async ({ orderId, paymentProof }) => {
      const formData = new FormData();
      formData.append('paymentProof', paymentProof);

      const response = await api.put(`/api/delivery/orders/${orderId}/payment-proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Payment proof uploaded successfully!');
        setShowDeliveryModal(false);
        setSelectedOrder(null);
        setPaymentProof(null);
        setPaymentProofPreview('');
        queryClient.invalidateQueries('deliveryDashboard');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to upload payment proof');
      },
    }
  );

  // Mark as delivered mutation
  const markAsDeliveredMutation = useMutation(
    async (orderId) => {
      const response = await api.put(`/api/delivery/orders/${orderId}/delivered`);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Order marked as delivered successfully!');
        setShowDeliveryModal(false);
        setSelectedOrder(null);
        queryClient.invalidateQueries('deliveryDashboard');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to mark order as delivered');
      },
    }
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return <Package className="w-4 h-4 text-success-600" />;
      case 'out_for_delivery':
        return <Truck className="w-4 h-4 text-primary-600" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-success-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready':
        return 'status-ready';
      case 'out_for_delivery':
        return 'status-delivering';
      case 'delivered':
        return 'status-delivered';
      default:
        return 'badge-gray';
    }
  };

  const getOrderCardColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-50 border-blue-200';
      case 'delivering':
        return 'bg-purple-50 border-purple-200';
      case 'delivered':
        return 'bg-green-50 border-green-200';
      case 'cancelled':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
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

  const handleUpdateStatus = (orderId, newStatus) => {
    // Map frontend status to backend status
    const statusMapping = {
      'delivering': 'out_for_delivery',
      'delivered': 'delivered'
    };

    const backendStatus = statusMapping[newStatus] || newStatus;

    updateOrderStatusMutation.mutate({
      orderId,
      status: backendStatus
    });
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
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
            <p className="text-error-600 mb-4">Please log in to access the delivery dashboard</p>
          ) : !hasRole('delivery') ? (
            <p className="text-error-600 mb-4">You don't have permission to access the delivery dashboard</p>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/delivery')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery Dashboard</h1>
          <p className="text-gray-600">Manage your assigned deliveries</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Ready for Pickup */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ready for Pickup</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {deliveryData?.readyOrders?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-success-100 rounded-lg">
                  <Package className="w-6 h-6 text-success-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Currently Delivering */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Currently Delivering</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {deliveryData?.deliveringOrders?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-primary-100 rounded-lg">
                  <Truck className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Completed Today */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Today</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {deliveryData?.completedToday || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="card">
            <div className="card-body">
              {/* <div className="flex items-center justify-between"> */}
              {/* <div>
                  <p className="text-sm font-medium text-gray-600">Today's Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${deliveryData?.todayEarnings?.toFixed(2) || '0.00'}
                  </p>
                </div> */}
              {/* <div className="p-3 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div> */}
              {/* </div> */}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ready for Pickup */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Ready for Pickup</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {deliveryData?.readyOrders && deliveryData.readyOrders.length > 0 ? (
                  deliveryData.readyOrders.map((order) => (
                    <div key={order._id} className={`border rounded-lg p-4 ${getOrderCardColor(order.status)}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <span className={`badge ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            ${order.total.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Order #{order._id.slice(-8).toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{order.user?.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 truncate">
                            {order.deliveryAddress}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {order.paymentMethod === 'cod' ? (
                            <DollarSign className="w-4 h-4 text-orange-500" />
                          ) : (
                            <QrCode className="w-4 h-4 text-blue-500" />
                          )}
                          <span className={`text-sm font-medium ${order.paymentMethod === 'cod' ? 'text-orange-600' : 'text-blue-600'
                            }`}>
                            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI/Online Payment'}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="btn-outline flex items-center flex-1 justify-center"
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          View Details
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order._id, 'delivering')}
                          className="btn-primary flex items-center flex-1 justify-center"
                        >
                          <Truck className="w-4 h-4 mr-2" />
                          Start Delivery
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No orders ready for pickup
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Currently Delivering */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Currently Delivering</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {deliveryData?.deliveringOrders && deliveryData.deliveringOrders.length > 0 ? (
                  deliveryData.deliveringOrders.map((order) => (
                    <div key={order._id} className={`border rounded-lg p-4 ${getOrderCardColor(order.status)}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <span className={`badge ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            ${order.total.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Order #{order._id.slice(-8).toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{order.user?.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 truncate">
                            {order.deliveryAddress}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {order.user?.phone || 'No phone'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {order.paymentMethod === 'cod' ? (
                            <DollarSign className="w-4 h-4 text-orange-500" />
                          ) : (
                            <QrCode className="w-4 h-4 text-blue-500" />
                          )}
                          <span className={`text-sm font-medium ${order.paymentMethod === 'cod' ? 'text-orange-600' : 'text-blue-600'
                            }`}>
                            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI/Online Payment'}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="btn-outline flex items-center flex-1 justify-center"
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDeliveryModal(true);
                          }}
                          className="btn-success flex items-center flex-1 justify-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Delivered
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No orders currently being delivered
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Completed Orders */}
        {deliveryData?.recentCompleted && deliveryData.recentCompleted.length > 0 && (
          <div className="mt-8">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold">Recently Completed</h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {deliveryData.recentCompleted.map((order) => (
                    <div key={order._id} className={`flex items-center justify-between p-4 border rounded-lg ${getOrderCardColor(order.status)}`}>
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Order #{order._id.slice(-8).toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.user?.name} • {formatDate(order.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${order.total.toFixed(2)}
                        </p>
                        {order.rating && (
                          <div className="flex items-center justify-end mt-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-500 ml-1">
                              {order.rating}/5
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {showDetailsModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
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
                    ${selectedOrder.total.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <span className={`badge ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Payment Method:</span>
                  <div className="flex items-center space-x-2">
                    {selectedOrder.paymentMethod === 'cod' ? (
                      <DollarSign className="w-4 h-4 text-orange-500" />
                    ) : (
                      <QrCode className="w-4 h-4 text-blue-500" />
                    )}
                    <span className={`text-sm font-medium ${selectedOrder.paymentMethod === 'cod' ? 'text-orange-600' : 'text-blue-600'
                      }`}>
                      {selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI/Online Payment'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-700">Delivery Address:</span>
                  <p className="text-sm text-gray-900 mt-1">{selectedOrder.deliveryAddress}</p>
                </div>

                {selectedOrder.specialInstructions && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Special Instructions:</span>
                    <p className="text-sm text-gray-900 mt-1">{selectedOrder.specialInstructions}</p>
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
                        <span className="text-gray-900">
                          ₹{(item.quantity * item.price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn-outline flex-1"
                >
                  Close
                </button>
                {selectedOrder.status === 'ready' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedOrder._id, 'delivering');
                      setShowDetailsModal(false);
                    }}
                    className="btn-primary flex items-center flex-1 justify-center"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Start Delivery
                  </button>
                )}
                {selectedOrder.status === 'out_for_delivery' && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowDeliveryModal(true);
                    }}
                    className="btn-success flex items-center flex-1 justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Completion Modal */}
        {showDeliveryModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Complete Delivery
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Order #{selectedOrder._id.slice(-8).toUpperCase()}
              </p>

              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className={`w-3 h-3 rounded-full ${selectedOrder.paymentMethod === 'cod' ? 'bg-orange-500' : 'bg-green-500'
                    }`}></div>
                  <h4 className="text-sm font-medium text-gray-700">
                    Payment Method: {selectedOrder.paymentMethod.toUpperCase()}
                  </h4>
                </div>

                {selectedOrder.paymentMethod === 'cod' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <Upload className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-orange-800 mb-1">
                            Cash on Delivery Order
                          </h5>
                          <p className="text-sm text-orange-700">
                            Please collect ₹{selectedOrder.total.toFixed(2)} in cash and upload proof of payment collection.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Payment Proof *
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setPaymentProof(file);
                              const reader = new FileReader();
                              reader.onload = (e) => setPaymentProofPreview(e.target.result);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                          id="payment-proof-upload"
                        />
                        <label htmlFor="payment-proof-upload" className="cursor-pointer">
                          {paymentProofPreview ? (
                            <div>
                              <img
                                src={paymentProofPreview}
                                alt="Payment Proof Preview"
                                className="w-full h-32 object-cover rounded-lg border mx-auto"
                              />
                              <p className="text-sm text-gray-600 mt-2">Click to change image</p>
                            </div>
                          ) : (
                            <div>
                              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">
                                Click to upload payment proof image
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Accepts: JPG, PNG, GIF (Max 10MB)
                              </p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        <strong>Note:</strong> Please ensure the payment proof clearly shows the amount collected and is legible.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (!paymentProof) {
                          toast.error('Please upload payment proof before completing delivery');
                          return;
                        }
                        uploadPaymentProofMutation.mutate({
                          orderId: selectedOrder._id,
                          paymentProof: paymentProof
                        });
                      }}
                      disabled={uploadPaymentProofMutation.isLoading || !paymentProof}
                      className="w-full btn-primary flex items-center justify-center py-3"
                    >
                      {uploadPaymentProofMutation.isLoading ? (
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Upload Proof & Complete Delivery
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-green-800 mb-1">
                            Online Payment Completed
                          </h5>
                          <p className="text-sm text-green-700">
                            Payment of ₹{selectedOrder.total.toFixed(2)} has already been processed online.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        markAsDeliveredMutation.mutate(selectedOrder._id);
                      }}
                      disabled={markAsDeliveredMutation.isLoading}
                      className="w-full btn-success flex items-center justify-center py-3"
                    >
                      {markAsDeliveredMutation.isLoading ? (
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Mark as Delivered
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setShowDeliveryModal(false);
                  setSelectedOrder(null);
                  setPaymentProof(null);
                  setPaymentProofPreview('');
                }}
                className="w-full btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 
