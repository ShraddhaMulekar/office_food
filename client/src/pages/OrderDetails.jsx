import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  Star,
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  MessageSquare,
  Send
} from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [showRatingForm, setShowRatingForm] = useState(false);

  const { data: order, isLoading, error } = useQuery(
    ['order', id],
    async () => {
      const response = await api.get(`/api/orders/${id}`);
      return response.data.data.order;
    }
  );

  const rateOrderMutation = useMutation(
    async (ratingData) => {
      const response = await api.post(`/api/orders/${id}/rate`, ratingData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Thank you for your feedback!');
        setShowRatingForm(false);
        queryClient.invalidateQueries(['order', id]);
        queryClient.invalidateQueries('userOrders');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit rating');
      },
    }
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-warning-600" />;
      case 'confirmed':
        return <CheckCircle className="w-6 h-6 text-primary-600" />;
      case 'preparing':
        return <Package className="w-6 h-6 text-secondary-600" />;
      case 'ready':
        return <CheckCircle className="w-6 h-6 text-success-600" />;
      case 'delivering':
        return <Truck className="w-6 h-6 text-primary-600" />;
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-success-600" />;
      case 'cancelled':
        return <CheckCircle className="w-6 h-6 text-error-600" />;
      default:
        return <Clock className="w-6 h-6 text-gray-600" />;
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Ordered';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready';
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

  const getStatusDescription = (status) => {
    switch (status) {
      case 'pending':
        return 'Your order has been placed and is waiting for confirmation.';
      case 'confirmed':
        return 'Your order has been confirmed and is being prepared.';
      case 'preparing':
        return 'Your food is being prepared in the kitchen.';
      case 'ready':
        return 'Your order is ready and waiting for delivery.';
      case 'delivering':
        return 'Your order is on its way to you.';
      case 'delivered':
        return 'Your order has been delivered successfully.';
      case 'cancelled':
        return 'Your order has been cancelled.';
      default:
        return 'Order status unknown.';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  };

  const handleRatingSubmit = () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    rateOrderMutation.mutate({ rating, review });
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
          <p className="text-error-600 mb-4">Failed to load order details</p>
          <button 
            onClick={() => navigate('/orders')}
            className="btn-primary"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 mb-4">Order not found</p>
          <button 
            onClick={() => navigate('/orders')}
            className="btn-primary"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                Order #{order.orderNumber || (order._id ? order._id.slice(-8).toUpperCase() : 'N/A')}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="text-right sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-green-600 bg-green-50 px-4 py-2 rounded-full">
                ₹{(order.finalAmount || order.total || 0).toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">
                {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Order Status */}
        <div className="card bg-white shadow-lg border-0 mb-6">
          <div className="card-header bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(order.status)}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {getStatusLabel(order.status)}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {getStatusDescription(order.status)}
                  </p>
                </div>
              </div>
              <span className={`badge ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="card bg-white shadow-lg border-0 mb-6">
          <div className="card-header bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="w-5 h-5 mr-2 text-green-600" />
              Order Items ({order.items?.length || 0})
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200">
                  <div className="flex items-center space-x-4 min-w-0 flex-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                      {item.dish?.image ? (
                        <img
                          src={item.dish.image}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg">{item.name}</h4>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity} × ₹{item.price.toFixed(2)}
                      </p>
                      {item.specialInstructions && (
                        <p className="text-sm text-blue-600 mt-1 italic">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="font-bold text-green-600 text-lg">
                      ₹{item.totalPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="card bg-white shadow-lg border-0 mb-6">
          <div className="card-header bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
              Order Summary
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-900">₹{(order.subtotal || 0).toFixed(2)}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className="font-semibold text-gray-900">₹{order.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-semibold text-green-600">-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-3 border-t border-gray-200">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-green-600">₹{(order.finalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="card bg-white shadow-lg border-0 mb-6">
          <div className="card-header bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Truck className="w-5 h-5 mr-2 text-orange-600" />
              Delivery Information
            </h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Delivery Address</h4>
                    <p className="text-gray-600">{order.deliveryDetails?.address || 'N/A'}</p>
                    <p className="text-sm text-gray-500">
                      Floor {order.deliveryDetails?.floor || 'N/A'}, Desk {order.deliveryDetails?.deskNumber || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Order Date</h4>
                    <p className="text-gray-600">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-lg font-bold text-purple-600">₹</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Payment Method</h4>
                    <p className="text-gray-600 capitalize">{order.paymentMethod}</p>
                    <p className="text-sm text-gray-500">
                      Status: {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1) || 'N/A'}
                    </p>
                  </div>
                </div>
                
                {order.deliveryStaff && (
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Truck className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Delivery Agent</h4>
                      <p className="text-gray-600">{order.deliveryStaff.name}</p>
                      {order.deliveryStaff.phone && (
                        <p className="text-sm text-gray-500">{order.deliveryStaff.phone}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rating Section */}
        {order.status === 'delivered' && (
          <div className="card bg-white shadow-lg border-0">
            <div className="card-header bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-600" />
                Rate Your Experience
              </h3>
            </div>
            <div className="card-body">
              {!order.rating?.stars ? (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    How was your experience with this order? Share your feedback to help us improve!
                  </p>
                  
                  {/* Star Rating */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Rating:</span>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className={`text-2xl transition-colors duration-200 ${
                            star <= rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 hover:text-yellow-400'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Review Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review (Optional)
                    </label>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Share your experience..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      rows="3"
                    />
                  </div>
                  
                  <button
                    onClick={handleRatingSubmit}
                    disabled={rating === 0 || rateOrderMutation.isLoading}
                    className="btn-primary bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rateOrderMutation.isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-2" />
                        Submit Rating
                      </div>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-900">
                        Thank you for your feedback!
                      </h4>
                      <p className="text-green-700">
                        You rated this order {order.rating.stars}/5 stars
                      </p>
                      {order.rating.feedback && (
                        <p className="text-sm text-green-600 mt-1 italic">
                          "{order.rating.feedback}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails; 
