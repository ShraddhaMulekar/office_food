import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  Save, 
  X,
  Shield,
  Package,
  Star,
  Calendar,
  DollarSign
} from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Profile = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: userProfile, isLoading: userProfileLoading, error: userProfileError } = useQuery(
    'userProfile',
    async () => {
      const response = await api.get('/api/users/profile');
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
        });
      },
    }
  );

  const { data: userStats } = useQuery(
    'userStats',
    async () => {
      const response = await api.get('/api/users/stats');
      return response.data.data;
    }
  );

  // Fetch user's order history for transaction history
  const { data: orderHistory } = useQuery(
    'userOrderHistory',
    async () => {
      const response = await api.get('/api/orders');
      return response.data.data.orders;
    },
    {
      enabled: activeTab === 'transactions',
    }
  );

  const updateProfileMutation = useMutation(
    async (profileData) => {
      const response = await api.put('/api/users/profile', profileData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        queryClient.invalidateQueries('userProfile');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      },
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: userProfile?.name || '',
      email: userProfile?.email || '',
      phone: userProfile?.phone || '',
      address: userProfile?.address || '',
    });
    setIsEditing(false);
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'employee':
        return 'Office Employee';
      case 'delivery':
        return 'Delivery Staff';
      case 'admin':
        return 'Administrator';
      default:
        return role;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (userProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (userProfileError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 mb-4">Failed to load profile</p>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transaction History
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Profile Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Information */}
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Personal Information</h2>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-outline flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSubmit}
                          disabled={updateProfileMutation.isLoading}
                          className="btn-primary flex items-center"
                        >
                          {updateProfileMutation.isLoading ? (
                            <LoadingSpinner className="w-4 h-4 mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Save Changes
                        </button>
                        <button
                          onClick={handleCancel}
                          className="btn-outline flex items-center"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="input"
                            required
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <User className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{userProfile.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        {isEditing ? (
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="input"
                            required
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{userProfile.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="input"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{userProfile.phone || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      {/* Role */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role
                        </label>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Shield className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900">{getRoleDisplayName(userProfile.role)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      {isEditing ? (
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="input h-20 resize-none"
                          rows="3"
                          placeholder="Enter your address..."
                        />
                      ) : (
                        <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                          <span className="text-gray-900">
                            {userProfile.address || 'No address provided'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Account Info */}
                    <div className="pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">Member Since</div>
                            <div className="text-sm text-gray-500">
                              {formatDate(userProfile.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Shield className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">Account Status</div>
                            <div className="text-sm text-gray-500">
                              {userProfile.isActive ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* User Stats */}
                {userStats && (
                  <div className="card">
                    <div className="card-header">
                      <h3 className="text-lg font-semibold">Your Statistics</h3>
                    </div>
                    <div className="card-body space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Package className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="text-sm font-medium text-blue-900">Total Orders</div>
                            <div className="text-lg font-bold text-blue-600">
                              {userStats.totalOrders || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Star className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="text-sm font-medium text-green-900">Average Rating</div>
                            <div className="text-lg font-bold text-green-600">
                              {userStats.averageRating ? userStats.averageRating.toFixed(1) : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <DollarSign className="w-5 h-5 text-purple-600" />
                          <div>
                            <div className="text-sm font-medium text-purple-900">Total Spent</div>
                            <div className="text-lg font-bold text-purple-600">
                              ₹{userStats.totalSpent ? userStats.totalSpent.toFixed(2) : '0.00'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold">Quick Actions</h3>
                  </div>
                  <div className="card-body space-y-3">
                    <button className="w-full btn-outline flex items-center justify-center">
                      <Package className="w-4 h-4 mr-2" />
                      View Order History
                    </button>
                    <button className="w-full btn-outline flex items-center justify-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Change Password
                    </button>
                    <button className="w-full btn-outline flex items-center justify-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Notification Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold">Transaction History</h2>
                <p className="text-gray-600">View your order history and payment proofs</p>
              </div>
              <div className="card-body">
                {orderHistory && orderHistory.length > 0 ? (
                  <div className="space-y-4">
                    {orderHistory.map((order) => (
                      <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              Order #{order._id.slice(-8).toUpperCase()}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              ₹{(order.finalAmount || 0).toFixed(2)}
                            </p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'delivering' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Payment Method:</span>
                            <span className="ml-2 text-gray-600 capitalize">{order.paymentMethod}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Payment Status:</span>
                            <span className={`ml-2 ${
                              order.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'
                            }`}>
                              {order.paymentStatus === 'completed' ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        </div>

                        {/* Payment Proof for COD Orders */}
                        {order.paymentMethod === 'cod' && order.paymentProof && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <h4 className="font-medium text-gray-700 mb-2">Payment Proof</h4>
                            <div className="flex items-center space-x-3">
                              <img
                                src={`https://shreenathlunchbackend-1.onrender.com${order.paymentProof}`}
                                alt="Payment Proof"
                                className="w-16 h-16 object-cover rounded-lg border cursor-pointer"
                                onClick={() => {
                                  setShowTransactionModal(true);
                                  // You can add logic to show full-size image
                                }}
                              />
                              <div>
                                <p className="text-sm text-gray-600">Payment proof uploaded by delivery agent</p>
                                <p className="text-xs text-gray-500">
                                  {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Order Items Summary */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h4 className="font-medium text-gray-700 mb-2">Items</h4>
                          <div className="space-y-1">
                            {order.items?.slice(0, 3).map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  {item.quantity}x {item.name}
                                </span>
                                <span className="text-gray-900">
                                  ₹{item.totalPrice.toFixed(2)}
                                </span>
                              </div>
                            ))}
                            {order.items && order.items.length > 3 && (
                              <div className="text-sm text-gray-500 text-center">
                                +{order.items.length - 3} more items
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                    <p className="text-gray-600">Start ordering to see your transaction history here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 
