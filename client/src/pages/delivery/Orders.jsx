import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { 
  Truck, 
  Package, 
  Clock, 
  CheckCircle, 
  Search,
  Eye,
  MapPin,
  User,
  Calendar,
  Upload,
  ArrowLeft
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DeliveryOrders = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const { data: orders, isLoading, error } = useQuery(
    ['deliveryOrders', searchTerm, statusFilter, paymentFilter],
    async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (paymentFilter !== 'all') params.append('paymentMethod', paymentFilter);
      
      const response = await api.get(`/api/delivery/orders?${params.toString()}`);
      return response.data.data;
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
        queryClient.invalidateQueries('deliveryOrders');
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
        queryClient.invalidateQueries('deliveryOrders');
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
        queryClient.invalidateQueries('deliveryOrders');
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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'delivering':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      'out_for_delivery': 'out_for_delivery',
      'delivered': 'delivered'
    };
    
    const backendStatus = statusMapping[newStatus] || newStatus;
    
    updateOrderStatusMutation.mutate({
      orderId,
      status: backendStatus
    });
  };

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = 
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || 
      (paymentFilter === 'cod' && order.paymentMethod === 'cod') ||
      (paymentFilter === 'online' && order.paymentMethod !== 'cod');
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
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

  const getNextStatusOptions = (currentStatus) => {
    switch (currentStatus) {
      case 'confirmed':
        return ['delivering'];
      case 'delivering':
        return ['delivered'];
      default:
        return [];
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/delivery')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Manage your assigned delivery orders</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="delivering">On the Way</option>
              <option value="delivered">Delivered</option>
            </select>
            
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Payments</option>
              <option value="cod">COD Orders</option>
              <option value="online">Online Payments</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders && filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div key={order._id} className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span className={`badge ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                        {order.paymentMethod === 'cod' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            COD
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {order.total.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailsModal(true);
                          }}
                          className="btn-outline flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </button>
                        {order.status === 'delivering' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDeliveryModal(true);
                            }}
                            className="btn-primary flex items-center"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete Delivery
                          </button>
                        )}
                        {getNextStatusOptions(order.status).length > 0 && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDeliveryModal(true);
                            }}
                            className="btn-secondary"
                          >
                            Update Status
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Customer Info */}
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {order.user?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.user?.phone || 'No phone'}
                        </div>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">Delivery Address</div>
                        <div className="text-sm text-gray-500 truncate">
                          {order.deliveryAddress}
                        </div>
                      </div>
                    </div>

                    {/* Order Date */}
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">Order Date</div>
                        <div className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-900 mb-2">Order Items:</div>
                    <div className="space-y-2">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-gray-600">
                            ₹{(item.quantity * item.price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="text-sm text-gray-500 text-center">
                          +{order.items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Truck className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No orders have been assigned to you yet'
                }
              </p>
            </div>
          )}
        </div>

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
                    {selectedOrder.total.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <span className={`badge ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Payment Method:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`badge ${
                      selectedOrder.paymentMethod === 'cod' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedOrder.paymentMethod.toUpperCase()}
                    </span>
                    {selectedOrder.paymentMethod === 'cod' && (
                      <span className="text-xs text-orange-600 font-medium">
                        Requires Proof
                      </span>
                    )}
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
                  onClick={() => setShowDetailsModal(false)}
                  className="btn-outline flex-1"
                >
                  Close
                </button>
                {selectedOrder.status === 'confirmed' && (
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
                {selectedOrder.status === 'delivering' && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowDeliveryModal(true);
                    }}
                    className="btn-success flex items-center flex-1 justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Delivery
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
                  <div className={`w-3 h-3 rounded-full ${
                    selectedOrder.paymentMethod === 'cod' ? 'bg-orange-500' : 'bg-green-500'
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

export default DeliveryOrders; 
