import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Users, 
  Search, 
  Filter, 
  Edit, 
  Shield, 
  Phone, 
  Calendar,
  Package,
  Star,
  CheckCircle,
  X,
  ArrowLeft
} from 'lucide-react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminUsers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    isActive: true,
  });
  // New user onboarding form state
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'delivery',
  });
  const [isCreating, setIsCreating] = useState(false);

  const { data: users, isLoading, error } = useQuery(
    ['adminUsers', searchTerm, roleFilter, statusFilter],
    async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('isActive', statusFilter === 'active');
      
      const response = await api.get(`/api/admin/users?${params.toString()}`);
      return response.data.data;
    }
  );

  const updateUserMutation = useMutation(
    async ({ userId, userData }) => {
      const response = await api.put(`/api/admin/users/${userId}`, userData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('User updated successfully!');
        setShowEditModal(false);
        setSelectedUser(null);
        queryClient.invalidateQueries('adminUsers');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user');
      },
    }
  );

  const toggleUserStatusMutation = useMutation(
    async ({ userId, isActive }) => {
      const response = await api.patch(`/api/admin/users/${userId}/status`, { isActive });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('User status updated successfully!');
        queryClient.invalidateQueries('adminUsers');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user status');
      },
    }
  );

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

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'delivery':
        return 'bg-blue-100 text-blue-800';
      case 'employee':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || '',
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = () => {
    if (!editForm.name || !editForm.email || !editForm.role) {
      toast.error('Please fill in all required fields');
      return;
    }
    updateUserMutation.mutate({
      userId: selectedUser._id,
      userData: editForm
    });
  };

  const handleToggleStatus = (user) => {
    toggleUserStatusMutation.mutate({
      userId: user._id,
      isActive: !user.isActive
    });
  };

  const handleNewUserChange = (e) => {
    setNewUserForm({
      ...newUserForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email || !newUserForm.phone || !newUserForm.password || !newUserForm.role) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsCreating(true);
    try {
      await api.post('/api/admin/users', newUserForm);
      toast.success('User created successfully!');
      setNewUserForm({ name: '', email: '', phone: '', password: '', role: 'delivery' });
      queryClient.invalidateQueries('adminUsers');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  // Ensure users is an array and handle the data structure properly
  const usersArray = Array.isArray(users) ? users : (users?.users || []);
  
  const filteredUsers = usersArray.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

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
          <p className="text-error-600 mb-4">Failed to load users</p>
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
      <div className="container-mobile mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Manage Users</h1>
          <p className="text-sm sm:text-base text-gray-600">View and manage user accounts</p>
        </div>

        {/* Onboard New User Form */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl shadow-lg border border-blue-200 p-6 mb-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Onboard New Admin or Delivery Agent</h2>
              <p className="text-sm text-gray-600 mt-1">Create new user accounts for your team</p>
            </div>
          </div>
          
          <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" onSubmit={handleCreateUser}>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={newUserForm.name}
                  onChange={handleNewUserChange}
                  placeholder="Enter full name"
                  className="input pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  value={newUserForm.email}
                  onChange={handleNewUserChange}
                  placeholder="Enter email address"
                  className="input pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={newUserForm.phone}
                  onChange={handleNewUserChange}
                  placeholder="Enter phone number"
                  className="input pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  name="password"
                  value={newUserForm.password}
                  onChange={handleNewUserChange}
                  placeholder="Enter password"
                  className="input pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Role</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  name="role"
                  value={newUserForm.role}
                  onChange={handleNewUserChange}
                  className="input pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="delivery">🚚 Delivery Agent</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating User...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Create User
                  </>
                )}
              </button>
            </div>
          </form>
          
          {/* Form Tips */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Quick Tips:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Delivery agents can manage deliveries and track orders</li>
                  <li>• Admins have full access to all system features</li>
                  <li>• Users will receive login credentials via email</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-4 sm:mb-6">
          <div className="card-body p-3 sm:p-4 lg:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 text-sm"
                />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="input pl-10 text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="employee">Employee</option>
                  <option value="delivery">Delivery Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input pl-10 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-center sm:justify-end">
                <span className="text-xs sm:text-sm text-gray-500">
                  {filteredUsers?.length || 0} users found
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers && filteredUsers.length > 0 ? (
            <>
              {/* Users Table for md+ screens */}
              <div className="hidden md:block">
                <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
                  <table className="w-full bg-white">
                    <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-blue-900 uppercase tracking-wider w-32">User</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-blue-900 uppercase tracking-wider w-32">Contact</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-blue-900 uppercase tracking-wider w-24">Role</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-blue-900 uppercase tracking-wider w-24">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-blue-900 uppercase tracking-wider w-28">Member Since</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-blue-900 uppercase tracking-wider w-24">Orders</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-blue-900 uppercase tracking-wider w-24">Rating</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-blue-900 uppercase tracking-wider w-32">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsers.map((user, index) => (
                        <tr key={user._id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-3">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
                                <div className="text-xs text-gray-500 truncate">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="truncate">{user.phone || 'Not provided'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getRoleColor(user.role)}`}>
                              {getRoleDisplayName(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                              user.isActive ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                              {formatDate(user.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <div className="flex items-center">
                              <Package className="w-4 h-4 text-gray-400 mr-2" />
                              {user.stats?.totalOrders || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-gray-400 mr-2" />
                              {user.stats?.averageRating ? user.stats.averageRating.toFixed(1) : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col space-y-2 min-w-0">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-medium rounded hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm"
                              >
                                <Edit className="w-3 h-3 mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => handleToggleStatus(user)}
                                className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded transition-all duration-200 shadow-sm ${
                                  user.isActive 
                                    ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700' 
                                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                                }`}
                              >
                                {user.isActive ? (
                                  <>
                                    <X className="w-3 h-3 mr-1" /> Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" /> Activate
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Users Grid for mobile (unchanged) */}
              <div className="md:hidden">
                {filteredUsers.map((user) => (
                  <div key={user._id} className="card">
                    <div className="card-body p-3 sm:p-4 lg:p-6">
                      {/* User Header - Mobile Optimized */}
                      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                        {/* User Info */}
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{user.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>

                        {/* Status Badges - Stacked on mobile */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                              {getRoleDisplayName(user.role)}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* User Details - Mobile Optimized */}
                      <div className="mt-4 sm:mt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                          {/* Contact Info */}
                          <div className="flex items-center space-x-3">
                            <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">Phone</div>
                              <div className="text-xs sm:text-sm text-gray-500 truncate">
                                {user.phone || 'Not provided'}
                              </div>
                            </div>
                          </div>

                          {/* Join Date */}
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">Member Since</div>
                              <div className="text-xs sm:text-sm text-gray-500">
                                {formatDate(user.createdAt)}
                              </div>
                            </div>
                          </div>

                          {/* Order Stats */}
                          <div className="flex items-center space-x-3">
                            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">Total Orders</div>
                              <div className="text-xs sm:text-sm text-gray-500">
                                {user.stats?.totalOrders || 0}
                              </div>
                            </div>
                          </div>

                          {/* Rating */}
                          <div className="flex items-center space-x-3">
                            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">Avg Rating</div>
                              <div className="text-xs sm:text-sm text-gray-500">
                                {user.stats?.averageRating ? user.stats.averageRating.toFixed(1) : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Bottom on mobile */}
                      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="btn-outline flex items-center justify-center text-xs sm:text-sm py-2 sm:py-2.5"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Edit User
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`btn flex items-center justify-center text-xs sm:text-sm py-2 sm:py-2.5 ${
                              user.isActive ? 'btn-error' : 'btn-success'
                            }`}
                          >
                            {user.isActive ? (
                              <>
                                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                Activate
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="text-gray-400 mb-4">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-sm sm:text-base text-gray-600">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No users have been registered yet'
                }
              </p>
            </div>
          )}
        </div>

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit User
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select role</option>
                    <option value="employee">Employee</option>
                    <option value="delivery">Delivery Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active Account
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  onClick={handleUpdateUser}
                  disabled={updateUserMutation.isLoading}
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  {updateUserMutation.isLoading ? (
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Update User
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers; 
